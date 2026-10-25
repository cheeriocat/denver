# Denver - Built Beyond Ordinary

Denver is a modern, high-performance e-commerce web application for a premium Sri Lankan apparel brand. Built with React, Vite, Firebase (Spark plan), and Cloudinary.

---

## 1. Environment Variables

Create a `.env` file in the project root based on `.env.example`:

```env
# Firebase
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Cloudinary (Unsigned upload preset)
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset_name
```

> **Note:** Never commit `.env` to version control. All client variables in Vite must start with `VITE_`.

---

## 2. Firebase Setup (Spark Plan)

Denver runs on Firebase's free **Spark plan** without requiring Cloud Functions or Firebase Storage.

### A. Create Project & Web App
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Register a new Web App (`</>`) in project settings to obtain your Firebase configuration values.
3. Paste these values into your `.env` file.

### B. Enable Authentication
1. Go to **Authentication** > **Sign-in method**.
2. Enable **Email/Password** provider (Email link is optional; passwordless is not required).

### C. Deploy Firestore Rules
Deploy the provided security rules to secure user data, orders, and administrative collections:
- **Option 1 (CLI):** Run `firebase deploy --only firestore:rules`
- **Option 2 (Console):** Copy the contents of `firestore.rules` and paste into **Firestore Database** > **Rules** tab, then click **Publish**.

### D. Initialize Firestore Collections
Create these initial documents in Firestore:
1. **`counters/orders`**:
   - Collection: `counters`
   - Document ID: `orders`
   - Fields: `count` (number) = `0`
2. **`settings/store`** (optional - the app falls back to defaults if not set):
   - Collection: `settings`
   - Document ID: `store`
   - Fields:
     - `shippingFee` (number): e.g. `350`
     - `freeShippingThreshold` (number): e.g. `10000`
     - `lowStockThreshold` (number): e.g. `5`
     - `whatsappNumber` (string): e.g. `+94 77 123 4567`
     - `bankDetails` (map):
       - `bankName` (string): e.g. `Commercial Bank`
       - `accountName` (string): e.g. `Denver Clothing (Pvt) Ltd`
       - `accountNumber` (string): e.g. `1234567890`
       - `branch` (string): e.g. `Colombo 03`

---

## 3. First Admin Document Setup

Denver restricts administrative access using document existence checks in the `admins` collection.

1. Navigate to `/register` on your site and create your store manager account (or create it in Firebase Console > Authentication).
2. Copy the **User UID** from the Authentication table.
3. Go to **Firestore Database** > **Data**.
4. Click **Start collection**:
   - Collection ID: `admins`
   - Document ID: `<Paste your user UID here>`
   - Fields:
     - `role`: `"admin"` (string)
     - `createdAt`: `timestamp`
5. Click **Save**.
6. Sign in with this account at `/admin/login` to access the admin portal.

---

## 4. Cloudinary Setup (Image Uploads)

Denver uses Cloudinary for fast, cost-free image hosting without Firebase Storage fees.

1. Sign up for a free account at [Cloudinary](https://cloudinary.com/).
2. In your Cloudinary Dashboard, find your **Cloud Name**.
3. Go to **Settings** (gear icon) > **Upload** > **Upload presets**.
4. Click **Add upload preset**:
   - Preset name: e.g. `denver_products`
   - Signing Mode: **Unsigned** (Required)
   - Folder: `denver/products` (optional, keeps your media library organized)
5. Save the preset and add both `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET` to your `.env` and deployment environment settings.

---

## 5. Firestore Indexes

Denver uses composite queries for order sorting and filtering. Deploy indexes using the Firebase CLI or manually via the console:

### Option 1: Firebase CLI
```bash
firebase deploy --only firestore:indexes
```

### Option 2: Manual Console Setup
In **Firestore Database** > **Indexes** > **Composite Indexes**, create:
1. Collection: `products`
   - Fields: `active` (ASC), `createdAt` (ASC)
2. Collection: `orders`
   - Fields: `userId` (ASC), `createdAt` (DESC)
3. Collection: `orders`
   - Fields: `status` (ASC), `createdAt` (DESC)
4. Collection: `orders`
   - Fields: `createdAt` (DESC)

---

## 6. Deploying to Vercel

1. Push your code to your GitHub / GitLab repository.
2. Log in to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your Denver repository.
4. Framework Preset: **Vite**.
5. Under **Environment Variables**, add each variable from `.env`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_CLOUDINARY_CLOUD_NAME`
   - `VITE_CLOUDINARY_UPLOAD_PRESET`
6. Click **Deploy**.

> **SPA Routing:** Denver includes `vercel.json` with an SPA rewrite rule (`/(.*)` -> `/index.html`). Direct navigation or browser refreshes on routes such as `/admin`, `/track`, or `/delivery-info` will work seamlessly.
>
> **cPanel / Apache Hosting:** If deploying to cPanel or traditional Apache servers, `public/.htaccess` is included and automatically copied into the `dist/` directory during build.

---

## 7. Adding Domains to Firebase Authorized Domains

When deploying to Vercel or a custom domain, you must authorize the domain in Firebase to allow authentication:

1. Open [Firebase Console](https://console.firebase.google.com/) > **Authentication** > **Settings** tab.
2. Select **Authorized domains**.
3. Click **Add domain**.
4. Add your Vercel domains (e.g. `your-project.vercel.app`) and any custom production domain (e.g. `denver.lk`).

---

## 8. Pre-Launch Test Checklist

Complete this checklist before opening the store to customers:

### Storefront & Shopping Flow
- [ ] **Home page**: All categories, products, and banners display properly.
- [ ] **Product Details Modal**: Size selection, stock availability, and image gallery function smoothly.
- [ ] **Cart**: Adding, updating quantity, removing items, and free-shipping threshold calculation work correctly.
- [ ] **Account Creation**: Registering a new customer account, logging in, and password reset email work.
- [ ] **Cash on Delivery Checkout**: Place an order with COD. Confirm redirect lands on Order Success page showing order number.
- [ ] **Bank Transfer Checkout**: Place an order with Bank Transfer. Verify bank account details display clearly.
- [ ] **Public Order Tracking**: Visit `/track`, enter the generated order number, and verify the timeline status loads without requiring login.
- [ ] **Customer Order History**: Check `/account/orders` while logged in to verify the order appears.

### Admin Portal (`/admin`)
- [ ] **Admin Authentication**: Non-admin accounts attempting to visit `/admin` are redirected to `/admin/login`.
- [ ] **Product Import**: In `/admin/products`, click "Import Mock Products" to seed initial inventory (if starting fresh).
- [ ] **Product Management**: Create a new product, upload an image via Cloudinary, adjust size stock, set cost price, and toggle visibility.
- [ ] **Order Status Flow**:
  - [ ] Advance an order from `Pending` to `Confirmed`. Verify stock is deducted and unit cost is snapshotted.
  - [ ] Cancel a confirmed order. Verify inventory is restored.
  - [ ] Add courier name, tracking number, and tracking URL. Check that `/track` updates immediately.
- [ ] **Store Settings**: In `/admin/settings`, update shipping fee, bank info, and WhatsApp number. Verify `/delivery-info` and `/contact` reflect the changes.
- [ ] **Reports & Dashboard**: Verify revenue, profit calculation, chart rendering, and CSV order export.

### Informational Pages
- [ ] Privacy Policy (`/privacy-policy`)
- [ ] Returns & Exchange (`/returns-exchange`)
- [ ] Delivery Info (`/delivery-info`)
- [ ] Contact (`/contact` with dynamic WhatsApp link)
