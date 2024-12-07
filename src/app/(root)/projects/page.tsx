'use server';

import { getProjects } from '@/lib/project';
import { getUser } from '@/lib/auth';
import { ProjectType } from '@/types/project';
import ProjectsView from '@/components/ProjectsView';

export default async function ProjectsPage() {
	const user = await getUser();
	const projects: ProjectType[] = await getProjects(user.id);

	return (
		<div className="max-w-[1400px] mx-auto py-8 px-4">
			<ProjectsView projects={projects} />
		</div>
	);
}
