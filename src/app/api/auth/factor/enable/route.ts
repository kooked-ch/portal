import { NextRequest, NextResponse } from 'next/server';
import { enableTwoFactor, verifyTwoFactor } from '@/lib/factor';

export async function POST(req: NextRequest) {
	try {
		const { otp } = await req.json();

		if (!otp) {
			return NextResponse.json({ error: 'TOTP code are required' }, { status: 400 });
		}

		return await enableTwoFactor(otp, req);
	} catch (error) {
		console.error('Error during activation of the two factor:', error);
		return NextResponse.json({ error: 'Error during activation of the two factor' }, { status: 500 });
	}
}
