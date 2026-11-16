-- ============ 1. VENDOR APPLICATIONS ============
CREATE TABLE public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  shop_name text NOT NULL DEFAULT '',
  owner_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  gst text,
  bank_account text,
  ifsc text,
  status text NOT NULL DEFAULT 'not_submitted',
  reject_reason text,
  kyc jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.vendors TO authenticated;
GRANT ALL ON public.vendors TO service_role;

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendor read own or admin" ON public.vendors FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "vendor insert own" ON public.vendors FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "vendor update own or admin" ON public.vendors FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.guard_vendor_insert()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
begin
  if public.has_role(auth.uid(), 'admin') or auth.uid() is null then return new; end if;
  new.status := 'not_submitted';
  new.reject_reason := null;
  return new;
end $function$;

CREATE TRIGGER vendors_guard_insert BEFORE INSERT ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.guard_vendor_insert();

CREATE OR REPLACE FUNCTION public.guard_vendor_update()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
begin
  new.updated_at := now();
  if public.has_role(auth.uid(), 'admin') or auth.uid() is null then return new; end if;
  new.user_id := old.user_id;
  if new.status is distinct from old.status then
    if not (new.status = 'submitted' and coalesce(old.status, '') in ('not_submitted', 'rejected')) then
      raise exception 'Not allowed';
    end if;
    new.reject_reason := null;
  else
    new.status := old.status;
    new.reject_reason := old.reject_reason;
  end if;
  if old.status = 'approved' then
    new.bank_account := old.bank_account;
    new.ifsc := old.ifsc;
  end if;
  return new;
end $function$;

CREATE TRIGGER vendors_guard_update BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.guard_vendor_update();

-- ============ 2. APPROVED-VENDOR CHECK ============
CREATE OR REPLACE FUNCTION public.is_approved_vendor(_uid uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.vendors where user_id = _uid and status = 'approved'
  )
$function$;

GRANT EXECUTE ON FUNCTION public.is_approved_vendor(uuid) TO authenticated, service_role;

-- ============ 3. PRODUCTS OWNED BY A VENDOR ============
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS vendor_id uuid;
CREATE INDEX IF NOT EXISTS products_vendor_id_idx ON public.products (vendor_id);

CREATE POLICY "vendor insert own products" ON public.products FOR INSERT TO authenticated
  WITH CHECK (vendor_id = auth.uid() AND public.is_approved_vendor(auth.uid()));

CREATE POLICY "vendor update own products" ON public.products FOR UPDATE TO authenticated
  USING (vendor_id = auth.uid() AND public.is_approved_vendor(auth.uid()))
  WITH CHECK (vendor_id = auth.uid() AND public.is_approved_vendor(auth.uid()));

CREATE POLICY "vendor delete own products" ON public.products FOR DELETE TO authenticated
  USING (vendor_id = auth.uid() AND public.is_approved_vendor(auth.uid()));

