import NextAuth, { NextAuthOptions, User, Session } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { v4 as uuid } from 'uuid';
import db from '@/lib/mongo';
import { IUser, UserModel } from '@/models/User';
import { AccreditationModel, IAccreditation } from '@/models/Accreditation';
import { JWT } from 'next-auth/jwt';
import { getServerSession } from 'next-auth/next';
import { IProject, ProjectModel } from '@/models/Project';
import { AppModel, IApp } from '@/models/App';
import { cookies } from 'next/headers';
import { checkTwoFactor, getTwoFactor } from './factor';
import { IResourcesPolicy, ResourcesPolicyModel } from '@/models/ResourcesPolicy';
import { sendEmail } from './mail';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcryt from 'bcrypt';
import rateLimit from './rate-limit';

const limiter = rateLimit({
	interval: 60 * 1000,
	uniqueTokenPerInterval: 500,
});

const getProviders = () => [
	GitHubProvider({
		clientId: process.env.GITHUB_ID!,
		clientSecret: process.env.GITHUB_SECRET!,
		allowDangerousEmailAccountLinking: true,
	}),
	GoogleProvider({
		clientId: process.env.GOOGLE_ID!,
		clientSecret: process.env.GOOGLE_SECRET!,
		allowDangerousEmailAccountLinking: true,
	}),
	CredentialsProvider({
		name: 'Credentials',
		credentials: {
			email: { label: 'Email', type: 'email' },
			password: { label: 'Password', type: 'password' },
		},
		async authorize(credentials, req) {
			try {
				if (!credentials) return null;

				const ip = req?.headers?.['x-forwarded-for'] || '127.0.0.1';
				const { isRateLimited } = limiter.check(5, `login_${ip}`);
				if (isRateLimited) {
					throw new Error('Too many login attempts. Please try again later.');
				}

				await db.connect();

				const user = await UserModel.findOne<IUser>({ email: credentials.email }, 'email password verified username name _id').lean();

				if (!user || !user.verified) {
					await new Promise((r) => setTimeout(r, 1000));
					return null;
				}

				const isValid = await bcryt.compare(credentials.password, user.password);
				if (!isValid) {
					await new Promise((r) => setTimeout(r, 1000));
					return null;
				}

				return {
					id: user.id,
					email: user.email,
					username: user.username,
					name: user.name,
				};
			} catch (error) {
				console.error('Auth error:', error);
				throw error;
			}
		},
	}),
];

export const enhanceToken = async ({ token, user }: { token: JWT; user: User }): Promise<JWT> => {
	try {
		const { disabled } = await getTwoFactor();

		if (user) {
			token.twoFactorComplete = user.twoFactorComplete ?? false;
		}

		token.twoFactorDisabled = disabled;
		return token;
	} catch (error) {
		console.error('Token enhancement error:', error);
		token.twoFactorComplete = false;
		return token;
	}
};

export const handleSignIn = async ({ user, account, profile }: { user: User; account: any; profile?: any }): Promise<boolean> => {
	try {
		await db.connect();
		const email = user.email;
		if (!email) return false;

		const provider = account?.provider ?? 'credentials';

		const [defaultAccreditation, defaultResourcesPolicy] = await Promise.all([AccreditationModel.findOne<IAccreditation>({ slug: 'std', accessLevel: 0 }).lean(), ResourcesPolicyModel.findOne<IResourcesPolicy>({ slug: 'dpl', accessLevel: 0 }).lean()]);

		if (!defaultAccreditation || !defaultResourcesPolicy) return false;

		const existingUser = await UserModel.findOne({ email }).exec();

		if (existingUser) {
			const updates = {
				username: profile?.name ?? profile?.login ?? existingUser.username,
				image: user.image ?? profile?.image ?? existingUser.image,
				name: profile?.name ?? user.name ?? profile?.login ?? existingUser.name,
			};

			await UserModel.updateOne({ _id: existingUser._id }, updates);
		} else {
			const newUser = await UserModel.create({
				email,
				id: uuid().replace(/-/g, ''),
				username: profile?.name ?? profile?.login ?? null,
				image: user.image ?? profile?.image ?? null,
				provider,
				name: profile?.name ?? user.name ?? profile?.login ?? null,
				verified: ['google', 'github'].includes(provider),
				accreditation: defaultAccreditation._id,
				resourcesPolicy: defaultResourcesPolicy._id,
			});

			await sendEmail(email, 'welcome');
		}

		return true;
	} catch (error) {
		console.error('Sign-in error:', error);
		return false;
	}
};

