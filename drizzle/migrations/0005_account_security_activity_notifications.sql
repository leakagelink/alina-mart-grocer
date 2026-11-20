CREATE OR REPLACE FUNCTION public.record_account_activity(activity text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 CASE activity
 WHEN 'login' THEN PERFORM public.emit_activity_notification(auth.uid(),'Signed in successfully','You signed in to your Martigo account.','लॉगिन सफल','आपने Martigo अकाउंट में लॉगिन किया।');
 WHEN 'password' THEN PERFORM public.emit_activity_notification(auth.uid(),'Password changed','Your account password was changed.','पासवर्ड बदला गया','आपके अकाउंट का पासवर्ड बदल दिया गया।');
 WHEN 'language' THEN PERFORM public.emit_activity_notification(auth.uid(),'Language changed','Your preferred app language was updated.','भाषा बदली गई','ऐप की भाषा बदल दी गई।');
 ELSE RAISE EXCEPTION 'Unsupported activity'; END CASE;
END; $$;
REVOKE ALL ON FUNCTION public.record_account_activity(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_account_activity(text) TO authenticated;