# Deploying to Vercel (Recommended)

Since Firebase Hosting has been causing issues, we will deploy to **Vercel**. Vercel is the creators of Next.js and provides the best hosting for React/Vite apps with zero usage of complex GitHub Actions.

## Step 1: Push Your Code
Ensure all your latest code is pushed to GitHub.
```bash
git add .
git commit -m "chore: Prepare for Vercel deployment"
git push origin main
```

## Step 2: Create Vercel Account
1. Go to [https://vercel.com/signup](https://vercel.com/signup).
2. Sign up with **GitHub**.

## Step 3: Import Project
1. On your Vercel Dashboard, click **"Add New..."** -> **"Project"**.
2. Shows a list of your GitHub repos. Find `health-tracker` (or whatever you named it) and click **Import**.

## Step 4: Configure Build
Vercel detects Vite automatically. You don't need to change the Build Command.
However, you **MUST** add your Environment Variables.

1. Expand the **"Environment Variables"** section.
2. Add the keys from your `.env` file (or from your Firebase config).
   - **Name**: `VITE_FIREBASE_API_KEY` | **Value**: (Paste from your .env)
   - **Name**: `VITE_FIREBASE_AUTH_DOMAIN` | **Value**: ...
   - **Name**: `VITE_FIREBASE_PROJECT_ID` | **Value**: ...
   - **Name**: `VITE_FIREBASE_STORAGE_BUCKET` | **Value**: ...
   - **Name**: `VITE_FIREBASE_MESSAGING_SENDER_ID` | **Value**: ...
   - **Name**: `VITE_FIREBASE_APP_ID` | **Value**: ...
   - **Name**: `VITE_FIREBASE_MEASUREMENT_ID` | **Value**: ...
   - **Name**: `VITE_GOOGLE_GEN_AI_KEY` | **Value**: (Your Gemini API Key)

## Step 5: Deploy
Click **Deploy**.
- Vercel will build your site in about 1 minute.
- Once done, it will give you a live URL (e.g., `https://health-tracker-xyz.vercel.app`).

## Step 6: Update Auth Domain (Important!)
Since you have a new domain, Firebase Auth will block it by default.
1. Go to **Firebase Console** -> **Authentication** -> **Settings** -> **Authorized Domains**.
2. Click **Add Domain**.
3. Paste your new Vercel domain (e.g., `health-tracker-xyz.vercel.app`).

**That's it! Your site is now live and stable.**
