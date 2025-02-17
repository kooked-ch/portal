import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Database, EllipsisVertical, Trash2, UsersRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ProjectType } from '@/types/project';

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

				{project.authorizations.members?.includes('read') && (
					<DropdownMenuItem onSelect={() => router.push(`/${project.slug}/users`)} className="cursor-pointer">
						<UsersRound className="size-4" />
						Users
					</DropdownMenuItem>
				)}

				{project.authorizations.projects?.includes('delete') && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem className="text-red-500 hover:bg-red-500 hover:bg-opacity-10 focus:bg-red-500 focus:bg-opacity-10 focus:text-red-500 cursor-pointer">
							<Trash2 className="size-4" />
							Delete
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
