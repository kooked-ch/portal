import { Session } from 'next-auth';

declare module 'next-auth' {
	interface Session {
		user: {
			username: string | undefined;
			name?: string | null;
			email?: string | null;
			image?: string | null;
			id: string;
			isTwoFactorComplete?: boolean;
		};
	}
	interface User {
		username: string | null;
		name: string;
		email: string;
		image?: string;
		isTwoFactorComplete?: boolean;
	}
}
