'use client';

import { Ellipsis, UserRound } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProjectsType } from '@/types/project';
import CreateProjectForm from './forms/CreateProjectForm';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ProjectsView({ projects, disabled }: { projects: ProjectsType[] | null; disabled: boolean }) {
	const router = useRouter();

	const handleProjectCreated = () => {
		router.refresh();
	};

	if (!projects) {
		return (
			<div>
				<div className="flex justify-between items-center mb-8">
					<h1 className="text-3xl font-bold">Projects</h1>
					<CreateProjectForm onProjectCreated={handleProjectCreated} disabled={!disabled} />
				</div>
				<p className="text-lg text-center text-muted-foreground mt-[calc(30vh)]">No project</p>
			</div>
		);
	}

	return (
		<div>
			<div className="flex justify-between items-center mb-8">
				<h1 className="text-3xl font-bold">Projects</h1>
				<CreateProjectForm onProjectCreated={handleProjectCreated} disabled={!disabled} />
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{projects.map((project, index) => (
					<Link href={project.slug} key={index}>
						<Card className="hover:shadow-lg transition-shadow">
							<CardHeader className="space-y-0 flex flex-row justify-between">
								<div>
									<CardTitle className="text-xl">{project.name}</CardTitle>
									<CardDescription>{project.description}</CardDescription>
								</div>
								<div className="-mt-1">
									{project.members.length > 0 ? (
										<div className="flex items-center">
											{project.members.slice(0, 4).map((user, userIndex) => (
												<div key={userIndex} className="flex items-center justify-center bg-background rounded-full w-12 h-12 -ml-6 z-40">
													<Avatar className="border shadow-sm w-10 h-10">
														<AvatarImage src={user.image} alt={user.username} />
														<AvatarFallback>
															{user.username
																?.split(' ')
																.map((word) => word.charAt(0).toUpperCase())
																.join('')}
														</AvatarFallback>
													</Avatar>
												</div>
											))}
											{project.members.length > 4 && (
												<div className="flex items-center justify-center bg-background rounded-full w-12 h-12 -ml-6 z-40">
													<span className="rounded-full border shadow-sm flex items-center justify-center w-10 h-10 bg-muted">
														<Ellipsis className="w-5 h-5" />
													</span>
												</div>
											)}
										</div>
									) : (
										<span className="rounded-full border shadow-sm w-10 h-10 flex items-center justify-center -ml-1">
											<UserRound className="w-5 h-5" />
										</span>
									)}
								</div>
							</CardHeader>
						</Card>
					</Link>
				))}
			</div>
		</div>
	);
}
