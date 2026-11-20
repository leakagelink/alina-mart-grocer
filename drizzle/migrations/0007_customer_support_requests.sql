CREATE TABLE public.support_requests (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, subject text NOT NULL, message text NOT NULL, reply text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'open', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE ON public.support_requests TO authenticated;
GRANT ALL ON public.support_requests TO service_role;
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own support or admin" ON public.support_requests FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "create own support" ON public.support_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND reply = '' AND status = 'open');
CREATE POLICY "admin reply support" ON public.support_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE OR REPLACE FUNCTION public.support_request_event() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE admin_id uuid;
BEGIN
 IF length(trim(NEW.subject)) NOT BETWEEN 3 AND 80 OR length(trim(NEW.message)) NOT BETWEEN 10 AND 2000 OR length(NEW.reply) > 2000 OR NEW.status NOT IN ('open','resolved') THEN RAISE EXCEPTION 'Invalid support request'; END IF;
 NEW.updated_at := now();
 IF TG_OP = 'INSERT' THEN
  FOR admin_id IN SELECT user_id FROM public.user_roles WHERE role='admin' LOOP
   PERFORM public.emit_activity_notification(admin_id,'New support request',NEW.subject,'नया सपोर्ट अनुरोध',NEW.subject);
  END LOOP;
 ELSIF NEW.reply IS DISTINCT FROM OLD.reply OR NEW.status IS DISTINCT FROM OLD.status THEN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.subject IS DISTINCT FROM OLD.subject OR NEW.message IS DISTINCT FROM OLD.message THEN RAISE EXCEPTION 'Original request cannot change'; END IF;
  PERFORM public.emit_activity_notification(NEW.user_id,'Support update',NEW.subject||': '||CASE WHEN NEW.reply <> '' THEN NEW.reply ELSE NEW.status END,'सपोर्ट अपडेट',NEW.subject||': '||CASE WHEN NEW.reply <> '' THEN NEW.reply ELSE NEW.status END);
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.support_request_event() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER support_request_updates BEFORE INSERT OR UPDATE ON public.support_requests FOR EACH ROW EXECUTE FUNCTION public.support_request_event();
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_requests;