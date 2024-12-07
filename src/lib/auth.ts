import NextAuth, { NextAuthOptions, User as AuthUser, Session, User } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { v4 as uuid } from 'uuid';

import { IUser, UserModel } from '@/models/User';
import db from '@/lib/mongo';
import { JWT } from 'next-auth/jwt';
import { AccreditationModel, IAccreditation } from '@/models/Accreditation';

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

const enhanceToken = async ({ token, user }: { token: JWT; user: User }): Promise<JWT> => {
	if (user) {
		token.isTwoFactorComplete = (user as User).isTwoFactorComplete || false;
		token.accreditation = (user as User).accreditation || null;
	}
	return token;
};

const enhanceSession = async ({ session, token }: { session: Session; token: JWT }): Promise<Session> => {
	try {
		await db.connect();

		const user = await UserModel.findOne<IUser>({ email: session?.user?.email }).populate<{ accreditation: IAccreditation }>('accreditation', '-slug -accessLevel');

		if (!user) {
			return session;
		}

		const accreditation = user.accreditation
			? {
					...user.accreditation.toObject(),
					_id: undefined,
					authorizations: {
						...user.accreditation.authorizations,
						level: undefined,
					},
			  }
			: undefined;

		session.user = {
			...session.user,
			accreditation: accreditation || null,
			isTwoFactorComplete: Boolean(token.isTwoFactorComplete),
		};

		return session;
	} catch (error) {
		console.error('Session enhancement error:', error);
		return session;
	}
};

const handleSignIn = async ({ user, account, profile }: { user: AuthUser; account: any; profile?: any }): Promise<boolean> => {
	try {
		await db.connect();

		const email = user.email;
		if (!email) return false;

		const provider = account?.provider || 'credentials';
		const defaultAccreditation = await AccreditationModel.findOne({ slug: 'std', accessLevel: 0 });

		const updatedUser = await UserModel.findOneAndReplace(
			{ email },
			{
				email,
				id: uuid().replaceAll('-', ''),
				username: profile?.name || profile?.login || null,
				image: user.image || profile?.image || null,
				provider,
				name: profile?.name || user.name || profile?.login || null,
				verified: ['google', 'github'].includes(provider),
				accreditation: defaultAccreditation?._id || null,
			},
			{ upsert: true, new: true }
		);

		console.log('User handled successfully:', updatedUser);
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
