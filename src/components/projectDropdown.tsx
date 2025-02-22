import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Cog, Database, EllipsisVertical, Trash2, UsersRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ProjectType } from '@/types/project';
import { UpdateProject } from './forms/UpdateProject';
import DeleteProject from './forms/DeleteProject';

export const ProjectDropdown = ({ project }: { project: ProjectType }) => {
	const router = useRouter();

	if (!project.authorizations.members && !project.authorizations.resourcesPolicy) {
		return null;
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="outline-none" asChild>
				<Button variant="secondary" size="icon">
					<EllipsisVertical />
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent side="bottom" align="end" className="w-[200px] *:cursor-pointer">
				{project.authorizations.resourcesPolicy?.includes('read') && (
					<DropdownMenuItem onSelect={() => router.push(`/${project.slug}/resources-policy`)} className="cursor-pointer">
						<Database className="size-4" />
						Resources Policy
					</DropdownMenuItem>
				)}

				{project.authorizations.projects?.includes('update') && <UpdateProject name={project.name} description={project.description} />}

				{project.authorizations.members?.includes('read') && (
					<DropdownMenuItem onSelect={() => router.push(`/${project.slug}/members`)} className="cursor-pointer">
						<UsersRound className="size-4" />
						Users
					</DropdownMenuItem>
				)}

				{project.authorizations.projects?.includes('delete') && <DropdownMenuSeparator />}
				{project.authorizations.projects?.includes('delete') && <DeleteProject />}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
