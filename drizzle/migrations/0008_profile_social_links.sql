ALTER TABLE public.profiles ADD COLUMN social_links jsonb NOT NULL DEFAULT '[]'::jsonb;
CREATE FUNCTION public.validate_profile_social_links() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE item jsonb;
BEGIN
 IF jsonb_typeof(NEW.social_links) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid social links'; END IF;
 IF jsonb_array_length(NEW.social_links) > 10 THEN RAISE EXCEPTION 'Too many social links'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(NEW.social_links) LOOP
  IF jsonb_typeof(item) <> 'object' OR coalesce(item->>'platform','') NOT IN ('facebook','instagram','x','other') OR length(coalesce(item->>'label','')) NOT BETWEEN 1 AND 40 OR length(coalesce(item->>'url','')) NOT BETWEEN 10 AND 500 OR (item->>'url') !~ '^https://[A-Za-z0-9][A-Za-z0-9.-]*\.[A-Za-z]{2,}(:[0-9]+)?([/?#][^[:space:]]*)?$' THEN RAISE EXCEPTION 'Invalid social profile link'; END IF;
  IF item->>'platform' = 'facebook' AND item->>'url' !~ '^https://(www\.)?facebook\.com/' THEN RAISE EXCEPTION 'Use a Facebook profile URL'; END IF;
  IF item->>'platform' = 'instagram' AND item->>'url' !~ '^https://(www\.)?instagram\.com/' THEN RAISE EXCEPTION 'Use an Instagram profile URL'; END IF;
  IF item->>'platform' = 'x' AND item->>'url' !~ '^https://(www\.)?(x|twitter)\.com/' THEN RAISE EXCEPTION 'Use an X profile URL'; END IF;
 END LOOP;
 RETURN NEW;
END; $$;
CREATE TRIGGER validate_social_links BEFORE INSERT OR UPDATE OF social_links ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.validate_profile_social_links();