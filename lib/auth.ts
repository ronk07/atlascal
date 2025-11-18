import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { google } from "googleapis";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // Send properties to the client, like an access_token from a provider.
      if (session.user) {
        session.accessToken = token.accessToken;
        session.refreshToken = token.refreshToken;
        session.error = token.error;
      }
      return session;
    },
    async jwt({ token, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000; // Convert to milliseconds
      }
      
      // Handle token refresh if needed
      if (token.expiresAt && token.refreshToken) {
        const now = Date.now();
        // Refresh token if it expires in less than 5 minutes
        if (token.expiresAt < now + 5 * 60 * 1000) {
          try {
            const oauth2Client = new google.auth.OAuth2(
              process.env.GOOGLE_CLIENT_ID!,
              process.env.GOOGLE_CLIENT_SECRET!
            );
            
            oauth2Client.setCredentials({
              refresh_token: token.refreshToken as string,
            });
            
            const { credentials } = await oauth2Client.refreshAccessToken();
            
            token.accessToken = credentials.access_token || undefined;
            token.expiresAt = credentials.expiry_date || (Date.now() + 3600 * 1000);
            
            if (credentials.refresh_token) {
              token.refreshToken = credentials.refresh_token;
            }
          } catch (error) {
            console.error("Error refreshing access token", error);
            token.error = "RefreshAccessTokenError";
          }
        }
      }
      
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
};

