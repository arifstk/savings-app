// lib/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { tryClaimAdmin } from "@/lib/admin";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        otpEmail: { label: "Email", type: "text" },
        otp: { label: "OTP", type: "text" },
        otpVerified: { label: "Verified", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.otpEmail) {
          throw new Error("Email is required");
        }

        await dbConnect();

        const email = (credentials.otpEmail as string).toLowerCase().trim();
        const user = await User.findOne({ email });

        if (!user) {
          throw new Error("User not found.");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image || null,
          role: user.role,
          mobile: user.mobile,
          provider: user.provider,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        await dbConnect();

        let existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          existingUser = await User.create({
            name: user.name ?? "Google User",
            email: user.email,
            image: user.image ?? "",
            provider: "google",
            role: "user",
          });

          const isFirstUser = await tryClaimAdmin(existingUser._id.toString());
          if (isFirstUser) {
            existingUser.role = "admin";
            await existingUser.save();
          }
        }

        user.role = existingUser.role;
        user.id = existingUser._id.toString();
        user.mobile = existingUser.mobile;
        user.provider = existingUser.provider;
      }
      return true;
    },
    //     async jwt({ token, user }) {
    //       if (user) {
    //         token.id = user.id;
    //         token.role = ((user as { role?: string }).role ?? "user") as
    //           | "admin"
    //           | "user";
    //       }
    //       return token;
    //     },
    //     async session({ session, token }) {
    //       if (session.user) {
    //         session.user.id = token.id as string;
    //         session.user.role = (token.role ?? "user") as "admin" | "user";
    //       }
    //       return session;
    //     },
    //   },
    // });

    async jwt({ token, user, trigger, session: updateSession }) {
      if (user) {
        token.id = user.id;
        token.role = ((user as { role?: string }).role ?? "user") as
          | "admin"
          | "user";
        token.mobile = (user as { mobile?: string }).mobile;
        token.provider = (user as { provider?: string }).provider;
      }
      // Allow session.update() to refresh name/email/image
      if (trigger === "update" && updateSession) {
        if (updateSession.name) token.name = updateSession.name;
        if (updateSession.email) token.email = updateSession.email;
        if (updateSession.image) token.picture = updateSession.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role ?? "user") as "admin" | "user";
        session.user.mobile = token.mobile as string | undefined;
        session.user.provider = token.provider as string | undefined;
        // Sync name/email/image from token into session
        if (token.name) session.user.name = token.name;
        if (token.email) session.user.email = token.email;
        if (token.picture) session.user.image = token.picture;
      }
      return session;
    },
  },
});
