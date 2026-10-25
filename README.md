# DENVER - Built Beyond Ordinary

A full e-commerce store for premium t-shirts, built with **React + Vite** and **Firebase**. Customers can browse, sign up, order, and track parcels. The owner manages products, stock, orders, and profit from a protected admin panel, with no code changes needed.

> Live site:https://denver-r4en23v7g-cheeriocat.vercel.app/


---

## Features

### Customer side
- Product catalogue loaded live from Firestore, with category filters
- Size selection with per-size stock limits
- Cart that survives page refresh
- Sign up and login with email/password or Google, plus password reset
- Checkout with **Cash on Delivery** or **Bank Transfer**
- Free shipping above a threshold set in the admin settings
- Unique order numbers (for example `DNV-1004-1PIL`)
- **My Orders** page with a status timeline and courier details
- **Public order tracking** at `/track` (order number only, no login, no personal data shown)
- Policy pages: Privacy, Returns & Exchange, Delivery Info, Contact (with WhatsApp link)

### Admin side (separate login at `/admin/login`)
- Role-protected panel: only accounts listed in the `admins` collection can enter
- **Products:** add, edit, hide, delete, image upload (Cloudinary), stock per size, cost price
- **Orders:** filter, search, status changes (Pending, Confirmed, Packed, Shipped, Delivered, Cancelled), courier name, tracking number and link
- **Stock:** deducted safely in a transaction when an order is confirmed, restored when a confirmed order is cancelled
- **Dashboard:** orders today and this month, items sold, revenue, profit, low-stock list
- **Reports:** sales by product, revenue and profit by date range, CSV export
- **Settings:** shipping fee, free-shipping threshold, bank details, low-stock level, WhatsApp number

---

## Tech stack

| Area | Technology |
|---|---|
| Front end | React, Vite, React Router |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Images | Cloudinary (unsigned upload preset) |
| Hosting | Vercel (also works on Firebase Hosting or cPanel) |

No custom server is used. Security is enforced by Firestore security rules.

---

## Project structure

```
.
├── public/                  # Static files (.htaccess for Apache/cPanel hosting)
├── src/
│   ├── admin/               # Admin panel pages and order actions
│   ├── components/          # Shared UI components
│   ├── contexts/            # Auth and cart context
│   ├── hooks/               # useProducts, useSettings, useSEO, ...
│   ├── lib/firebase.js      # Firebase initialisation
│   ├── pages/               # Customer pages (checkout, orders, track, policies, ...)
│   ├── scripts/             # One-time seed script for mock products
│   ├── App.jsx              # Routes
│   └── main.jsx
├── firebase.json
├── firestore.rules          # Security rules
├── firestore.indexes.json   # Composite indexes
├── vercel.json              # SPA rewrite for Vercel
└── .env.example             # Environment variable template
```

---

## Getting started (local)

### 1. Install

