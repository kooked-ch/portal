'use client';
import { User } from 'next-auth';
import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Container } from 'lucide-react';
import { UserDropdown } from './userDropdown';
import { ProjectsType } from '@/types/project';

export function Header({ user, projects }: { user: User; projects: ProjectsType[] | null }) {
	const router = useRouter();
	const pathname = usePathname();

	const onProjectChange = (project: string) => {
		router.push(`/${project}`);
	};

	return (
		<header className="border-b p-4">
			<nav className="max-w-[1400px] mx-auto flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Container className="w-8 h-8 text-primary" />
					<h1 className="text-2xl font-bold uppercase">Portal</h1>
				</div>
				{projects && (
					<div className="flex items-center gap-3">
						<Select onValueChange={onProjectChange} defaultValue={projects.find((project) => pathname.includes(`/${project.slug}`))?.name}>
							<SelectTrigger className="md:w-[180px] w-32">
								<SelectValue placeholder="Select a project" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{projects.map((project, index) => (
										<SelectItem key={index} value={project.name}>
											{project.name}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
						<UserDropdown user={user} />
					</div>
				)}
			</nav>
		</header>
	);
}
