import { ReactNode } from 'react';
import React from 'react';
import { User } from 'next-auth';
import { Header } from '@/components/header';
import { getUser } from '@/lib/auth';
import { ProjectsType } from '@/types/project';
import { getProjects } from '@/lib/project';

export default async function RootLayout({ children }: { children: ReactNode }) {
	const user: User = await getUser();
	const projects: ProjectsType[] | null = await getProjects(user.id);

	return (
		<main>
			<Header user={user} projects={projects} />
			{children}
		</main>
	);
}