export const getUser = async (): Promise<User | null> => {
	const session = await getServerSession();

	const userCookies = await cookies();

	const token = userCookies.get(process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token');
	if (!token) return null;

	if (!(await checkTwoFactor(token))) return null;

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

export const checkAccreditation = async (request: string, id?: string): Promise<Boolean> => {
	const session = await getServerSession();
	if (!session) return false;

	await db.connect();
	const user = await UserModel.findOne<IUser>({ email: session?.user?.email }).populate<{ accreditation: IAccreditation }>('accreditation', '-slug -accessLevel').exec();
	if (!user) return false;

	const [access, accessLevel, action]: string[] = request.split(':');

	const { authorizations } = user.accreditation;
	if (authorizations && authorizations[access] && authorizations[access].includes(action)) {
		return true;
	}

	if (accessLevel === '1') {
		const project = await ProjectModel.findOne<IProject>({ slug: id }).exec();
		if (!project) return false;

		const member = project.members.find((member) => member.userId.toString() === user._id.toString());
		if (!member) return false;

		const projectAccreditation = await AccreditationModel.findOne({ _id: member.accreditation }).exec();
		if (!projectAccreditation) return false;

		const { authorizations: projectAuthorizations } = projectAccreditation;
		if (projectAuthorizations && projectAuthorizations[access] && projectAuthorizations[access].includes(action)) {
			return true;
		}
	} else if (accessLevel === '2') {
		if (!id) return false;
		const [projectName, appName] = id.split('/');
		const project = await ProjectModel.findOne<IProject>({ slug: projectName }).exec();
		if (!project) return false;

		const member = project.members.find((member) => member.userId.toString() === user._id.toString());
		if (!member) return false;

		const projectAccreditation = await AccreditationModel.findOne({ _id: member.accreditation }).exec();
		if (!projectAccreditation) return false;

		const { authorizations: projectAuthorizations } = projectAccreditation;
		if (projectAuthorizations && projectAuthorizations[access] && projectAuthorizations[access].includes(action)) {
			return true;
		}

		const app = await AppModel.findOne<IApp>({ name: appName, projectId: project._id }).exec();
		if (!app) return false;

		const collaborator = app.collaborators.find((collaborator) => collaborator.userId.toString() === user._id.toString());
		if (!collaborator) return false;

		const appAccreditation = await AccreditationModel.findOne({ _id: collaborator.accreditation }).exec();
		if (!appAccreditation) return false;

		const { authorizations: appAuthorizations } = appAccreditation;
		if (appAuthorizations && appAuthorizations[access] && appAuthorizations[access].includes(action)) {
			return true;
		}
	}

	return false;
};

export const authOptions: NextAuthOptions = {
	pages: {
		signIn: '/login',
		verifyRequest: '/login',
		error: '/login',
	},
	providers: getProviders(),
	session: {
		strategy: 'jwt',
		maxAge: 7 * 24 * 60 * 60, // 7 days
	},
	callbacks: {
		jwt: enhanceToken,
		signIn: handleSignIn,
	},
	events: {
		signIn: async ({ user, account }) => {
			await db.connect();
			await UserModel.updateOne({ email: user.email }, { lastLogin: new Date() });
		},
	},
};

export default NextAuth(authOptions);
