# Atlas Setup Guide

## 1. Prerequisites
- Node.js 18+ installed.
- A Google Cloud Platform account.
- A Google Gemini API Key.

## 2. Clone & Install
The project is already scaffolded. Run the following to ensure all dependencies are installed:
```bash
npm install
```

## 3. Environment Variables
Create a `.env` file in the root directory (if it doesn't exist) and add the following keys:

```env
# Database (SQLite)
DATABASE_URL="file:./dev.db"

# Google OAuth (Calendar)
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="Generate_a_random_string_here_openssl_rand_base64_32"

# AI
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

### How to get Google Credentials:
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project.
3. Enable **Google Calendar API**.
4. Go to **Credentials** -> **Create Credentials** -> **OAuth client ID**.
5. Application type: **Web application**.
6. **Authorized redirect URIs** (add both):
   - `http://localhost:3000/api/auth/callback/google` (for local development)
   - `https://atlascal.vercel.app/api/auth/callback/google` (for production - replace with your actual Vercel domain)
7. Copy Client ID and Client Secret to `.env`.

### How to get Gemini API Key:
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Create an API key.
3. Copy it to `.env`.

## 4. Database Setup
Initialize the SQLite database:
```bash
npx prisma migrate dev --name init
```

## 5. Run the App
Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
Login with your Google account to see your calendar and start chatting!

## 6. Deployment to Vercel

### Environment Variables in Vercel:
1. Go to your Vercel project settings.
2. Navigate to **Environment Variables**.
3. Add the following variables:
   - `GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
   - `GOOGLE_CLIENT_SECRET` - Your Google OAuth Client Secret
   - `NEXTAUTH_URL` - Your production URL (e.g., `https://atlascal.vercel.app`)
   - `NEXTAUTH_SECRET` - A random secret string (generate with: `openssl rand -base64 32`)
   - `GEMINI_API_KEY` - Your Gemini API key
   - `DATABASE_URL` - For production, you'll need a proper database URL (not SQLite file path)

### Important: Google OAuth Redirect URI
**Before deploying**, make sure you've added your production redirect URI to Google Cloud Console:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** -> **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:
   - `https://your-vercel-domain.vercel.app/api/auth/callback/google`
   - Replace `your-vercel-domain` with your actual Vercel domain
5. Click **Save**

**Note**: If you're using a custom domain, add that redirect URI as well.

