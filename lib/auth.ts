// // import NextAuth from "next-auth";
// // import type { NextAuthConfig } from "next-auth";
// // import Credentials from "next-auth/providers/credentials";
// // import Google from "next-auth/providers/google";
// // import bcrypt from "bcryptjs";
// // import dbConnect from "@/lib/mongodb";
// // import User from "@/models/User";
// // import { tryClaimAdmin } from "@/lib/admin";

// // export const authConfig: NextAuthConfig = {
// //   session: {
// //     strategy: "jwt",
// //   },
// //   pages: {
// //     signIn: "/login",
// //   },
// //   providers: [
// //     Google({
// //       clientId: process.env.GOOGLE_CLIENT_ID!,
// //       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
// //     }),
// //     Credentials({
// //       name: "Credentials",
// //       credentials: {
// //         identifier: { label: "Email or Mobile", type: "text" },
// //         password: { label: "Password", type: "password" },
// //       },
// //       async authorize(credentials) {
// //         if (!credentials?.identifier || !credentials?.password) {
// //           throw new Error("Email/mobile and password are required");
// //         }

// //         await dbConnect();

// //         const identifier = (credentials.identifier as string)
// //           .trim()
// //           .toLowerCase();

// //         const user = await User.findOne({
// //           $or: [{ email: identifier }, { mobile: credentials.identifier }],
// //         }).select("+password");

// //         if (!user) {
// //           throw new Error("No account found with that email or mobile number");
// //         }

// //         if (!user.password) {
// //           throw new Error(
// //             "This account was created with Google. Please continue with Google.",
// //           );
// //         }

// //         const isValid = await bcrypt.compare(
// //           credentials.password as string,
// //           user.password,
// //         );

// //         if (!isValid) {
// //           throw new Error("Incorrect password");
// //         }

// //         return {
// //           id: user._id.toString(),
// //           name: user.name,
// //           email: user.email,
// //           image: user.image,
// //           role: user.role,
// //         };
// //       },
// //     }),
// //   ],
// //   callbacks: {
// //     async signIn({ user, account }) {
// //       if (account?.provider === "google") {
// //         if (!user.email) return false;

// //         await dbConnect();

// //         let existingUser = await User.findOne({ email: user.email });

// //         if (!existingUser) {
// //           existingUser = await User.create({
// //             name: user.name ?? "Google User",
// //             email: user.email,
// //             image: user.image ?? "",
// //             provider: "google",
// //             role: "user",
// //           });

// //           const isFirstUser = await tryClaimAdmin(existingUser._id.toString());
// //           if (isFirstUser) {
// //             existingUser.role = "admin";
// //             await existingUser.save();
// //           }
// //         }

// //         user.role = existingUser.role;
// //         user.id = existingUser._id.toString();
// //       }

// //       return true;
// //     },
// //     async jwt({ token, user }) {
// //       if (user) {
// //         token.id = user.id;
// //         token.role = user.role ?? "user";
// //       }
// //       return token;
// //     },
// //     async session({ session, token }) {
// //       if (session.user) {
// //         session.user.id = token.id as string;
// //         session.user.role = token.role as "admin" | "user";
// //       }
// //       return session;
// //     },
// //   },
// // };

// // export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// import NextAuth from "next-auth";
// import Credentials from "next-auth/providers/credentials";
// import Google from "next-auth/providers/google";
// import bcrypt from "bcryptjs";
// import dbConnect from "@/lib/mongodb";
// import User from "@/models/User";
// import { tryClaimAdmin } from "@/lib/admin";
// import { saveOtp, sendOtpEmail, generateOtp } from "@/lib/otp";

// export const { handlers, auth, signIn, signOut } = NextAuth({
//   secret: process.env.AUTH_SECRET,
//   session: { strategy: "jwt" },
//   pages: { signIn: "/login" },
//   providers: [
//     Google({
//       clientId: process.env.GOOGLE_CLIENT_ID ?? "",
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
//     }),
//     Credentials({
//       name: "Credentials",
//       credentials: {
//         identifier: { label: "Email or Mobile", type: "text" },
//         password: { label: "Password", type: "password" },
//         // These two are only filled on the OTP step
//         otp: { label: "OTP", type: "text" },
//         otpEmail: { label: "OTP Email", type: "text" },
//       },
//       async authorize(credentials) {
//         await dbConnect();

