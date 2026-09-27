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
- The root layout currently gates every page behind a payment-hold notice with a fixed UTC deadline (2026-10-04T10:52:33Z); this is presentation-only, not payment verification or backend shutdown. Why: no app screens mount while the hold is active, and all visitors see the same deadline.
