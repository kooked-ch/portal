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