```bash
git clone https://github.com/cheeriocat/denver.git
cd denver
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in the values:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

Never commit `.env`. It is already listed in `.gitignore`.

### 3. Run

```bash
npm run dev
```

Open http://localhost:5173.

---

## Firebase setup

1. Create a project at the [Firebase console](https://console.firebase.google.com) and register a **web app**. Copy the config values into `.env`.
2. **Authentication:** enable **Email/Password** and **Google**.
3. **Firestore:** create a database (production mode).
4. **Rules:** copy the contents of `firestore.rules` into **Firestore, Rules** and click **Publish**.
5. **Starting counter:** create the collection `counters` with a document `orders` that has a number field `count` set to `1000`. The first order will then be `DNV-1001-...`.
6. **Indexes:** create these composite indexes (or click the link in the browser console the first time an "index required" error appears):
   - `orders`: `userId` (ascending), `createdAt` (descending)
   - `products`: `active` (ascending), `createdAt` (ascending)
7. **Authorized domains:** in **Authentication, Settings, Authorized domains**, add your Vercel addresses and your own domain (and the `www` version). Login fails on any address not listed.

### Create the first admin

1. Run the site and sign up at `/signup` with your admin email.
2. In **Firebase, Authentication, Users**, copy your **User UID**.
3. In **Firestore**, create the collection `admins` with a document whose ID is that UID and a field `role` set to `admin`.
4. Sign in at `/admin/login`.
5. Open **Products** and use **Import mock data** to load sample products, then replace them with your own.

### Cloudinary (product images)

1. Create a free account and note your **cloud name**.
2. **Settings, Upload, Upload presets:** add a preset named `denver_products` with **Signing mode: Unsigned**.
3. Put both values in `.env`.

---

## Data model (Firestore)

| Collection | Purpose | Access |
|---|---|---|
| `products` | Public product details and stock per size | Public read, admin write |
| `productCosts` | Cost price per product | Admin only |
| `orders` | Customer orders | Customer: create and read own. Admin: everything |
| `orderTracking` | Public status mirror, keyed by order number | Public single-document read, admin write |
| `users` | Customer profile | Owner only |
| `admins` | Admin accounts (document ID is the UID) | Owner can read own document |
| `settings` | Shipping, bank details, WhatsApp, thresholds | Public read, admin write |
| `counters` | Order number counter | Signed-in users may only increment by 1 |
| `stats` | Dashboard summary | Admin only |

Prices and cost prices are stored on each order at the time of sale, so profit reports stay correct when prices change later.

---

## Security notes

- Admin access is checked by Firestore rules (existence of `admins/{uid}`), not only by the front end.
- Customers cannot read other customers' orders, cannot edit order status or tracking, and cannot read cost prices.
- Order totals are submitted by the browser, so the admin panel **recalculates the total on confirmation** and warns about any mismatch. Do not confirm orders with a mismatched total.
- Use a strong, unique password and two-step verification on the admin email account.
- Keep the `admins` collection to trusted accounts only.

---

## Order tracking

Local couriers usually have no API for small shops, so tracking is entered by hand:

1. Hand the parcel to the courier and get a tracking number.
2. In **Admin, Orders**, set the status to **Shipped** and enter the courier name, tracking number, and tracking link.
3. Customers see the details in **My Orders** and at `/track`.

---

## Deployment

### Vercel (current setup)

1. Import the GitHub repo into Vercel (the Vite preset is detected automatically).
2. Add all `VITE_...` variables under **Settings, Environment Variables**.
3. `vercel.json` rewrites all paths to `index.html`, so refreshing `/admin` or `/track` works.
4. Add your domain under **Settings, Domains** and set the DNS records at your domain provider.
5. Add the domain to Firebase **Authorized domains**.

Pushing to a branch creates a preview deployment. Merging into `main` updates production. Preview deployments may be protected by Vercel login; turn this off under **Settings, Deployment Protection** if you want to open them on a phone.

### Firebase Hosting or cPanel

- Firebase Hosting: `npm run build`, then `firebase deploy --only hosting`.
- cPanel: upload the contents of `dist` and keep `public/.htaccess` (it provides the single-page-app rewrite). Enable SSL.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run dev -- --host` | Dev server reachable from a phone on the same Wi-Fi |
| `npm run build` | Production build into `dist` |
| `npm run preview` | Preview the production build locally |

---

## Pre-launch checklist

- [ ] Real products added, with prices, cost prices, photos, and stock
- [ ] Settings filled in (bank details, shipping fee, WhatsApp number)
- [ ] Policy pages edited to match how the shop really works
- [ ] Test orders removed so reports start clean
- [ ] Full order test: place, confirm, pack, ship, deliver, check `/track`
- [ ] Customer account cannot open `/admin`
- [ ] Domain connected and added to Firebase Authorized domains
- [ ] Strong admin password with two-step verification
- [ ] Firestore backup exported

---

## Roadmap

- Order emails and WhatsApp messages on confirmation and shipping
- Card payments with a Sri Lankan gateway (for example PayHere)
- Editable policy pages from the admin panel
- Automatic stock handling in Cloud Functions on a paid Firebase plan

---

## Author

Built by **Kaveen** - [@cheeriocat](https://github.com/cheeriocat)
