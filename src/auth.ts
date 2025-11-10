import "@/server/proxy";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { syncUserFromAuthProfile } from "@/lib/services/user_service";

// Extend the built-in session types
declare module "next-auth" {
    interface Session {
        provider?: string;
        accessToken?: string;
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
    ],

    events: {
        /**
         * @param  {object}  message      Message object
         * @param  {object}  session      Session object
         */
        async signIn({ user, account, profile }) {
            const provider = account?.provider ?? 'unknown';
            const resolvedId = user?.id ?? account?.providerAccountId;
            const profileRecord = profile as Record<string, unknown> | undefined;
            const profileEmail = typeof profileRecord?.email === 'string' ? profileRecord.email : undefined;
            const profileName = typeof profileRecord?.name === 'string' ? profileRecord.name : undefined;
            const profilePicture = typeof profileRecord?.picture === 'string' ? profileRecord.picture : undefined;
            const profileAvatar = typeof profileRecord?.avatar_url === 'string' ? profileRecord.avatar_url : undefined;

            const resolvedEmail = user?.email ?? profileEmail;
            const resolvedName = user?.name ?? profileName;
            const resolvedImage = user?.image ?? profilePicture ?? profileAvatar;

            if (!resolvedId) {
                console.warn(`[auth] Missing user id from provider ${provider}; skipping user sync.`);
                return;
            }

            if (!resolvedEmail) {
                console.warn(`[auth] Missing email for user ${resolvedId} from provider ${provider}; skipping user sync.`);
                return;
            }

            try {
                await syncUserFromAuthProfile({
                    id: resolvedId,
                    email: resolvedEmail,
                    name: resolvedName,
                    image: resolvedImage,
                });

                console.log(`✅ Synced user ${resolvedId} from ${provider} sign-in.`);
            } catch (error) {
                console.error('❌ Failed to sync user during sign-in:', error);
            }
        },
    },
});
