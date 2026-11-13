DROP POLICY IF EXISTS "public read coupons" ON public.coupons;
CREATE POLICY "read active coupons" ON public.coupons FOR SELECT TO authenticated
USING (coalesce((data->>'active')::boolean, false) = true OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "signed in read notifications" ON public.notifications;
CREATE POLICY "read audience notifications" ON public.notifications FOR SELECT TO authenticated
USING (coalesce(data->>'to', 'all') = 'all' OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "public read settings" ON public.app_settings;
CREATE POLICY "read app settings row" ON public.app_settings FOR SELECT TO anon, authenticated
USING (id = 1);