import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { User as PrismaUser } from '@prisma/client';

type UserWithoutPassword = Omit<PrismaUser, 'password'>;

// Extend the built-in session types
declare module 'next-auth' {
  interface User extends UserWithoutPassword {}
  
  interface Session {
    user: UserWithoutPassword;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends UserWithoutPassword {}
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email
          }
        });

        if (!user) {
          throw new Error('User not found');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Invalid password');
        }

        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/login'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          ...user
        };
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: token
      };
    }
  }
}; 