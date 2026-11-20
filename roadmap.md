# Martigo — Roadmap

## Done
- Customer app (shop, cart, COD/online demo payment, tracking)
- Admin panel (/admin) — orders, products, stock, stats
- Delivery partner panel (/delivery) — pickups, active deliveries, COD collection, call customer
- Splash screen + animations
- Real product photos for all 24 seeded products (emoji fallback; admin can paste a photo URL)
- Capacitor config for Android APK (loads live site)
- Vendor system: vendor signup, shop application (KYC-style), admin approve/reject, vendor's own products, vendor orders, earnings + payout request, admin marks payout paid

## Open
- [x] Blinkit-reference UI polish across home sections, shared navigation, product cards and panel surfaces; cart flow and 320/393/768/2277px checked, four home-content tests pass. Admin session did not grant panel access, so signed-in panel visual checks remain unverified.
- [x] Blinkit-style home with admin-managed banners, categories and ordered product sections; mobile 320/393px and desktop checked, signed-in admin save/read-back verified.
- [ ] User: git pull + run Android build commands (APK test)
- [x] Backend live: login (phone+password), roles, products, orders, coupons, settings, KYC, rider cash/payout, realtime sync
- [ ] Real online payment (Razorpay/UPI) — needs user's Razorpay keys
- [ ] Push/SMS notifications — needs provider choice
- [ ] Delivery app Zepto/Blinkit-level features (rider login, earnings, online/offline toggle, map navigation) — backend ke baad
- [ ] Play Store publish (signed AAB, app icon, screenshots)
