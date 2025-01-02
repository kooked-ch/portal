'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { Label } from '../ui/label';
import { usePathname, useRouter } from 'next/navigation';
import { containerSchema } from '@/types/container';

export default function CreateContainerDialog({ disabled }: { disabled: boolean }) {
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const [globalError, setGlobalError] = useState<string | null>(null);
	const [envVars, setEnvVars] = useState([{ name: '', value: '' }]);
	const pathname = usePathname();
	const router = useRouter();

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(containerSchema),
		defaultValues: { name: '', image: '', version: '' },
	});

	const handleEnvVarChange = (index: number, key: 'name' | 'value', value: string) => {
		const updatedEnvVars = [...envVars];
		updatedEnvVars[index][key] = value;
		setEnvVars(updatedEnvVars);
	};

	const addEnvVar = () => {
		setEnvVars([...envVars, { name: '', value: '' }]);
	};

	const removeEnvVar = (index: number) => {
		setEnvVars(envVars.filter((_, i) => i !== index));
	};

	const onSubmit = async (data: { name: string; image: string; version: string }) => {
		setLoading(true);

		try {
			const response = await fetch(`/api/project${pathname}/containers`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: data.name, image: data.image, version: data.version, env: envVars }),
			});

			if (!response.ok) {
				const error = await response.json();
				setGlobalError(error.message || 'An unexpected error occurred. Please try again later.');
			} else {
				router.refresh();
				reset();
				setEnvVars([{ name: '', value: '' }]);
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

					<div className="mt-3 flex flex-col">
						<Label className="mt-3 mb-2">Environment Variables</Label>
						{envVars.map((envVar, index) => (
							<div key={index} className="flex items-center space-x-2 mt-2">
								<Input value={envVar.name} onChange={(e) => handleEnvVarChange(index, 'name', e.target.value)} placeholder="name" className="w-1/2" />
								<Input value={envVar.value} onChange={(e) => handleEnvVarChange(index, 'value', e.target.value)} placeholder="Value" className="w-1/2" />
								<Button variant="outline" size="sm" onClick={() => removeEnvVar(index)} type="button">
									Remove
								</Button>
							</div>
						))}
						<Button variant="ghost" className="mt-2 w-min" size="sm" onClick={addEnvVar} type="button">
							+ Add Environment Variable
						</Button>
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
