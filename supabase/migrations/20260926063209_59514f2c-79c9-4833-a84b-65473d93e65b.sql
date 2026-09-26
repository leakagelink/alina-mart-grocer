create type public.app_role as enum ('admin','delivery','customer');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own roles or admin" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  phone text not null unique,
  addresses jsonb not null default '[]'::jsonb,
  kyc_status text,
  kyc jsonb,
  reject_reason text,
  blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "view own or admin" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "update own or admin" on public.profiles for update to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(),'admin'))
  with check (id = auth.uid() or public.has_role(auth.uid(),'admin'));

create or replace function public.is_approved_rider(_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_uid,'delivery') and exists (
    select 1 from public.profiles where id = _uid and kyc_status = 'approved' and not blocked)
$$;

create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if public.has_role(auth.uid(),'admin') or auth.uid() is null then return new; end if;
  if new.phone is distinct from old.phone or new.blocked is distinct from old.blocked
     or new.reject_reason is distinct from old.reject_reason and new.reject_reason is not null then
    raise exception 'Not allowed';
  end if;
  if new.kyc_status is distinct from old.kyc_status then
    if not (new.kyc_status = 'submitted' and coalesce(old.kyc_status,'') in ('not_submitted','rejected')) then
      raise exception 'Not allowed';
    end if;
  end if;
  return new;
end $$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _phone text := coalesce(new.raw_user_meta_data->>'phone', split_part(new.email,'@',1));
  _role app_role := case when new.raw_user_meta_data->>'role' = 'delivery' then 'delivery'::app_role else 'customer'::app_role end;
begin
  if _phone = '9301499921' then _role := 'admin'; end if;
  insert into public.profiles (id, name, phone, kyc_status)
  values (new.id, coalesce(new.raw_user_meta_data->>'name',''), _phone,
          case when _role = 'delivery' then 'not_submitted' else null end);
  insert into public.user_roles (user_id, role) values (new.id, _role);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- products
