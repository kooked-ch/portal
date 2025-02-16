import { ReactNode } from 'react';
import React from 'react';
import { Header } from '@/components/header';
import { getUser } from '@/lib/auth';
import { ProjectsType } from '@/types/project';
import { getProjects } from '@/lib/project';
import { redirect } from 'next/navigation';

export default async function RootLayout({ children }: { children: ReactNode }) {
	const user = await getUser();
	if (!user) redirect('/login');
	const projects: ProjectsType[] | null = await getProjects();

	return (
		<main>
			<Header user={user} projects={projects} />
			{children}
		</main>
	);
}
