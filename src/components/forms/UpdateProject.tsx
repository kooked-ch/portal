import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePathname, useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Cog } from 'lucide-react';
import { projectSchema } from '@/types/project';

type FormData = {
	name: string;
	description: string;
};

export const UpdateProject = ({ name, description }: FormData) => {
	const [isOpen, setIsOpen] = useState(false);
	const [globalError, setGlobalError] = useState<string | null>(null);

	const pathname = usePathname();
	const router = useRouter();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		reset,
	} = useForm<FormData>({
		resolver: zodResolver(projectSchema),
		defaultValues: { name, description },
	});

	const onSubmit = async (data: FormData) => {
		try {
			const response = await fetch(`/api/project${pathname}/settings`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to update project');
			}

			router.refresh();
			reset();
			setGlobalError(null);
			setIsOpen(false);
		} catch (err) {
			setGlobalError(err instanceof Error ? err.message : 'An unexpected error occurred');
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<div className="relative flex select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer">
					<Cog className="size-4" />
					Settings
				</div>
			</DialogTrigger>

			<DialogContent tabIndex={-1}>
				<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
					<DialogHeader className="mb-5">
						<DialogTitle>Edit Project</DialogTitle>
						<DialogDescription>Update the name and description of your project.</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">Project Name</Label>
							<Input tabIndex={1} id="name" {...register('name')} />
							{errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Input tabIndex={2} id="description" {...register('description')} />
							{errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
						</div>

						{globalError && <p className="text-red-500 text-sm">{globalError}</p>}
					</div>

					<DialogFooter className="mt-4 gap-2 md:gap-0">
						<Button tabIndex={3} type="button" variant="secondary" onClick={() => setIsOpen(false)}>
							Cancel
						</Button>
						<Button tabIndex={4} type="submit" disabled={isSubmitting}>
							{isSubmitting ? 'Updating...' : 'Update'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
