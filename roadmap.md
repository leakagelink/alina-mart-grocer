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
- [x] Added two photo banners (three total) with automatic sliding and 12 photo test products plus pantry category/section; all slides verified at 320/393/1280px in light/dark, all new product images and rice-to-cart flow verified, six tests pass. Existing admin management retained.
- [x] Blinkit-reference UI polish across home sections, shared navigation, product cards and panel surfaces; cart flow and 320/393/768/2277px checked, all 27 product pages and public screens checked in light/dark at phone/desktop widths, reduced-motion verified, four home-content tests pass. Admin session did not grant panel access, so signed-in panel visual checks remain unverified.
- [x] Blinkit-style home with admin-managed banners, categories and ordered product sections; mobile 320/393px and desktop checked, signed-in admin save/read-back verified.
- [ ] User: git pull + run Android build commands (APK test)
- [x] Backend live: login (phone+password), roles, products, orders, coupons, settings, KYC, rider cash/payout, realtime sync
- [ ] Real online payment (Razorpay/UPI) — needs user's Razorpay keys
- [ ] Push/SMS notifications — needs provider choice
- [ ] Delivery app Zepto/Blinkit-level features (rider login, earnings, online/offline toggle, map navigation) — backend ke baad
- [ ] Play Store publish (signed AAB, app icon, screenshots)
