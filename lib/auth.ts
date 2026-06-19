import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { tryClaimAdmin } from "@/lib/admin";

export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Mobile", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Email/mobile and password are required");
        }

        await dbConnect();

        const identifier = (credentials.identifier as string).trim().toLowerCase();

        // Allow login with either email or mobile number
        const user = await User.findOne({
          $or: [{ email: identifier }, { mobile: credentials.identifier }],
        }).select("+password");

        if (!user) {
          throw new Error("No account found with that email or mobile number");
        }

        if (!user.password) {
          throw new Error(
            "This account was created with Google. Please continue with Google."
          );
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          throw new Error("Incorrect password");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
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
          // Create the user first, then atomically attempt to claim the
          // single admin slot. Avoids race conditions across simultaneous
          // first-time sign-ups (Google or credentials).
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

        // Stamp role onto the user object so the jwt callback can read it
        user.role = existingUser.role;
        user.id = existingUser._id.toString();
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "user";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "admin" | "user";
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
