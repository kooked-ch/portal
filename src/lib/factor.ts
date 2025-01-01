import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import { IUser, UserModel } from '@/models/User';
import { symmetricDecrypt, symmetricEncrypt } from '@/lib/crypto';
import db from './mongo';
import { NextRequest, NextResponse } from 'next/server';
import { decode, encode, getToken } from 'next-auth/jwt';
import { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { getServerSession } from 'next-auth';

export async function getTwoFactor() {
	const session = await getServerSession();
	if (!session?.user?.email) return { enabled: false, disabled: false };

	await db.connect();
	const user = await UserModel.findOne<IUser>({ email: session.user.email }).exec();
	if (!user) return { enabled: false, disabled: false };

	return {
		enabled: user.twoFactorEnabled ?? false,
		disabled: user.twoFactorDisabled ?? false,
	};
}

export async function getTwoFactorQR() {
	const session = await getServerSession();
	if (!session?.user?.email) return null;

	const secret = authenticator.generateSecret(20);

	if (!process.env.NEXTAUTH_ENCRYPTION) throw new Error('NEXTAUTH_ENCRYPTION is not set.');

	await UserModel.updateOne(
		{ email: session?.user?.email },
		{
			twoFactorEnabled: false,
			twoFactorSecret: symmetricEncrypt(secret, process.env.NEXTAUTH_ENCRYPTION),
		}
	);

	const name = session?.user?.email;
	const keyUri = authenticator.keyuri(name, 'Kooked Portal', secret);
	const QRUri = await qrcode.toDataURL(keyUri);

	return {
		secret,
		QRUri,
	};
}

export async function skipTwoFactor() {
	const session = await getServerSession();
	if (!session?.user?.email) return null;

	await UserModel.updateOne(
		{ email: session.user.email },
		{
			twoFactorDisabled: true,
		}
	);

	return true;
}

export async function enableTwoFactor(otp: string, req: NextRequest) {
	const session = await getServerSession();
	if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	const user = await UserModel.findOne<IUser>({ email: session.user.email }).exec();
	if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	if (!user.twoFactorSecret) return NextResponse.json({ error: 'Unexpected error' }, { status: 401 });

	const secret = symmetricDecrypt(user.twoFactorSecret, process.env.NEXTAUTH_ENCRYPTION!);
	const isValidToken = authenticator.check(otp, secret);

	if (!isValidToken) {
		return NextResponse.json({ error: 'The submitted code is invalid' }, { status: 401 });
	}

	await UserModel.updateOne(
		{ email: session.user.email },
		{
			twoFactorEnabled: true,
			twoFactorDisabled: false,
		}
	);

	return await verifyTwoFactor(otp, req);
}

export async function verifyTwoFactor(otp: string, req: NextRequest) {
	const session = await getServerSession();
	if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	const { enabled, disabled } = await getTwoFactor();
	if (!enabled || disabled) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	const user = await UserModel.findOne<IUser>({ email: session.user.email }).exec();
	if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	if (!user.twoFactorSecret) return NextResponse.json({ error: 'Unexpected error' }, { status: 401 });

	const secret = symmetricDecrypt(user.twoFactorSecret, process.env.NEXTAUTH_ENCRYPTION!);
	const isValidToken = authenticator.check(otp, secret);

	if (!isValidToken) {
		return NextResponse.json({ error: 'The submitted code is invalid' }, { status: 401 });
	}

	const token = await getToken({ req });

	if (token) {
		token.twoFactorComplete = true;
		token.twoFactorExpiration = new Date(Date.now() + 1000 * 60 * 60 * 4).getTime();

		const encodedToken = await encode({
			token,
			secret: process.env.NEXTAUTH_SECRET!,
		});

		const response = NextResponse.json({ message: '2FA verification successful' }, { status: 200 });
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
	return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
}
