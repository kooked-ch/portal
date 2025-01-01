import { skipTwoFactor } from '@/lib/factor';
import { encode, getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
	const skip = await skipTwoFactor();

	if (!skip) {
		return NextResponse.json({ message: 'Failed to skip two factor.' }, { status: 500 });
	}

	const token = await getToken({ req });

	if (token) {
		token.twoFactorDisabled = true;

		const encodedToken = await encode({
			token,
			secret: process.env.NEXTAUTH_SECRET!,
		});

		const response = NextResponse.json({ message: 'Skip successful' }, { status: 200 });
		response.cookies.set({
			name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
			value: encodedToken,
			httpOnly: true,
			secure: true,
			sameSite: 'lax' as const,
			path: '/',
			maxAge: 60 * 60 * 24 * 7,
		});

		return response;
	}

	return NextResponse.json({ message: 'Two factor skipped.' });
}
