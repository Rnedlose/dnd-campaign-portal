import { DefaultSession, Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { AuthOptions } from 'next-auth';

interface User {
  id: string;
  email: string | null;
  name: string | null;
  password: string | null;
  role: string;
}

interface CustomUser extends User {
  role: string;
}

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user?: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
  }
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = (await prisma.user.findUnique({
          where: { email: credentials.email },
        })) as User & { password: string | null };

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 4 * 60 * 60, // 4 hours in seconds
    updateAge: 60 * 60,  // Update session every hour
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: {
            accounts: true,
          },
        });

        if (!dbUser) {
          const newUser = await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              role: 'user',
              accounts: {
                create: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  type: account.type,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                },
              },
            },
          });

          // Update user data but return true to indicate successful sign in
          Object.assign(user, {
            id: newUser.id,
            role: newUser.role,
          });
          return true;
        }

        if (!dbUser.accounts.some((acc: { provider: string }) => acc.provider === account.provider)) {
          await prisma.account.create({
            data: {
              userId: dbUser.id,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              type: account.type,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
            },
          });
        }

        // Update user data but return true to indicate successful sign in
        Object.assign(user, {
          id: dbUser.id,
          role: dbUser.role,
        });
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const customUser = user as CustomUser;
        token.id = customUser.id;
        token.role = customUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id!;
        session.user.role = token.role || 'user';
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
};
