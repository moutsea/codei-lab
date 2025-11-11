import "@/server/proxy";
import NextAuth from "next-auth";
import type { DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import { syncUserFromAuthProfile } from "@/lib/services/user_service";
import { consumeEmailMagicLinkToken, resolveUserForEmail } from "@/lib/auth/email-login";

// Extend the built-in session types
declare module "next-auth" {
    interface User {
        id: string;
    }

    interface Session {
        user: DefaultSession["user"] & { id: string };
        provider?: string;
        accessToken?: string;
    }
}

declare module "next-auth" {
    interface JWT {
        appUserId?: string;
        provider?: string;
    }
}

export const {
    auth,
    signIn,
    signOut,
    handlers, // 注意：先把 handlers 整体导出
} = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),

        GitHub({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
            // 可选：默认 scope 就够用，如需 org/邮箱等可加：
            // authorization: { params: { scope: "read:user user:email" } },
            profile(profile) { return { id: profile.id.toString(), name: profile.name ?? profile.login, email: profile.email, image: profile.avatar_url }; }
        }),

        MicrosoftEntraID({
            clientId: process.env.AZURE_AD_CLIENT_ID!,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
            issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID || "common"}/v2.0`
        }),

        Credentials({
            id: "magiclink",
            name: "Email",
            credentials: {
                email: { label: "Email", type: "email" },
                token: { label: "Token", type: "text" },
            },
            async authorize(credentials) {
                const email = credentials?.email as string;
                const token = credentials?.token as string;

                if (!email || !token) {
                    return null;
                }

                const verifiedToken = await consumeEmailMagicLinkToken(email, token);
                if (!verifiedToken) {
                    console.warn(`[auth] Invalid or expired magic link for ${email}`);
                    return null;
                }

                try {
                    const user = await resolveUserForEmail(email);
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.nickname ?? user.email,
                        image: user.avatarUrl ?? undefined,
                    };
                } catch (error) {
                    console.error("Failed to resolve email user", error);
                    return null;
                }
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user, account, profile }) {
            if (user) {
                const provider = account?.provider;
                const profileRecord = profile as Record<string, unknown> | undefined;
                const profileEmail = typeof profileRecord?.email === 'string' ? profileRecord.email : undefined;
                const profileName = typeof profileRecord?.name === 'string' ? profileRecord.name : undefined;
                const profilePicture = typeof profileRecord?.picture === 'string' ? profileRecord.picture : undefined;
                const profileAvatar = typeof profileRecord?.avatar_url === 'string' ? profileRecord.avatar_url : undefined;

                const resolvedEmail = user.email ?? profileEmail;
                const resolvedName = user.name ?? profileName;
                const resolvedImage = user.image ?? profilePicture ?? profileAvatar;
                const resolvedId = user.id ?? account?.providerAccountId ?? token.appUserId;

                if (provider) {
                    token.provider = provider;
                }

                if (resolvedId && resolvedEmail) {
                    try {
                        const syncedUser = await syncUserFromAuthProfile({
                            id: resolvedId,
                            email: resolvedEmail,
                            name: resolvedName,
                            image: resolvedImage,
                        });
                        token.appUserId = syncedUser.id;
                    } catch (error) {
                        console.error('❌ Failed to sync user during JWT callback:', error);
                    }
                }
            }

            return token;
        },

        async session({ session, token }) {
            if (session.user && token.appUserId) {
                session.user.id = token.appUserId as string;
            }

            if (token.provider) {
                session.provider = token.provider as string;
            }

            return session;
        },
    },
});
