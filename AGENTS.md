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
- Use the shared voice-search control with browser SpeechRecognition on web and a dynamically imported native speech plugin on Capacitor; keep transcript matching in the shared product-search helper. Why: Android WebViews need native microphone recognition and both search bars must behave consistently.
- Normalize Hindi and English product terms through shared bilingual concepts, preserving literal partial English matching; typing a global search clears category selection. Why: typed and spoken searches must find the same products regardless of the previous category.
- Generate durable activity notifications with database triggers and scoped account-activity RPCs; keep admin messages in the existing notifications table and per-user receipts in notification_reads. Why: updates arrive across devices without granting users message-sending privileges or sharing read state.
- Keep support requests in an owner-scoped table with admin-only replies and trigger-generated activity alerts; share the inbox UI between customer and admin pages. Why: private requests stay durable and admins can respond without external contact credentials.
- Store social profile URLs on the existing private profile with shared client validation and a database validation trigger; these are links, not OAuth connections. Why: users manage account links without granting provider access or storing credentials.
