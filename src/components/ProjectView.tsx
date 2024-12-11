'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProjectType } from '@/types/project';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CreateAppForm } from './forms/CreateAppFrom';

export default function ProjectView({ project }: { project: ProjectType }) {
	const router = useRouter();

	const handleAppCreated = () => {
		router.refresh();
	};

	return (
		<div>
			<div className="flex justify-between items-center mb-8">
				<h1 className="text-3xl font-bold">{project.name}</h1>
				<CreateAppForm project={project} onAppCreated={handleAppCreated} />
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{project.apps.map((app, index) => (
					<Link href={project.slug + '/' + app.name} key={index}>
						<Card className="hover:shadow-lg transition-shadow">
							<CardHeader className="space-y-0 flex flex-row justify-between">
								<div>
									<CardTitle className="text-xl">{app.name}</CardTitle>
									<CardDescription>{app.description}</CardDescription>
								</div>
							</CardHeader>
						</Card>
					</Link>
				))}
			</div>
		</div>
	);
}
