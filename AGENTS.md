<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Data lives in Lovable Cloud; `src/lib/store.ts` and `src/lib/accounts.ts` keep a sync in-memory store hydrated from DB + realtime so UI stays synchronous. Why: minimal UI churn.
- Phone login uses synthetic email `<phone>@alinamart.app` with auto-confirm. Why: phone+password without SMS.
- Admin role auto-assigned to phone 9301499921 by `handle_new_user` trigger; roles in `user_roles`. Why: no client-side role escalation.
- Vendor data lives in `vendors`, `order_vendors` and `vendor_ledger`; vendor product writes are scoped to the caller's own approved vendor row, and payout requests are raised by the vendor but only settled by an admin. Why: vendors must never touch another shop's catalogue, orders or money.
- Store homepage merchandising in the existing app_settings JSON and edit it through the existing admin RLS; use shared home-content helpers for category and section rendering. Why: content stays durable without a second catalogue or permission model.

- Keep grocery cards and shared navigation on the compact semantic surface system in global CSS; motion must respect reduced-motion and avoid transforming fixed-control ancestors. Why: consistent shopping and panel UI without disrupting mobile controls.
- Use the shared Embla offer carousel for admin-managed banners; pause rotation during interaction, hidden tabs and reduced motion. Why: touch navigation stays accessible without competing timers.
