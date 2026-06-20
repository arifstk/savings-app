import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

export type UserRole = "admin" | "user";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      mobile?: string;
      provider?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role?: UserRole;
    mobile?: string;
    provider?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: UserRole;
    mobile?: string;
    provider?: string;
  }
}
