'use client';

import RegisterComponent from '@/components/register';
import { Suspense } from 'react';

export default function LoginPage() {
	return (
		<Suspense fallback={<div></div>}>
			<RegisterComponent />
		</Suspense>
	);
}
