'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '../ui/label';
import { usePathname } from 'next/navigation';
import { Info } from 'lucide-react';

export default function DisplayDatabaseDialog({ database }: { database: any }) {
	const pathname = usePathname();

	const databasesPorts: { [key in 'postgresql' | 'mariadb' | 'mongodb']: number } = {
		postgresql: 5432,
		mariadb: 3306,
		mongodb: 27017,
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="ghost" size="icon">
					<Info className="w-4 h-4" />
				</Button>
			</DialogTrigger>
			<DialogContent tabIndex={undefined}>
				<DialogHeader className="">
					<DialogTitle>Database Information</DialogTitle>
					<DialogDescription>Display all information about database</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col">
					<Label htmlFor="name" className="mb-2">
						Database Name
					</Label>
					<Input id="name" disabled value={database.name} readOnly />
					<Label htmlFor="url" className="mt-3 mb-2">
						Database Url
					</Label>
					<Input id="url" disabled value={`${pathname.split('/')[2]}-${database.provider}:${databasesPorts[database.provider as keyof typeof databasesPorts]}`} readOnly />

					<Label htmlFor="provider" className="mt-3 mb-2">
						Database Type
					</Label>
					<Input id="provider" disabled value={database.provider} readOnly />

					<div className="flex space-x-2 mt-2">
						<div className="w-32">
							<Label htmlFor="username" className="mt-3 mb-2">
								Username
							</Label>
							<Input id="username" disabled value={database.username} />
						</div>
						<div className="w-full">
							<Label htmlFor="password" className="mt-3 mb-2">
								Password
							</Label>
							<Input id="password" disabled value={database.password} />
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
