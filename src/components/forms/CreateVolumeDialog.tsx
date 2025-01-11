'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { Label } from '../ui/label';
import { usePathname, useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { volumeSchema } from '@/types/volume';

export default function CreateVolumeDialog({ disabled, containersList }: { disabled: boolean; containersList: string[] }) {
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const [globalError, setGlobalError] = useState<string | null>(null);
	const pathname = usePathname();
	const router = useRouter();

	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(volumeSchema),
		defaultValues: { name: '', mountPath: '', container: '', size: 5 },
	});

	const onSubmit = async (data: { name: string; mountPath: string; container: string; size: number }) => {
		setLoading(true);

		try {
			const response = await fetch(`/api/project${pathname}/volumes`, {
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
				<Button variant="outline" size="sm" disabled={disabled}>
					<Plus className="w-4 h-4" /> Add Volume
				</Button>
			</DialogTrigger>
			<DialogContent tabIndex={undefined}>
				<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
					<DialogHeader className="mb-5">
						<DialogTitle>Create a New Volume</DialogTitle>
						<DialogDescription>Volume can be used to store in long threme your data</DialogDescription>
					</DialogHeader>

					<Label htmlFor="name" className="mb-2">
						Volume Name
					</Label>
					<Input id="name" {...register('name')} />
					{errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}

					<Label htmlFor="container" className="mt-3 mb-2">
						Container
					</Label>
					<Controller
						name="container"
						control={control}
						render={({ field }) => (
							<Select value={field.value} onValueChange={field.onChange}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select a container" />
								</SelectTrigger>
								<SelectContent>
									{containersList.map((container) => (
										<SelectItem key={container} value={container}>
											{container}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					/>
					{errors.container && <p className="text-red-500 text-sm">{errors.container.message}</p>}

					<div className="flex space-x-2 mt-3">
						<div className="w-full">
							<Label htmlFor="mountPath" className="mb-2">
								Mouth Path
							</Label>
							<Input id="mountPath" {...register('mountPath')} />
							{errors.mountPath && <p className="text-red-500 text-sm">{errors.mountPath.message}</p>}
						</div>
						<div className="w-32">
							<Label htmlFor="size" className="mb-2">
								Size
							</Label>
							<Input id="size" type="number" {...register('size')} />
							{errors.size && <p className="text-red-500 text-sm">{errors.size.message}</p>}
						</div>
					</div>

					{globalError && <p className="text-red-500 text-sm mt-3">{globalError}</p>}

					<DialogFooter className="mt-4 gap-2 md:gap-0">
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
