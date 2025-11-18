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
6. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`.
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

