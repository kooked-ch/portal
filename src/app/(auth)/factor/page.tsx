import TwoFactorVerify from '@/components/TwoFactorVerify';
import { getTwoFactor } from '@/lib/factor';
import { redirect } from 'next/navigation';

export default async function VerifyPage({ params, searchParams }: { params: { slug: string }; searchParams?: { [key: string]: string | string[] | undefined } }) {
	const { enabled, disabled } = await getTwoFactor();

	const redirectPath = Array.isArray(searchParams?.callbackUrl) ? searchParams.callbackUrl[0] : searchParams?.callbackUrl || '/';

	if (disabled) {
		redirect('/factor/skip');
	}

	if (!disabled && !enabled) {
		redirect(`/enable?callbackUrl=${encodeURIComponent(redirectPath)}`);
	}

	return <TwoFactorVerify />;
}