-- ============ 4. PER-VENDOR ORDER SLICES ============
CREATE TABLE public.order_vendors (
  id text PRIMARY KEY,
  order_id text NOT NULL,
  vendor_id uuid NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.order_vendors TO authenticated;
GRANT ALL ON public.order_vendors TO service_role;

ALTER TABLE public.order_vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendor read own order slices" ON public.order_vendors FOR SELECT TO authenticated
  USING (vendor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin update order slices" ON public.order_vendors FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS order_vendors_vendor_idx ON public.order_vendors (vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS order_vendors_order_idx ON public.order_vendors (order_id);

-- ============ 5. VENDOR MONEY BOOK ============
CREATE TABLE public.vendor_ledger (
  id text PRIMARY KEY,
  kind text NOT NULL,
  vendor_id uuid NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.vendor_ledger TO authenticated;
GRANT ALL ON public.vendor_ledger TO service_role;

ALTER TABLE public.vendor_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendor read own ledger" ON public.vendor_ledger FOR SELECT TO authenticated
  USING (vendor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "vendor insert own payout" ON public.vendor_ledger FOR INSERT TO authenticated
  WITH CHECK (vendor_id = auth.uid() AND public.is_approved_vendor(auth.uid()));

CREATE POLICY "admin update vendor ledger" ON public.vendor_ledger FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.guard_vendor_ledger_insert()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
begin
  if public.has_role(auth.uid(), 'admin') or auth.uid() is null then return new; end if;
  new.kind := 'payout';
  new.data := jsonb_set(coalesce(new.data, '{}'::jsonb), '{status}', '"pending"'::jsonb);
  return new;
end $function$;

CREATE TRIGGER vendor_ledger_guard_insert BEFORE INSERT ON public.vendor_ledger
  FOR EACH ROW EXECUTE FUNCTION public.guard_vendor_ledger_insert();

CREATE INDEX IF NOT EXISTS vendor_ledger_vendor_idx ON public.vendor_ledger (vendor_id, created_at DESC);

-- ============ 6. PLACE ORDER: STOCK + VENDOR ATTRIBUTION ============
CREATE OR REPLACE FUNCTION public.place_order(p_order jsonb)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare
  _o text := p_order->>'id';
  _code text;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  if _o is null then raise exception 'Order id missing'; end if;

  update public.products p
     set data = jsonb_set(p.data, '{stock}',
           to_jsonb(greatest(0, coalesce((p.data->>'stock')::int, 0) - s.q)))
    from (
      select it->>'productId' as pid, coalesce(sum((it->>'qty')::int), 0) as q
        from jsonb_array_elements(p_order->'items') it
       group by 1
    ) s
   where p.id = s.pid;

  insert into public.order_vendors (id, order_id, vendor_id, data)
  select 'OV' || _o || '-' || pr.vendor_id::text,
         _o,
         pr.vendor_id,
         jsonb_build_object(
           'orderId', _o,
           'vendorId', pr.vendor_id::text,
           'shopName', coalesce(v.shop_name, ''),
           'amount', round(sum(coalesce((it->>'price')::numeric, 0) * coalesce((it->>'qty')::int, 0))),
           'items', jsonb_agg(jsonb_build_object(
              'productId', it->>'productId',
              'name', coalesce(it->>'name', ''),
              'emoji', coalesce(it->>'emoji', ''),
              'qty', coalesce((it->>'qty')::int, 0),
              'price', coalesce((it->>'price')::numeric, 0))),
           'status', coalesce(p_order->>'status', 'placed'),
           'payment', coalesce(p_order->>'payment', 'cod'),
           'paid', coalesce((p_order->>'paid')::boolean, false),
           'customer', coalesce(p_order->'customer', '{}'::jsonb),
           'note', coalesce(p_order->>'note', ''),
           'orderTotal', coalesce((p_order->>'total')::numeric, 0),
           'placedAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
    from jsonb_array_elements(p_order->'items') it
    join public.products pr on pr.id = it->>'productId'
    left join public.vendors v on v.user_id = pr.vendor_id
   where pr.vendor_id is not null
   group by pr.vendor_id, v.shop_name
   on conflict (id) do nothing;

  _code := p_order->>'couponCode';
  if _code is not null then
    update public.coupons
       set data = jsonb_set(data, '{used}', to_jsonb(coalesce((data->>'used')::int, 0) + 1))
     where code = _code;
  end if;

  insert into public.orders (id, customer_id, data) values (_o, auth.uid(), p_order);
end $function$;

-- ============ 7. KEEP VENDOR SLICES IN STEP WITH THE ORDER ============
CREATE OR REPLACE FUNCTION public.sync_order_vendor_status()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
begin
  update public.order_vendors
     set data = jsonb_set(
                  jsonb_set(data, '{status}', to_jsonb(coalesce(new.data->>'status', 'placed'))),
                  '{paid}', to_jsonb(coalesce((new.data->>'paid')::boolean, false)))
   where order_id = new.id;
  return new;
end $function$;

DROP TRIGGER IF EXISTS orders_sync_vendor_status ON public.orders;
CREATE TRIGGER orders_sync_vendor_status AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.sync_order_vendor_status();

-- ============ 8. SIGNUP AS VENDOR ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare
  _phone text := coalesce(new.raw_user_meta_data->>'phone', split_part(new.email, '@', 1));
  _meta_role text := coalesce(new.raw_user_meta_data->>'role', 'customer');
  _role app_role := case
      when _meta_role = 'delivery' then 'delivery'::app_role
      when _meta_role = 'vendor' then 'vendor'::app_role
      else 'customer'::app_role end;
begin
  if _phone = '9301499921' then _role := 'admin'; end if;
  insert into public.profiles (id, name, phone, kyc_status)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), _phone,
          case when _role = 'delivery' then 'not_submitted' else null end);
  insert into public.user_roles (user_id, role) values (new.id, _role);
  if _role = 'vendor' then
    insert into public.vendors (user_id, owner_name, phone, status)
    values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), _phone, 'not_submitted');
  end if;
  return new;
end $function$;

-- ============ 9. LIVE UPDATES FOR THE NEW TABLES ============
DO $do$
begin
  if not exists (select 1 from pg_publication_tables
                  where pubname = 'supabase_realtime' and tablename = 'vendors') then
    execute 'alter publication supabase_realtime add table public.vendors';
  end if;
  if not exists (select 1 from pg_publication_tables
                  where pubname = 'supabase_realtime' and tablename = 'order_vendors') then
    execute 'alter publication supabase_realtime add table public.order_vendors';
  end if;
  if not exists (select 1 from pg_publication_tables
                  where pubname = 'supabase_realtime' and tablename = 'vendor_ledger') then
    execute 'alter publication supabase_realtime add table public.vendor_ledger';
  end if;
end $do$;