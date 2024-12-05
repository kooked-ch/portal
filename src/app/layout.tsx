import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { SessionProvider } from '@/components/sessionProvider';
import React from 'react';
import { Session } from 'next-auth';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Kooked Portal',
	description: 'Manage and deploy your apps',
	keywords: ['portal', 'app management', 'deploy apps'],
	applicationName: 'Kooked Portal',
};

export default function RootLayout({
	children,
	session,
}: Readonly<{
	children: React.ReactNode;
	session: Session;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head />
			<body className={inter.className}>
				<SessionProvider session={session}>{children}</SessionProvider>
			</body>
		</html>
	);
}
