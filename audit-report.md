# Martigo app audit — 20 November 2026

## Verified in the browser against Lovable Cloud
- Customer, approved vendor, approved delivery partner and admin password login succeeded.
- Vendor created a product; refresh retained it; customer searched it, added it to cart and placed a COD order. Admin packed it, rider picked it up, delivered it and customer read the delivered status after refresh. Vendor delivered earnings showed ₹51.
- Wrong delivery OTP showed an error. Delivery completed after checking COD collection. The OTP remains a demo based on the customer's last four phone digits, not a secure SMS OTP.
- Customer support submission persisted; admin reply/resolve was read back by the customer.
- Admin private notification reached its customer; mark-all-read persisted; admin deletion removed it. Automated notification visibility rules passed.
- All 12 admin tabs opened without page errors. Approved vendor and rider panels opened; customer could not enter admin/delivery controls. KYC approval/rejection mutation and new signup were not rerun in this audit.
- Vendor test products were removed and disappearance confirmed after refresh. Audit orders/support history remain labelled audit-only; undelivered audit orders were cancelled, while the delivered audit record remains for traceability.
- Customer screens at 320, 393 and 1280 pixels had no horizontal page overflow; signed-in admin/vendor home views also passed at 320 pixels.
- Follow-up verification opened all 39 current product detail pages, customer pages and every admin/vendor/delivery tab at 393 and 1280 pixels in both light and dark themes: 276 checks passed with no uncaught page errors, blank pages, broken loaded images or horizontal page overflow. Mobile admin tabs were reached through the actual More menu. Representative screenshots were visually inspected.
- Home images loaded without broken images in the initial check. All content routes have app-specific head metadata.
- Local offline startup message was rendered with browser networking disabled.
- 58 unit tests passed across 7 test files. Final tested browser runs had no uncaught page errors; latest preview build reports OK.

## Fixed and verified
- Customer tracking Call previously dialled a placeholder. New pickups persist the assigned rider's phone, and the customer Call URL was verified after refresh. Old orders without contact no longer offer a fake call.
- Cancelled tracking no longer says the delivery is arriving. Arrival text uses the configured delivery minutes.
- Added an idempotent Windows PowerShell helper to configure foreground location, microphone, camera, network and vibration in the locally generated Android manifest. It has not been executed here: PowerShell, Android project and an APK/device are unavailable.

## Android permissions: not a device certification
- Microphone permission is requested when voice search starts; the speech plugin declares RECORD_AUDIO and speech-service discovery.
- Delivery map calls browser geolocation; Capacitor's Android handler supports requesting coarse/fine location. The generated app manifest needs those declarations; run the README helper before building.
- Camera capture requests camera permission when declared/needed; selecting KYC/photos uses the system file picker. No contacts, SMS, background location or broad storage permission is necessary for the current features.
- Internet/vibration are normal permissions with no Allow/Deny dialog. In-app notifications have no OS notification prompt. Previously granted/permanently denied permissions may not prompt again.
- Browser location-denied feedback was observed. Actual Android Allow/Deny dialogs, speech recognition, camera capture, approximate location, Maps handoff and hardware Back still require a fresh APK on a phone. Speech plugin major 7 alongside Capacitor major 8 needs native build/device compatibility verification.
- The startup splash was checked, but reconnect/DNS failures after navigating to the remote live site may still display a WebView error; cold-start verification alone does not certify this.

## Not verified / not production integrations
- Real online payment is still simulated; Razorpay/payment credentials are absent. No real payment/refund was tested.
- Shipping partner integration is still simulated; no real shipment was booked.
- Rider location is shown locally, not verified as continuous customer-visible/background tracking.
- Payout requests/settlement, cash deposits, return flows, KYC decisions, user deletion/password reset and every admin CRUD variation were not all rerun.
- Full Hindi translation is not complete across every panel.
- No APK install, signed AAB, Play Store or live published-version certification was performed.