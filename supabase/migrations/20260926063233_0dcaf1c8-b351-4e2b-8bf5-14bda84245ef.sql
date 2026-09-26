revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.guard_profile_update() from public, anon, authenticated;
revoke execute on function public.place_order(jsonb) from public, anon;
revoke execute on function public.has_role(uuid, app_role) from public, anon;
revoke execute on function public.is_approved_rider(uuid) from public, anon;
grant execute on function public.has_role(uuid, app_role) to authenticated;
grant execute on function public.is_approved_rider(uuid) to authenticated;
grant execute on function public.place_order(jsonb) to authenticated;