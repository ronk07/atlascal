# Deployment Fix: Google OAuth Redirect URI

## Current Error
```
Error 400: redirect_uri_mismatch
Request details: redirect_uri=https://atlascal.vercel.app/api/auth/callback/google
```

## Quick Fix Steps

### 1. Add Production Redirect URI to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Find and click on your **OAuth 2.0 Client ID**
5. Scroll down to **Authorized redirect URIs**
6. Click **+ ADD URI**
7. Add: `https://atlascal.vercel.app/api/auth/callback/google`
8. Click **SAVE**

### 2. Verify Vercel Environment Variables

Make sure these are set in your Vercel project:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Verify these variables are set:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_URL` = `https://atlascal.vercel.app` (must match your Vercel domain)
   - `NEXTAUTH_SECRET` (generate with: `openssl rand -base64 32`)
   - `GEMINI_API_KEY`
   - `DATABASE_URL` (for production, use a proper database, not SQLite file path)

### 3. Redeploy

After adding the redirect URI, you may need to:
- Wait a few minutes for Google's changes to propagate
- Redeploy your Vercel app (or it will auto-deploy on next push)

## Important Notes

- The redirect URI must **exactly match** the URL in the error message
- If you change your Vercel domain, update the redirect URI in Google Cloud Console
- If you use a custom domain, add that redirect URI as well
- Changes in Google Cloud Console can take a few minutes to propagate

## Testing

After making these changes:
1. Wait 2-3 minutes for Google's changes to propagate
2. Try signing in again at `https://atlascal.vercel.app`
3. The OAuth flow should now work correctly

