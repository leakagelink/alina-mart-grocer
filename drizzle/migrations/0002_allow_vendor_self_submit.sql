CREATE OR REPLACE FUNCTION public.guard_vendor_insert()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
begin
  if public.has_role(auth.uid(), 'admin') or auth.uid() is null then return new; end if;
  if new.status is distinct from 'submitted' then new.status := 'not_submitted'; end if;
  new.reject_reason := null;
  return new;
end $function$;