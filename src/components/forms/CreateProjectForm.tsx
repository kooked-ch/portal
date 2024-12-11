'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTrigger, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { projectSchema } from '@/types/project';
import { Plus } from 'lucide-react';

export default function CreateProjectForm({ onProjectCreated }: { onProjectCreated: () => void }) {
	const [isDialogOpen, setDialogOpen] = useState(false);

	const {
		register,
		handleSubmit,
		reset,
		setError,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(projectSchema),
		defaultValues: { name: '', description: '' },
	});

	const addProject = async (data: { name: string; description: string }) => {
		const newProject = {
			name: data.name,
			description: data.description,
		};

		try {
			const response = await fetch('/api/project', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(newProject),
			});

			if (response.ok) {
				reset();
				setDialogOpen(false);
				onProjectCreated();
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
				<Button>
					<Plus className="h-4 w-4" /> New Project
				</Button>
			</DialogTrigger>
			<DialogContent tabIndex={undefined}>
				<form onSubmit={handleSubmit(addProject)} className="flex flex-col">
					<DialogHeader className="mb-3">
						<DialogTitle>Create New Project</DialogTitle>
						<DialogDescription>Fill in the form below to create a new project. All fields are required.</DialogDescription>
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

					<DialogFooter className="mt-4">
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
