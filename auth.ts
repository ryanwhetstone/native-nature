import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import { users, accounts, sessions, verificationTokens } from "./db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role?: string;
      isImpersonating?: boolean;
      realAdminId?: string;
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email as string),
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      // Set publicName to name when user is created via OAuth
      if (user.name && user.id) {
        await db
          .update(users)
          .set({ publicName: user.name })
          .where(eq(users.id, user.id));
      }
    },
  },
  callbacks: {
    async session({ session, user }) {
      if (user && session.user) {
        session.user.id = user.id;
        
        // Check for impersonation cookie
        const cookieStore = await cookies();
        const impersonatingUserId = cookieStore.get('impersonating')?.value;
        
        // Fetch the role from the database
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, user.id),
          columns: {
            role: true,
          },
        });
        
        // If admin is impersonating another user
        if (impersonatingUserId && dbUser?.role === 'admin') {
          const impersonatedUser = await db.query.users.findFirst({
            where: eq(users.id, impersonatingUserId),
          });
          
          if (impersonatedUser) {
            session.user.id = impersonatedUser.id;
            session.user.email = impersonatedUser.email;
            session.user.name = impersonatedUser.name;
            session.user.image = impersonatedUser.image;
            session.user.role = impersonatedUser.role || 'user';
            session.user.isImpersonating = true;
            session.user.realAdminId = user.id;
          }
        } else {
          session.user.role = dbUser?.role || 'user';
        }
      }
      return session;
    },
  },
});
