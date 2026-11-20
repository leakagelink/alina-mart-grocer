CREATE OR REPLACE FUNCTION public.notify_activity_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n jsonb := to_jsonb(NEW); o jsonb := '{}'::jsonb; recipient uuid; label text; hi text; ref text; admin_id uuid; notify_admin boolean := false; status text;
BEGIN
 IF TG_OP = 'UPDATE' THEN o := to_jsonb(OLD); END IF;
 CASE TG_TABLE_NAME
 WHEN 'profiles' THEN
  recipient := (n->>'id')::uuid;
  IF TG_OP = 'INSERT' THEN label := 'Welcome to Martigo'; hi := 'Martigo में आपका स्वागत है';
  ELSIF n->'blocked' IS DISTINCT FROM o->'blocked' THEN label := 'Account access updated'; hi := 'अकाउंट की अनुमति बदली गई';
  ELSIF n->'kyc_status' IS DISTINCT FROM o->'kyc_status' THEN label := 'Delivery KYC: '||coalesce(n->>'kyc_status','updated'); hi := 'डिलीवरी KYC: '||coalesce(n->>'kyc_status','updated'); notify_admin := n->>'kyc_status' = 'submitted';
  ELSIF n->'addresses' IS DISTINCT FROM o->'addresses' THEN label := 'Saved addresses updated'; hi := 'सेव किए गए पते बदले गए';
  ELSIF n->'name' IS DISTINCT FROM o->'name' OR n->'phone' IS DISTINCT FROM o->'phone' THEN label := 'Profile updated'; hi := 'प्रोफ़ाइल अपडेट हुई'; ELSE RETURN NEW; END IF;
 WHEN 'vendors' THEN
  recipient := (n->>'user_id')::uuid;
  IF TG_OP = 'INSERT' OR n->'status' IS DISTINCT FROM o->'status' THEN label := 'Shop application: '||n->>'status'; hi := 'दुकान आवेदन: '||n->>'status'; notify_admin := n->>'status' = 'submitted'; ELSE RETURN NEW; END IF;
 WHEN 'orders' THEN
  recipient := (n->>'customer_id')::uuid; ref := n->>'id'; status := n->'data'->>'status';
  IF TG_OP = 'INSERT' THEN label := 'Order placed'; hi := 'ऑर्डर हो गया'; notify_admin := true;
  ELSIF n->'data'->'status' IS DISTINCT FROM o->'data'->'status' THEN
   label := CASE status WHEN 'packed' THEN 'Order packed' WHEN 'out_for_delivery' THEN 'Order out for delivery' WHEN 'delivered' THEN 'Order delivered' WHEN 'cancelled' THEN 'Order cancelled' ELSE 'Order updated' END;
   hi := CASE status WHEN 'packed' THEN 'ऑर्डर पैक हो गया' WHEN 'out_for_delivery' THEN 'ऑर्डर डिलीवरी के लिए निकला' WHEN 'delivered' THEN 'ऑर्डर डिलीवर हो गया' WHEN 'cancelled' THEN 'ऑर्डर रद्द हो गया' ELSE 'ऑर्डर अपडेट' END;
  ELSIF n->'data'->'riderId' IS DISTINCT FROM o->'data'->'riderId' THEN label := 'Delivery partner updated'; hi := 'डिलीवरी पार्टनर बदला गया';
  ELSIF n->'data'->'paid' IS DISTINCT FROM o->'data'->'paid' THEN label := 'Order payment updated'; hi := 'ऑर्डर पेमेंट अपडेट';
  ELSIF n->'data'->'returnReason' IS DISTINCT FROM o->'data'->'returnReason' THEN label := 'Order return updated'; hi := 'ऑर्डर रिटर्न अपडेट'; ELSE RETURN NEW; END IF;
  IF n->'data'->'riderId' IS DISTINCT FROM o->'data'->'riderId' AND coalesce(n->'data'->>'riderId','') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
   PERFORM public.emit_activity_notification((n->'data'->>'riderId')::uuid,'Delivery assigned','Order #'||ref||' is assigned to you.','डिलीवरी मिली','ऑर्डर #'||ref||' आपको मिला है।',ref);
  END IF;
 WHEN 'order_vendors' THEN
  recipient := (n->>'vendor_id')::uuid; ref := n->>'order_id';
  IF TG_OP = 'INSERT' THEN label := 'New shop order'; hi := 'दुकान को नया ऑर्डर'; ELSIF n->'data'->'status' IS DISTINCT FROM o->'data'->'status' THEN label := 'Shop order updated'; hi := 'दुकान ऑर्डर अपडेट'; ELSE RETURN NEW; END IF;
 ELSE
  recipient := coalesce(n->>'vendor_id',n->>'rider_id')::uuid;
  IF TG_OP = 'INSERT' THEN label := CASE n->>'kind' WHEN 'payout' THEN 'Payout requested' WHEN 'deposit' THEN 'Cash deposit recorded' ELSE 'Earnings updated' END; hi := 'पैसे का हिसाब अपडेट'; notify_admin := true;
  ELSIF n->'data'->'status' IS DISTINCT FROM o->'data'->'status' THEN label := 'Payout status: '||coalesce(n->'data'->>'status','updated'); hi := 'पेआउट स्थिति: '||coalesce(n->'data'->>'status','updated'); ELSE RETURN NEW; END IF;
 END CASE;
 PERFORM public.emit_activity_notification(recipient,label,CASE WHEN ref IS NOT NULL THEN 'Order #'||ref||': '||label ELSE label END,hi,CASE WHEN ref IS NOT NULL THEN 'ऑर्डर #'||ref||': '||hi ELSE hi END,ref);
 IF notify_admin THEN FOR admin_id IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP IF admin_id <> recipient THEN PERFORM public.emit_activity_notification(admin_id,'Action update: '||label,label,'नई गतिविधि',hi,ref); END IF; END LOOP; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.notify_activity_change() FROM PUBLIC, anon, authenticated;