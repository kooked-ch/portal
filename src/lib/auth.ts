import NextAuth, { AdapterUser, NextAuthOptions, User as AuthUser, Session } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { v4 as uuid } from 'uuid';

import { IUser, User } from '@/models/User';
import db from '@/lib/mongo';
import { JWT } from 'next-auth/jwt';

type EnhancedUser = {
	role?: string;
	isTwoFactorComplete?: boolean;
};

const getProviders = () => [
	GitHubProvider({
		clientId: process.env.GITHUB_ID || '',
		clientSecret: process.env.GITHUB_SECRET || '',
	}),
	GoogleProvider({
		clientId: process.env.GOOGLE_ID || '',
		clientSecret: process.env.GOOGLE_SECRET || '',
	}),
];

const enhanceToken = async (token: any, user: AuthUser | AdapterUser) => {
	if (user) {
		token.isTwoFactorComplete = (user as AdapterUser).isTwoFactorComplete || false;
		token.role = 'role';
	}
	return token;
};

const enhanceSession = async ({ session, token }: { session: Session; token: JWT }) => {
	try {
		await db.connect();
		const user = await User.findOne<IUser>({ email: session.user.email });

		if (!user) {
			return session;
		}

		const enhancedUser: EnhancedUser = {
			...session.user,
			role: user.role,
			isTwoFactorComplete: (token.isTwoFactorComplete as boolean) || false,
		};

		session.user = enhancedUser;
		return session;
	} catch (error) {
		console.error('Session enhancement error:', error);
		return session;
	}
};

const handleSignIn = async ({ user, account, profile }: { user: AuthUser; account: any; profile?: any }) => {
	try {
		await db.connect();

		const email = user.email;
		if (!email) return false;

		const existingUser = await User.findOne<IUser>({ email });
		if (existingUser) return true;

		const provider = account?.provider || 'credentials';
		const newUser = new User({
			email,
			id: uuid().toString().replaceAll('-', ''),
			username: profile?.name || (profile as any)?.login || null,
			image: user.image || profile?.image || null,
			provider,
			name: profile?.name || user.name || (profile as any)?.login || null,
			verified: ['google', 'github'].includes(provider),
		});

		await newUser.save();
		return true;
	} catch (error) {
		console.error('Sign-in error:', error);
		return false;
	}
};

// NextAuth configuration
export const authOptions: NextAuthOptions = {
	pages: {
		signIn: '/signin',
		verifyRequest: '/signin',
	},
	providers: getProviders(),
	session: {
		strategy: 'jwt',
		maxAge: 7 * 24 * 60 * 60, // 7 Days
	},
	callbacks: {
		jwt: enhanceToken,
		session: enhanceSession,
		signIn: handleSignIn,
	},
};

export default NextAuth(authOptions);
