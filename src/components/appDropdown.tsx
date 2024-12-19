'use client';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { EllipsisVertical } from 'lucide-react';
import Link from 'next/link';

export function AppDropdown() {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="outline-none" asChild>
				<Button variant="ghost" size="icon">
					<EllipsisVertical />
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent side="bottom" align="end" className="w-[200px] *:cursor-pointer">
				<DropdownMenuLabel className="flex flex-col"></DropdownMenuLabel>

				<DropdownMenuSeparator />

				<DropdownMenuItem asChild>
					<Link href="/me">My Profile</Link>
				</DropdownMenuItem>

				<DropdownMenuItem asChild>
					<Link href="/settings">Settings</Link>
				</DropdownMenuItem>

				<DropdownMenuSeparator />
				<DropdownMenuItem>Log Out</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
