import { ReactNode } from 'react';
import React from 'react';
import { Session } from 'next-auth';
import { Header } from '@/components/header';
import { getSession } from '@/lib/auth';

export default async function RootLayout({ children }: { children: ReactNode }) {
	const session: Session = await getSession();

	return (
		<main>
			<Header session={session} />
			{children}
		</main>
	);
}
