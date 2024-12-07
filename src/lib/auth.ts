import NextAuth, { NextAuthOptions, User, Session } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { v4 as uuid } from 'uuid';
import db from '@/lib/mongo';
import { IUser, UserModel } from '@/models/User';
import { AccreditationModel, IAccreditation } from '@/models/Accreditation';
import { JWT } from 'next-auth/jwt';
import { getServerSession } from 'next-auth/next';

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
		token.isTwoFactorComplete = user.isTwoFactorComplete ?? false;
	}
	return token;
};

const enhanceSession = async ({ session, token }: { session: Session; token: JWT }): Promise<Session> => {
	try {
		await db.connect();
		const user = await UserModel.findOne<IUser>({ email: session.user?.email }).populate<{ accreditation: IAccreditation }>('accreditation', '-slug -accessLevel').exec();

		if (!user) return session;

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
			isTwoFactorComplete: Boolean(token.isTwoFactorComplete),
		};

		return session;
	} catch (error) {
		console.error('Error enhancing session:', error);
		return session;
	}
};

const handleSignIn = async ({ user, account, profile }: { user: User; account: any; profile?: any }): Promise<boolean> => {
	try {
		await db.connect();
		const email = user.email;
		if (!email) return false;

		const provider = account?.provider ?? 'credentials';
		const defaultAccreditation = await AccreditationModel.findOne({ slug: 'std', accessLevel: 0 }).exec();

		const updatedUser = await UserModel.findOneAndReplace(
			{ email },
			{
				email,
				id: uuid().replace(/-/g, ''),
				username: profile?.name ?? profile?.login ?? null,
				image: user.image ?? profile?.image ?? null,
				provider,
				name: profile?.name ?? user.name ?? profile?.login ?? null,
				verified: ['google', 'github'].includes(provider),
				accreditation: defaultAccreditation?._id ?? null,
			},
			{ upsert: true, new: true }
		).exec();

		console.log('User successfully handled:', updatedUser);
		return true;
	} catch (error) {
		console.error('Error during sign-in:', error);
		return false;
	}
};

export const getUser = async (): Promise<User> => {
	const session = await getServerSession();

	await db.connect();
	const user = await UserModel.findOne<IUser>({ email: session?.user?.email }).populate<{ accreditation: IAccreditation }>('accreditation', '-slug -accessLevel').exec();

	return {
		email: session?.user?.email ?? '',
		name: user?.name ?? '',
		id: user?._id.toString() ?? '',
		username: user?.username ?? '',
		image: user?.image ?? '',
	};
};

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
