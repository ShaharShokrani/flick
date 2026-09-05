import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { getDb, canUseDatabase } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { isGuestEmail, normalizeGuestCode } from "@/lib/guest-code";

const appUrl =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://127.0.0.1:43147");

const googleEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

export function isAuthConfigured() {
  return Boolean(process.env.BETTER_AUTH_SECRET) && canUseDatabase();
}

export function authFeatures() {
  return {
    configured: isAuthConfigured(),
    google: googleEnabled,
    remoteDatabase: Boolean(process.env.DATABASE_URL),
    appUrl,
  };
}

function createAuth() {
  if (!isAuthConfigured()) {
    return null;
  }

  return betterAuth({
    baseURL: appUrl,
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: [
      appUrl,
      "http://127.0.0.1:43147",
      "http://localhost:43147",
      "https://temporary-brisk-mesa-ty777ur.vercel.app",
    ],
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    user: {
      additionalFields: {
        guestCode: {
          type: "string",
          required: false,
          unique: true,
          input: false,
        },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (!isGuestEmail(user.email)) {
              return { data: user };
            }
            const compact = user.email
              .slice("guest-".length)
              .split("@")[0]
              ?.toUpperCase();
            const guestCode = compact ? normalizeGuestCode(compact) : null;
            return {
              data: {
                ...user,
                guestCode: guestCode ?? undefined,
              },
            };
          },
        },
      },
    },
    socialProviders: googleEnabled
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          },
        }
      : undefined,
    plugins: [nextCookies()],
  });
}

let authInstance: ReturnType<typeof createAuth> | undefined;

export function getAuth() {
  if (authInstance === undefined) {
    authInstance = createAuth();
  }
  return authInstance;
}
