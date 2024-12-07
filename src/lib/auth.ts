import NextAuth, { NextAuthOptions, User as AuthUser, Session, User } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { v4 as uuid } from 'uuid';

import { IUser, UserModel } from '@/models/User';
import db from '@/lib/mongo';
import { JWT } from 'next-auth/jwt';

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

const enhanceToken = async ({ token, user }: { token: JWT; user: User }) => {
	if (user) {
		token.isTwoFactorComplete = (user as User).isTwoFactorComplete || false;
		token.accreditation = (user as User).accreditation || null;
	}
	return token;
};

const enhanceSession = async ({ session, token }: { session: Session; token: JWT }) => {
	try {
		await db.connect();
		const user = await UserModel.findOne<IUser>({ email: session?.user?.email });

		if (!user) {
			return session;
		}

		session.user = {
			...session.user,
			accreditation: user.accreditation ? user.accreditation.toString() : 'denied',
			isTwoFactorComplete: (token.isTwoFactorComplete as boolean) || false,
		};

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

		const existingUser = await UserModel.findOne<IUser>({ email });
		if (existingUser) return true;

		const provider = account?.provider || 'credentials';
		const newUser = new UserModel({
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

export const authOptions: NextAuthOptions = {
	pages: {
		signIn: '/login',
		verifyRequest: '/login',
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
