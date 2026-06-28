// lib/auth.ts

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

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
        otpEmail: { label: "OTP Email", type: "text" },
        otp: { label: "OTP", type: "text" },
        otpVerified: { label: "OTP Verified", type: "text" },
        identifier: { label: "Identifier", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await dbConnect();

        if (credentials?.otpVerified === "true" && credentials?.otpEmail) {
          const email = (credentials.otpEmail as string).toLowerCase().trim();
          const user = await User.findOne({ email });

          if (!user) throw new Error("User not found.");

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image || null,
            role: user.role,
            mobile: user.mobile,
            provider: user.provider,
          };
        }

        if (credentials?.identifier && credentials?.password) {
          const normalized = (credentials.identifier as string)
            .trim()
            .toLowerCase();

          const user = await User.findOne({
            $or: [
              { email: normalized },
              { mobile: (credentials.identifier as string).trim() },
            ],
          }).select("+password +emailVerified");

          if (!user) throw new Error("Incorrect email/mobile or password.");
          if (!user.password)
            throw new Error("This account uses Google sign-in.");

          if (!user.emailVerified) throw new Error("Email not verified.");

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password,
          );
          if (!isValid) throw new Error("Incorrect email/mobile or password.");

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image || null,
            role: user.role,
            mobile: user.mobile,
            provider: user.provider,
          };
        }

        throw new Error("Invalid credentials.");
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
          // Check if this is the very first user in the database
          const isFirstUser = (await User.countDocuments({})) === 0;

          existingUser = await User.create({
            name: user.name ?? "Google User",
            email: user.email,
            image: user.image ?? "",
            provider: "google",
            role: isFirstUser ? "admin" : "user",
            emailVerified: true,
          });
        }

        user.role = existingUser.role;
        user.id = existingUser._id.toString();
        user.mobile = existingUser.mobile;
        user.provider = existingUser.provider;
      }
      return true;
    },

    async jwt({ token, user, trigger, session: updateSession }) {
      if (user) {
        token.id = user.id;
        token.role = ((user as { role?: string }).role ?? "user") as
          | "admin"
          | "user";
        token.mobile = (user as { mobile?: string }).mobile;
        token.provider = (user as { provider?: string }).provider;
      }
      if (trigger === "update" && updateSession) {
        if (updateSession.name) token.name = updateSession.name;
        if (updateSession.email) token.email = updateSession.email;
        if (updateSession.image) token.picture = updateSession.image;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        await dbConnect();

        const userExists = await User.findById(token.id).lean();
        if (!userExists) {
          return null as any;
        }

        session.user.id = token.id as string;
        session.user.role = (token.role ?? "user") as "admin" | "user";
        session.user.mobile = token.mobile as string | undefined;
        session.user.provider = token.provider as string | undefined;
        if (token.name) session.user.name = token.name;
        if (token.email) session.user.email = token.email;
        if (token.picture) session.user.image = token.picture;
      }
      return session;
    },
  },
});