create table public.products (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "public read products" on public.products for select to anon, authenticated using (true);
create policy "admin write products" on public.products for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- coupons
create table public.coupons (
  code text primary key,
  data jsonb not null
);
grant select on public.coupons to anon, authenticated;
grant insert, update, delete on public.coupons to authenticated;
grant all on public.coupons to service_role;
alter table public.coupons enable row level security;
create policy "public read coupons" on public.coupons for select to anon, authenticated using (true);
create policy "admin write coupons" on public.coupons for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- settings
create table public.app_settings (
  id int primary key default 1,
  data jsonb not null
);
grant select on public.app_settings to anon, authenticated;
grant insert, update on public.app_settings to authenticated;
grant all on public.app_settings to service_role;
alter table public.app_settings enable row level security;
create policy "public read settings" on public.app_settings for select to anon, authenticated using (true);
create policy "admin write settings" on public.app_settings for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- notifications
create table public.notifications (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "signed in read notifications" on public.notifications for select to authenticated using (true);
create policy "admin write notifications" on public.notifications for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- orders
create table public.orders (
  id text primary key,
  customer_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);
grant select, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "read orders" on public.orders for select to authenticated
  using (customer_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.is_approved_rider(auth.uid()));
create policy "staff update orders" on public.orders for update to authenticated
  using (public.has_role(auth.uid(),'admin') or public.is_approved_rider(auth.uid()))
  with check (public.has_role(auth.uid(),'admin') or public.is_approved_rider(auth.uid()));

create or replace function public.place_order(p_order jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare it jsonb; _code text;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  for it in select * from jsonb_array_elements(p_order->'items') loop
    update public.products
      set data = jsonb_set(data,'{stock}', to_jsonb(greatest(0,(data->>'stock')::int - (it->>'qty')::int)))
      where id = it->>'productId';
  end loop;
  _code := p_order->>'couponCode';
  if _code is not null then
    update public.coupons set data = jsonb_set(data,'{used}', to_jsonb(coalesce((data->>'used')::int,0)+1)) where code = _code;
  end if;
  insert into public.orders (id, customer_id, data) values (p_order->>'id', auth.uid(), p_order);
end $$;
grant execute on function public.place_order(jsonb) to authenticated;

-- cash deposits & payouts
create table public.rider_ledger (
  id text primary key,
  kind text not null check (kind in ('deposit','payout')),
  rider_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.rider_ledger to authenticated;
grant all on public.rider_ledger to service_role;
alter table public.rider_ledger enable row level security;
create policy "read own ledger or admin" on public.rider_ledger for select to authenticated
  using (rider_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "rider insert ledger" on public.rider_ledger for insert to authenticated
  with check (rider_id = auth.uid() and public.is_approved_rider(auth.uid()));
create policy "admin update ledger" on public.rider_ledger for update to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

alter publication supabase_realtime add table public.products, public.coupons, public.app_settings,
  public.notifications, public.orders, public.rider_ledger, public.profiles;

-- seed
insert into public.app_settings (id, data) values (1, '{"deliveryFee":25,"freeDeliveryAbove":299,"deliveryMinutes":15,"codEnabled":true,"onlineEnabled":true,"announcement":""}');
insert into public.coupons (code, data) values
 ('FIRST50','{"code":"FIRST50","type":"flat","value":50,"minOrder":199,"active":true,"used":0}'),
 ('WELCOME10','{"code":"WELCOME10","type":"percent","value":10,"minOrder":149,"active":true,"used":0}'),
 ('FREEDEL','{"code":"FREEDEL","type":"freedel","value":0,"minOrder":249,"active":true,"used":0}');
insert into public.products (id, data)
select x->>'id', x from jsonb_array_elements('[
{"id":"f1","name":"Fresh Tomato","category":"fruits","price":28,"mrp":40,"unit":"500 g","emoji":"🍅","stock":40},
{"id":"f2","name":"Banana Robusta","category":"fruits","price":45,"mrp":60,"unit":"6 pcs","emoji":"🍌","stock":30},
{"id":"f3","name":"Yellow Capsicum","category":"fruits","price":62,"mrp":80,"unit":"250 g","emoji":"🫑","stock":18},
{"id":"f4","name":"Green Lettuce","category":"fruits","price":39,"mrp":55,"unit":"1 pc","emoji":"🥬","stock":12},
{"id":"f5","name":"Onion","category":"fruits","price":32,"mrp":45,"unit":"1 kg","emoji":"🧅","stock":55},
{"id":"f6","name":"Apple Shimla","category":"fruits","price":119,"mrp":160,"unit":"1 kg","emoji":"🍎","stock":22},
{"id":"d1","name":"Amul Toned Milk","category":"dairy","price":27,"mrp":30,"unit":"500 ml","emoji":"🥛","stock":60},
{"id":"d2","name":"Farm Eggs","category":"dairy","price":84,"mrp":95,"unit":"6 pcs","emoji":"🥚","stock":25},
{"id":"d3","name":"Paneer Fresh","category":"dairy","price":89,"mrp":110,"unit":"200 g","emoji":"🧀","stock":14},
{"id":"d4","name":"Curd Cup","category":"dairy","price":35,"mrp":40,"unit":"400 g","emoji":"🍶","stock":20},
{"id":"s1","name":"Potato Chips","category":"snacks","price":20,"mrp":25,"unit":"52 g","emoji":"🥔","stock":80},
{"id":"s2","name":"Choco Cookies","category":"snacks","price":45,"mrp":60,"unit":"120 g","emoji":"🍪","stock":35},
{"id":"s3","name":"Salted Peanuts","category":"snacks","price":55,"mrp":70,"unit":"200 g","emoji":"🥜","stock":28},
{"id":"s4","name":"Instant Noodles","category":"snacks","price":48,"mrp":60,"unit":"4 pack","emoji":"🍜","stock":44},
{"id":"b1","name":"Brown Bread","category":"bakery","price":42,"mrp":50,"unit":"400 g","emoji":"🍞","stock":16},
{"id":"b2","name":"Butter Croissant","category":"bakery","price":60,"mrp":75,"unit":"2 pcs","emoji":"🥐","stock":10},
{"id":"b3","name":"Pav Buns","category":"bakery","price":30,"mrp":35,"unit":"6 pcs","emoji":"🥖","stock":18},
{"id":"v1","name":"Orange Juice","category":"beverages","price":99,"mrp":120,"unit":"1 L","emoji":"🧃","stock":26},
{"id":"v2","name":"Cold Drink","category":"beverages","price":40,"mrp":45,"unit":"750 ml","emoji":"🥤","stock":50},
{"id":"v3","name":"Mineral Water","category":"beverages","price":20,"mrp":20,"unit":"1 L","emoji":"💧","stock":70},
{"id":"v4","name":"Green Tea","category":"beverages","price":149,"mrp":190,"unit":"25 bags","emoji":"🍵","stock":15},
{"id":"h1","name":"Dish Wash Gel","category":"household","price":99,"mrp":130,"unit":"500 ml","emoji":"🧴","stock":24},
{"id":"h2","name":"Floor Cleaner","category":"household","price":185,"mrp":220,"unit":"1 L","emoji":"🧹","stock":12},
{"id":"h3","name":"Toilet Soap","category":"household","price":36,"mrp":45,"unit":"100 g","emoji":"🧼","stock":40}
]'::jsonb) x;