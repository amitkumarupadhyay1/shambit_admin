import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import axios from "axios"
import type { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface User {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    accessToken?: string;
    refreshToken?: string;
  }
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    error?: string;
    user: User;
  }
}

const useSecureCookies = process.env.NODE_ENV === "production";
const cookiePrefix = useSecureCookies ? "__Secure-" : "";

const refreshLocks = new Map<string, Promise<JWT>>();

function getJwtExpiration(token: string): number {
  try {
    const base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const jsonPayload = typeof Buffer !== 'undefined' 
      ? Buffer.from(base64, 'base64').toString('utf-8')
      : atob(base64);
    const parsed = JSON.parse(jsonPayload);
    if (parsed.exp) {
      return parsed.exp * 1000;
    }
  } catch (e) {
    console.error("Failed to parse JWT", e);
  }
  return Date.now() + 60 * 60 * 1000;
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    
    const response = await axios.post(`${apiUrl}/auth/refresh/`, {
      refresh: token.refreshToken,
    });

    const data = response.data;
    
    return {
      ...token,
      accessToken: data.access,
      refreshToken: data.refresh ?? token.refreshToken,
      expiresAt: getJwtExpiration(data.access),
      error: undefined,
    };
  } catch (error) {
    console.error("RefreshAccessTokenError:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}shambit-admin.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: `shambit-admin.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    csrfToken: {
      name: `${useSecureCookies ? "__Host-" : ""}shambit-admin.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
        token.id = user.id
        token.username = user.username
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.phone = user.phone
        token.expiresAt = getJwtExpiration(user.accessToken as string)

        // Sync Social Login
        if (account?.provider === "google") {
          try {
            const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
            const fullName = user.name || ""
            const [firstName, ...restName] = fullName.split(" ")
            const lastName = restName.join(" ")
            const providerToken = (account as Record<string, unknown>).id_token as string;

            if (!providerToken) {
              console.error(`Missing ${account.provider} provider token`)
              return token
            }

            const res = await axios.post(`${apiUrl}/auth/nextauth-sync/`, {
              email: user.email,
              first_name: firstName,
              last_name: lastName,
              provider: account.provider,
              uid: account.providerAccountId,
              token: providerToken,
            })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = res.data as any;
            token.accessToken = data.access
            token.refreshToken = data.refresh
            token.id = data.user_id
            token.username = data.username
            token.firstName = data.first_name || firstName
            token.lastName = data.last_name || lastName
            token.expiresAt = getJwtExpiration(data.access)
          } catch (e) {
            console.error("Sync failed", e)
            return {
              ...token,
              accessToken: undefined,
              refreshToken: undefined,
              expiresAt: 0,
              error: "OAuthSyncError",
            }
          }
        }
        return token
      }

      if (token.expiresAt && Date.now() < (token.expiresAt as number) - 60000) {
        return token;
      }

      if (token.refreshToken) {
        const userId = (token.id as string) || "unknown";
        const existingRefresh = refreshLocks.get(userId);
        if (existingRefresh) {
          return await existingRefresh;
        }

        const newRefresh = (async (): Promise<JWT> => {
          try {
            const refreshed = await refreshAccessToken(token);
            if ((refreshed as { error?: string }).error === "RefreshAccessTokenError") {
              return {
                ...(refreshed as JWT),
                accessToken: undefined,
                refreshToken: undefined,
                expiresAt: 0,
                error: "RefreshAccessTokenError",
              } as JWT;
            }
            return refreshed;
          } catch {
            return {
              ...token,
              accessToken: undefined,
              refreshToken: undefined,
              expiresAt: 0,
              error: "RefreshAccessTokenError",
            } as JWT;
          }
        })().finally(() => {
          refreshLocks.delete(userId);
        });
        
        refreshLocks.set(userId, newRefresh);
        return await newRefresh;
      }

      return token
    },
    async session({ session, token }) {
      if (
        !token.accessToken ||
        (token as { error?: string }).error === "RefreshAccessTokenError" ||
        (token as { error?: string }).error === "OAuthSyncError"
      ) {
        session.accessToken = undefined;
        session.refreshToken = undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session as any).error = (token as { error?: string }).error;
        return session;
      }

      if (token) {
        session.accessToken = token.accessToken as string | undefined;
        session.refreshToken = token.refreshToken as string | undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session as any).error = (token as { error?: string }).error;
        session.user.id = token.id as string;
        session.user.username = token.username as string | undefined;
        session.user.firstName = token.firstName as string | undefined;
        session.user.lastName = token.lastName as string | undefined;
        session.user.phone = token.phone as string | undefined;
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
})
