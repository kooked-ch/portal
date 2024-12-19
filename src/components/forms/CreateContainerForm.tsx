'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { Label } from '../ui/label';
import { usePathname, useRouter } from 'next/navigation';
import { containerSchema } from '@/types/container';

export default function CreateContainerDialog() {
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const [globalError, setGlobalError] = useState<string | null>(null);
	const pathname = usePathname();
	const router = useRouter();

	const {
		register,
		handleSubmit,
		reset,
		setError,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(containerSchema),
		defaultValues: { name: '', image: '', version: '' },
	});

	const onSubmit = async (data: { name: string; image: string; version: string }) => {
		setLoading(true);

		try {
			const response = await fetch(`/api/project/${pathname}/containers`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: data.name, image: data.image, version: data.version }),
			});

			if (!response.ok) {
				const error = await response.json();
				console.log(error);
				setGlobalError(error.error || 'An unexpected error occurred. Please try again later.');
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
					<Plus className="w-4 h-4" /> Add Container
				</Button>
			</DialogTrigger>
			<DialogContent tabIndex={undefined}>
				<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
					<DialogHeader className="mb-5">
						<DialogTitle>Create a New Container</DialogTitle>
						<DialogDescription>Containers are the building blocks of your app. You can create multiple containers to run different services.</DialogDescription>
					</DialogHeader>

					<Label htmlFor="name" className="mb-2">
						Container Name
					</Label>
					<Input id="name" {...register('name')} />
					{errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}

					<Label htmlFor="image" className="mt-3 mb-2">
						Image
					</Label>
					<div className="flex space-x-2">
						<div className="w-full">
							<Input id="image" {...register('image')} placeholder="Image name" />
							{errors.image && <p className="text-red-500 text-sm">{errors.image.message}</p>}
						</div>
						<div className="w-32">
							<Input id="version" {...register('version')} placeholder="1.0.0" />
							{errors.version && <p className="text-red-500 text-sm">{errors.version.message}</p>}
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
