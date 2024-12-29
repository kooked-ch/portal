'use server';
import ProjectView from '@/components/ProjectView';
import { getProject } from '@/lib/project';

export default async function ProjectsPage({ params }: { params: { projectName: string } }) {
	const project = await getProject(params.projectName);

	if (!project) {
		return <div className="text-muted-foreground text-center justify-center flex items-center h-[calc(100vh-100px)]">Project not found</div>;
	}

	return (
		<div className="xl:container mx-auto px-4 xl:px-28 py-8">
			<ProjectView project={project} />
		</div>
	);
}
