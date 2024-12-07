'use client';

import { useState } from 'react';
import { Ellipsis, LayoutGrid, List, UserRound } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProjectType } from '@/types/project';
import CreateProjectForm from './forms/CreateProjectForm';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ProjectsView({ projects }: { projects: ProjectType[] }) {
	const router = useRouter();

	const handleProjectCreated = () => {
		router.refresh();
	};

	return (
		<div>
			<div className="flex justify-between items-center mb-8">
				<h1 className="text-3xl font-bold">Projects</h1>
				<CreateProjectForm onProjectCreated={handleProjectCreated} />
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
