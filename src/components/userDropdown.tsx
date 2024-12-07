'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Cog, LogOut, Monitor, Moon, Sun, SunMoon, User2 } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Session } from 'next-auth';
import type { User } from 'next-auth';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function UserDropdown({ user }: { user: User }) {
	async function signOutHandler() {
		signOut();
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="rounded-full ring-offset-background focus-visible:outline-none">
				<Avatar className="border shadow-sm w-8 h-8 lg:w-10 lg:h-10">
					<AvatarImage src={user.image} alt={user.name} />
					<AvatarFallback>
						{user.name
							?.split(' ')
							.map((word) => word.charAt(0).toUpperCase())
							.join('')}
					</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>

			<DropdownMenuContent side="bottom" align="end" className="w-[200px] *:cursor-pointer">
				<DropdownMenuLabel className="flex flex-col">
					<span title={user.name} className="truncate capitalize">
						{user.name || user.username}
					</span>
					<span title={user.email} className="truncate text-sm font-normal text-muted-foreground">
						{user.email}
					</span>
				</DropdownMenuLabel>

				<DropdownMenuSeparator />

				<DropdownMenuItem asChild>
					<Link href="/me">
						<User2 size={16} className="mr-2" />
						My Profile
					</Link>
				</DropdownMenuItem>

				<DropdownMenuItem asChild>
					<Link href="/settings">
						<Cog size={16} className="mr-2" />
						Settings
					</Link>
				</DropdownMenuItem>

				{/* <DropdownMenuSub>
					<DropdownMenuSubTrigger>
						<SunMoon size={16} className="mr-2" />
						Theme
					</DropdownMenuSubTrigger>

					<DropdownMenuPortal>
						<DropdownMenuSubContent>
							<DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
								<Sun size={16} className="mr-2" />
								Light
							</DropdownMenuItem>

							<DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
								<Moon size={16} className="mr-2" />
								Dark
							</DropdownMenuItem>

							<DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer">
								<Monitor size={16} className="mr-2" />
								System
							</DropdownMenuItem>
						</DropdownMenuSubContent>
					</DropdownMenuPortal>
				</DropdownMenuSub> */}

				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={signOutHandler}>
					<LogOut size={16} className="mr-2" />
					Log Out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
