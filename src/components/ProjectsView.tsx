'use client';

import { useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProjectType } from '@/types/project';
import CreateProjectForm from './forms/CreateProjectForm';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProjectsView({ projects }: { projects: ProjectType[] }) {
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
	const router = useRouter();

	const handleProjectCreated = () => {
		router.refresh();
	};

	return (
		<div>
			<div className="flex justify-between items-center mb-8">
				<h1 className="text-3xl font-bold">Projects</h1>
				<div className="flex items-center gap-4">
					<ToggleGroup type="single" value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
						<ToggleGroupItem value="grid" aria-label="Grid view">
							<LayoutGrid className="h-4 w-4" />
						</ToggleGroupItem>
						<ToggleGroupItem value="list" aria-label="List view">
							<List className="h-4 w-4" />
						</ToggleGroupItem>
					</ToggleGroup>
					<CreateProjectForm onProjectCreated={handleProjectCreated} />
				</div>
			</div>

			{viewMode === 'list' ? (
				<Table>
					<TableHeader>
						<TableRow>
							<TableCell>Name</TableCell>
							<TableCell>Description</TableCell>
							<TableCell>Created</TableCell>
						</TableRow>
					</TableHeader>
					<TableBody>
						{projects.map((project, index) => (
							<TableRow key={index}>
								<TableCell className="font-medium">
									<Link href={project.slug}>{project.name}</Link>
								</TableCell>
								<TableCell>{project.description}</TableCell>
								<TableCell>{new Date(project.createdAt).toLocaleDateString()}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{projects.map((project, index) => (
						<Link href={project.slug} key={index}>
							<Card className="hover:shadow-lg transition-shadow">
								<CardHeader>
									<CardTitle className="text-xl">{project.name}</CardTitle>
									<CardDescription className="mt-2">{project.description}</CardDescription>
								</CardHeader>
							</Card>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
