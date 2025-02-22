'use client';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { EllipsisVertical } from 'lucide-react';
import { AppType } from '@/types/app';
import { UpdateApp } from './forms/UpdateApp';
import DeleteApp from './forms/DeleteApp';

export function AppDropdown({ app }: { app: AppType }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="outline-none" asChild>
				<Button variant="ghost" size="icon">
					<EllipsisVertical />
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent side="bottom" align="end" className="w-[200px] *:cursor-pointer">
				{app.authorizations.apps?.includes('update') && <UpdateApp repository={app.repository?.url} description={app.description} />}
				{app.authorizations.apps?.includes('delete') && <DropdownMenuSeparator />}
				{app.authorizations.apps?.includes('delete') && <DeleteApp />}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
