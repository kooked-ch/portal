'use server';

import { getProjects } from '@/lib/project';
import { getUser } from '@/lib/auth';
import { ProjectsType } from '@/types/project';
import ProjectsView from '@/components/ProjectsView';
import { redirect } from 'next/navigation';
import { checkResourcesPolicy } from '@/lib/resourcesPolicy';

export default async function Home() {
	const user = await getUser();
	if (!user) redirect('/login');
	const projects: ProjectsType[] | null = await getProjects(user.id);
	const disabled = await checkResourcesPolicy('projects');

	return (
		<div className="max-w-[1400px] mx-auto py-8 px-4">
			<ProjectsView projects={projects} disabled={disabled} />
		</div>
	);
}
