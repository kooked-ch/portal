'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTrigger, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { appSchema } from '@/types/app';
import { usePathname } from 'next/navigation';

export function CreateAppForm({ onAppCreated, disabled }: { onAppCreated: () => void; disabled: boolean }) {
	const [isDialogOpen, setDialogOpen] = useState(false);
	const pathname = usePathname();

	const {
		register,
		handleSubmit,
		reset,
		setError,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(appSchema),
		defaultValues: { name: '', description: '', repository: '' },
	});

	const addApp = async (data: { name: string; description: string; repository: string }) => {
		try {
			const response = await fetch(`/api/project${pathname}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: data.name,
					description: data.description,
					repository: data.repository,
				}),
			});

			if (response.ok) {
				reset();
				setDialogOpen(false);
				onAppCreated();
			} else {
				const error = await response.json();
				setError('name', { type: 'manual', message: error.message || 'An unexpected error occurred' });
			}
		} catch (error) {
			console.error('Network error:', error);
		}
	};

	return (
		<Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
			<DialogTrigger asChild>
				<Button className="h-8 px-3 py-0 md:h-9 md:px-4 md:py-2" disabled={disabled}>
					<Plus className="size-4" /> Create New App
				</Button>
			</DialogTrigger>
			<DialogContent tabIndex={undefined}>
				<form onSubmit={handleSubmit(addApp)} className="flex flex-col">
					<DialogHeader className="mb-3">
						<DialogTitle>Create New App</DialogTitle>
						<DialogDescription>Fill in the form below to create a new app. All fields are required.</DialogDescription>
					</DialogHeader>

					<Label htmlFor="name" className="mb-2">
						Name
					</Label>
					<Input id="name" {...register('name')} />
					{errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}

					<Label htmlFor="description" className="mt-3 mb-2">
						Description
					</Label>
					<Input id="description" {...register('description')} />
					{errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}

					<Label htmlFor="repository" className="mt-3 mb-2">
						Repository
					</Label>
					<Input id="repository" {...register('repository')} />
					{errors.repository && <p className="text-red-500 text-sm">{errors.repository.message}</p>}

					<DialogFooter className="mt-4 gap-2 md:gap-0">
						<DialogTrigger asChild>
							<Button variant="secondary">Cancel</Button>
						</DialogTrigger>
						<Button type="submit">Create</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
