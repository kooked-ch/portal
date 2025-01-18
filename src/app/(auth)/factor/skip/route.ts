import { getTwoFactor } from '@/lib/factor';
import { encode, getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
	const token = await getToken({ req });

	const { disabled } = await getTwoFactor();

	if (token) {
		token.twoFactorDisabled = disabled;

		const encodedToken = await encode({
			token,
			secret: process.env.NEXTAUTH_SECRET!,
		});

		const response = NextResponse.redirect(new URL('/', process.env.NEXTAUTH_URL!));
		response.cookies.set({
			name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
			value: encodedToken,
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax' as const,
			path: '/',
			maxAge: 60 * 60 * 24 * 7,
		});

		return response;
	}

	return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL!));
}
