'use server';
import { redirect } from 'next/navigation';
import { getTwoFactor, getTwoFactorQR } from '@/lib/factor';
import TwoFactorEnable from '@/components/TwoFactorEnable';

export default async function EnablePage() {
	const { enabled } = await getTwoFactor();

	if (enabled) {
		redirect('/');
	}

	const result = await getTwoFactorQR();
	if (!result) {
		redirect('/error');
	}
	const { secret, QRUri } = result;

	return <TwoFactorEnable secret={secret} QRUri={QRUri} />;
}
