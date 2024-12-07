import { User } from 'next-auth';
import * as React from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Container, Settings } from 'lucide-react';
import { UserDropdown } from './userDropdown';

export async function Header({ user }: { user: User }) {
	return (
		<header className="border-b p-4">
			<nav className="max-w-[1400px] mx-auto flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Container className="w-8 h-8 text-primary" />
					<h1 className="text-2xl font-bold uppercase">Portal</h1>
				</div>
				<div className="flex items-center gap-3">
					<Select>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Select a fruit" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectLabel>Fruits</SelectLabel>
								<SelectItem value="apple">Apple</SelectItem>
								<SelectItem value="banana">Banana</SelectItem>
								<SelectItem value="blueberry">Blueberry</SelectItem>
								<SelectItem value="grapes">Grapes</SelectItem>
								<SelectItem value="pineapple">Pineapple</SelectItem>
							</SelectGroup>
						</SelectContent>
					</Select>
					<UserDropdown user={user} />
				</div>
			</nav>
		</header>
	);
}
