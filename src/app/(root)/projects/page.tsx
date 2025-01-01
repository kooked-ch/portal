'use server';

import { getProjects } from '@/lib/project';
import { getUser } from '@/lib/auth';
import { ProjectsType } from '@/types/project';
import ProjectsView from '@/components/ProjectsView';
import { redirect } from 'next/navigation';

export default async function ProjectsPage() {
	const user = await getUser();
	if (!user) redirect('/login');
	const projects: ProjectsType[] | null = await getProjects(user.id);

	return (
		<div className="max-w-[1400px] mx-auto py-8 px-4">
			<ProjectsView projects={projects} />
		</div>
	);
}
