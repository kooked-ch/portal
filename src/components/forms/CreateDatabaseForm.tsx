'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { Label } from '../ui/label';
import { usePathname, useRouter } from 'next/navigation';
import { databaseSchema, DatabaseType } from '@/types/database';

const databasesList = ['PostgreSQL', 'MariaDB', 'MongoDB'];

const generateRandomString = (length: number) => {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return result;
};

export default function CreateDatabaseDialog() {
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const [globalError, setGlobalError] = useState<string | null>(null);
	const pathname = usePathname();
	const router = useRouter();

	const {
		control,
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(databaseSchema),
		defaultValues: { name: '', username: '', password: generateRandomString(36), provider: 'mongodb' as 'postgresql' | 'mariadb' | 'mongodb' },
	});

	const onSubmit = async (data: DatabaseType) => {
		setLoading(true);
		console.log(data);

		try {
			const response = await fetch(`/api/project${pathname}/databases`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const error = await response.json();
				setGlobalError(error.message || 'An unexpected error occurred. Please try again later.');
			} else {
				router.refresh();
				reset();
				setGlobalError(null);
				setOpen(false);
			}
		} catch (error: any) {
			setGlobalError('An unexpected error occurred. Please try again later.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					<Plus className="w-4 h-4" /> Add Database
				</Button>
			</DialogTrigger>
			<DialogContent tabIndex={undefined}>
				<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
					<DialogHeader className="mb-5">
						<DialogTitle>Create a New Database</DialogTitle>
						<DialogDescription>Create a new database to store and manage your application's data.</DialogDescription>
					</DialogHeader>

					<Label htmlFor="name" className="mb-2">
						Database Name
					</Label>
					<Input id="name" {...register('name')} placeholder={pathname.split('/')[2]} />
					{errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}

					<Label htmlFor="provider" className="mt-3 mb-2">
						Database Type
					</Label>

					<Controller
						name="provider"
						control={control}
						render={({ field }) => (
							<Select value={field.value} onValueChange={field.onChange}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select a provider" />
								</SelectTrigger>
								<SelectContent>
									{databasesList.map((database) => (
										<SelectItem key={database} value={database.toLowerCase()}>
											{database}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					/>

					<div className="flex space-x-2 mt-2">
						<div className="w-32">
							<Label htmlFor="username" className="mt-3 mb-2">
								Username
							</Label>
							<Input id="username" {...register('username')} placeholder="username" />
							{errors.username && <p className="text-red-500 text-sm">{errors.username.message}</p>}
						</div>
						<div className="w-full">
							<Label htmlFor="password" className="mt-3 mb-2">
								Password
							</Label>
							<Input id="password" {...register('password')} placeholder="XXXX" />
							{errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
						</div>
					</div>

					{globalError && <p className="text-red-500 text-sm mt-3">{globalError}</p>}

					<DialogFooter className="mt-4">
						<DialogTrigger asChild>
							<Button variant="secondary">Cancel</Button>
						</DialogTrigger>
						<Button type="submit" disabled={loading}>
							{loading ? 'Creating...' : 'Create'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