//         // ── OTP VERIFICATION STEP ──────────────────────────────────────────
//         // When the OTP form submits, it sends otp + otpEmail (no password)
//         if (credentials?.otp && credentials?.otpEmail) {
//           const email = (credentials.otpEmail as string).toLowerCase().trim();

//           const { verifyOtpHash } = await import("@/lib/otp");
//           const Otp = (await import("@/models/Otp")).default;

//           const otpRecord = await Otp.findOne({ email });

//           if (!otpRecord) {
//             throw new Error("OTP expired. Please log in again.");
//           }

//           if (otpRecord.attempts >= 5) {
//             await Otp.deleteOne({ email });
//             throw new Error("Too many wrong attempts. Please log in again.");
//           }

//           const isValid = await verifyOtpHash(
//             credentials.otp as string,
//             otpRecord.otp,
//           );

//           if (!isValid) {
//             otpRecord.attempts += 1;
//             await otpRecord.save();
//             const left = 5 - otpRecord.attempts;
//             throw new Error(
//               `Incorrect OTP. ${left} attempt${left === 1 ? "" : "s"} left.`,
//             );
//           }

//           // OTP correct — delete it and sign the user in
//           await Otp.deleteOne({ email });

//           const user = await User.findOne({ email });
//           if (!user) throw new Error("User not found.");

//           return {
//             id: user._id.toString(),
//             name: user.name,
//             email: user.email,
//             image: user.image,
//             role: user.role,
//           };
//         }

//         // ── CREDENTIALS STEP (first step) ─────────────────────────────────
//         // Validate email/password, then generate + send OTP
//         if (!credentials?.identifier || !credentials?.password) {
//           throw new Error("Email/mobile and password are required");
//         }

//         const identifier = (credentials.identifier as string)
//           .trim()
//           .toLowerCase();

//         const user = await User.findOne({
//           $or: [{ email: identifier }, { mobile: credentials.identifier }],
//         }).select("+password");

//         if (!user) {
//           throw new Error("No account found with that email or mobile number");
//         }

//         if (!user.password) {
//           throw new Error(
//             "This account uses Google sign-in. Please continue with Google.",
//           );
//         }

//         const isValid = await bcrypt.compare(
//           credentials.password as string,
//           user.password,
//         );
//         if (!isValid) {
//           throw new Error("Incorrect password");
//         }

//         // Credentials are correct → send OTP, then return special marker
//         // We return null here to prevent immediate sign-in.
//         // The login page reads the "OTP_REQUIRED" error and redirects to /verify-otp.
//         const otp = generateOtp();
//         await saveOtp(user.email, otp);
//         await sendOtpEmail(user.email, otp);

//         // Throw a special error that the login page can detect
//         throw new Error("OTP_REQUIRED:" + user.email);
//       },
//     }),
//   ],
//   callbacks: {
//     async signIn({ user, account }) {
//       // Google sign-in: create/update user in DB
//       if (account?.provider === "google") {
//         if (!user.email) return false;
//         await dbConnect();

//         let existingUser = await User.findOne({ email: user.email });

//         if (!existingUser) {
//           existingUser = await User.create({
//             name: user.name ?? "Google User",
//             email: user.email,
//             image: user.image ?? "",
//             provider: "google",
//             role: "user",
//           });

//           const isFirstUser = await tryClaimAdmin(existingUser._id.toString());
//           if (isFirstUser) {
//             existingUser.role = "admin";
//             await existingUser.save();
//           }
//         }

//         user.role = existingUser.role;
//         user.id = existingUser._id.toString();
//       }
//       return true;
//     },
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
        // OTP was already verified by /api/auth/verify-otp.
        // We just need to look up the user and return them.
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
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = ((user as { role?: string }).role ?? "user") as
          | "admin"
          | "user";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role ?? "user") as "admin" | "user";
      }
      return session;
    },
  },
});


