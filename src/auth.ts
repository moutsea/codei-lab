import "@/server/proxy";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

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
});
