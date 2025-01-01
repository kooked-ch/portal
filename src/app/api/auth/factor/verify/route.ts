import { NextRequest, NextResponse } from 'next/server';
import { verifyTwoFactor } from '@/lib/factor';

export async function POST(req: NextRequest) {
	try {
		const { otp } = await req.json();

		if (!otp) {
			return NextResponse.json({ error: 'TOTP code are required' }, { status: 400 });
		}

		return await verifyTwoFactor(otp, req);
	} catch (error) {
		console.error('Error during two factor verification:', error);
		return NextResponse.json({ error: 'Error during two factor verification' }, { status: 500 });
	}
}
