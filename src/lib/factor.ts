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
