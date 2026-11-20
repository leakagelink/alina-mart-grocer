DROP POLICY IF EXISTS "read audience notifications" ON public.notifications;
CREATE POLICY "read audience notifications" ON public.notifications FOR SELECT TO authenticated USING (data->>'to' = 'all' OR data->>'to' = auth.uid()::text OR public.has_role(auth.uid(), 'admin'));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
CREATE TABLE public.notification_reads (user_id uuid NOT NULL, notification_id text NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE, read_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id, notification_id));
GRANT SELECT, INSERT, UPDATE ON public.notification_reads TO authenticated;
GRANT ALL ON public.notification_reads TO service_role;
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own receipts" ON public.notification_reads FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "mark accessible notifications read" ON public.notification_reads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.notifications n WHERE n.id = notification_id AND (n.data->>'to' = 'all' OR n.data->>'to' = auth.uid()::text)));
CREATE POLICY "update own receipts" ON public.notification_reads FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE OR REPLACE FUNCTION public.emit_activity_notification(recipient uuid, title text, body text, title_hi text, body_hi text, order_ref text DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE nid text := 'NT' || gen_random_uuid()::text;
BEGIN
 IF recipient IS NULL THEN RETURN; END IF;
 INSERT INTO public.notifications(id,data) VALUES(nid,jsonb_build_object('id',nid,'title',title,'body',body,'titleHi',title_hi,'bodyHi',body_hi,'to',recipient::text,'at',floor(extract(epoch from clock_timestamp())*1000),'kind','activity','orderId',order_ref));
END; $$;
REVOKE ALL ON FUNCTION public.emit_activity_notification(uuid,text,text,text,text,text) FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE FUNCTION public.notify_activity_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE recipient uuid; label text; label_hi text; ref text; admin_id uuid; status text;
BEGIN
 IF TG_TABLE_NAME = 'profiles' THEN
  recipient := NEW.id;
  IF TG_OP = 'INSERT' THEN label := 'Welcome to Martigo'; label_hi := 'Martigo में आपका स्वागत है';
  ELSIF NEW.blocked IS DISTINCT FROM OLD.blocked THEN label := 'Account access updated'; label_hi := 'अकाउंट की अनुमति बदली गई';
  ELSIF NEW.kyc_status IS DISTINCT FROM OLD.kyc_status THEN label := 'Delivery KYC: ' || coalesce(NEW.kyc_status,'updated'); label_hi := 'डिलीवरी KYC अपडेट';
  ELSIF NEW.addresses IS DISTINCT FROM OLD.addresses THEN label := 'Saved addresses updated'; label_hi := 'सेव किए गए पते बदले गए';
  ELSIF NEW.name IS DISTINCT FROM OLD.name OR NEW.phone IS DISTINCT FROM OLD.phone THEN label := 'Profile updated'; label_hi := 'प्रोफ़ाइल अपडेट हुई';
  ELSE RETURN NEW; END IF;
 ELSIF TG_TABLE_NAME = 'vendors' THEN
  recipient := NEW.user_id;
  IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN label := 'Shop application: ' || NEW.status; label_hi := 'दुकान आवेदन अपडेट'; ELSE RETURN NEW; END IF;
 ELSIF TG_TABLE_NAME = 'orders' THEN
  recipient := NEW.customer_id; ref := NEW.id; status := NEW.data->>'status';
  IF TG_OP = 'INSERT' THEN label := 'Order placed'; label_hi := 'ऑर्डर हो गया';
  ELSIF NEW.data->>'status' IS DISTINCT FROM OLD.data->>'status' THEN
   label := CASE status WHEN 'packed' THEN 'Order packed' WHEN 'out_for_delivery' THEN 'Order out for delivery' WHEN 'delivered' THEN 'Order delivered' WHEN 'cancelled' THEN 'Order cancelled' ELSE 'Order updated' END;
   label_hi := CASE status WHEN 'packed' THEN 'ऑर्डर पैक हो गया' WHEN 'out_for_delivery' THEN 'ऑर्डर डिलीवरी के लिए निकला' WHEN 'delivered' THEN 'ऑर्डर डिलीवर हो गया' WHEN 'cancelled' THEN 'ऑर्डर रद्द हो गया' ELSE 'ऑर्डर अपडेट' END;
  ELSIF NEW.data->>'paid' IS DISTINCT FROM OLD.data->>'paid' THEN label := 'Order payment updated'; label_hi := 'ऑर्डर पेमेंट अपडेट';
  ELSIF NEW.data->>'returnReason' IS DISTINCT FROM OLD.data->>'returnReason' THEN label := 'Order return updated'; label_hi := 'ऑर्डर रिटर्न अपडेट';
  ELSE RETURN NEW; END IF;
  IF TG_OP = 'INSERT' OR NEW.data->>'riderId' IS DISTINCT FROM OLD.data->>'riderId' THEN
   IF coalesce(NEW.data->>'riderId','') ~ '^[0-9a-fA-F-]{36}$' THEN PERFORM public.emit_activity_notification((NEW.data->>'riderId')::uuid,'Delivery assigned','Order #'||ref||' is assigned to you.','डिलीवरी मिली','ऑर्डर #'||ref||' आपको मिला है।',ref); END IF;
  END IF;
 ELSIF TG_TABLE_NAME = 'order_vendors' THEN
  recipient := NEW.vendor_id; ref := NEW.order_id;
  IF TG_OP = 'INSERT' THEN label := 'New shop order'; label_hi := 'दुकान को नया ऑर्डर';
  ELSIF NEW.data->>'status' IS DISTINCT FROM OLD.data->>'status' THEN label := 'Shop order updated'; label_hi := 'दुकान ऑर्डर अपडेट'; ELSE RETURN NEW; END IF;
 ELSE
  IF TG_TABLE_NAME = 'vendor_ledger' THEN recipient := NEW.vendor_id; ELSE recipient := NEW.rider_id; END IF;
  IF TG_OP = 'INSERT' THEN label := CASE NEW.kind WHEN 'payout' THEN 'Payout requested' WHEN 'deposit' THEN 'Cash deposit recorded' ELSE 'Earnings updated' END; label_hi := 'पैसे का हिसाब अपडेट';
  ELSIF NEW.data->>'status' IS DISTINCT FROM OLD.data->>'status' THEN label := 'Payout status: '||coalesce(NEW.data->>'status','updated'); label_hi := 'पayout स्थिति अपडेट'; ELSE RETURN NEW; END IF;
 END IF;
 PERFORM public.emit_activity_notification(recipient,label,CASE WHEN ref IS NOT NULL THEN 'Order #'||ref||': '||label ELSE label END,label_hi,CASE WHEN ref IS NOT NULL THEN 'ऑर्डर #'||ref||': '||label_hi ELSE label_hi END,ref);
 IF (TG_TABLE_NAME = 'orders' AND TG_OP = 'INSERT') OR (TG_TABLE_NAME = 'vendors' AND NEW.status = 'submitted') OR (TG_TABLE_NAME = 'profiles' AND NEW.kyc_status = 'submitted') OR (TG_TABLE_NAME IN ('rider_ledger','vendor_ledger') AND TG_OP = 'INSERT') THEN
  FOR admin_id IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
   IF admin_id <> recipient THEN PERFORM public.emit_activity_notification(admin_id,'Action update: '||label,label,'नई गतिविधि',label_hi,ref); END IF;
  END LOOP;
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.notify_activity_change() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER notifications_profile_activity AFTER INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.notify_activity_change();
CREATE TRIGGER notifications_vendor_activity AFTER INSERT OR UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.notify_activity_change();
CREATE TRIGGER notifications_order_activity AFTER INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.notify_activity_change();
CREATE TRIGGER notifications_shop_order_activity AFTER INSERT OR UPDATE ON public.order_vendors FOR EACH ROW EXECUTE FUNCTION public.notify_activity_change();
CREATE TRIGGER notifications_rider_ledger_activity AFTER INSERT OR UPDATE ON public.rider_ledger FOR EACH ROW EXECUTE FUNCTION public.notify_activity_change();
CREATE TRIGGER notifications_vendor_ledger_activity AFTER INSERT OR UPDATE ON public.vendor_ledger FOR EACH ROW EXECUTE FUNCTION public.notify_activity_change();
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='notifications') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; END IF; END $$;