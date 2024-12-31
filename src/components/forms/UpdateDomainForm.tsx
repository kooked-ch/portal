'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { Label } from '../ui/label';
import { usePathname, useRouter } from 'next/navigation';
import { domainSchema, DomainType } from '@/types/domain';
import { useForm, Controller } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export default function EditDomainDialog({ domain, containersList }: { domain: DomainType; containersList: string[] }) {
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
		resolver: zodResolver(domainSchema),
		defaultValues: { url: domain.url, port: domain.port, container: domain.container },
	});

	const onSubmit = async (data: { url: string; port: number; container: string }) => {
		setLoading(true);

		try {
			const response = await fetch(`/api/project${pathname}/domains/${domain.url}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: data.url, port: data.port, container: data.container }),
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
				<Button variant="link" className="text-[#666] px-0 py-0 h-1">
					Edit
				</Button>
			</DialogTrigger>
			<DialogContent tabIndex={undefined}>
				<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
					<DialogHeader className="mb-5">
						<DialogTitle>Edit Domain</DialogTitle>
						<DialogDescription>Configure the URL, port, and container for the domain.</DialogDescription>
					</DialogHeader>
					<Label htmlFor="url" className="mb-2">
						Domain url
					</Label>
					<Input disabled id="url" {...register('url')} />
					{errors.url && <p className="text-red-500 text-sm">{errors.url.message}</p>}

					<Label htmlFor="container" className="mt-3 mb-2">
						Container
					</Label>
					<div className="flex space-x-2">
						<div className="w-full">
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
						</div>
						<div className="w-32">
							<Input id="port" {...register('port')} type="number" placeholder="3000" />
							{errors.port && <p className="text-red-500 text-sm">{errors.port.message}</p>}
						</div>
					</div>

					{globalError && <p className="text-red-500 text-sm mt-3">{globalError}</p>}

					<DialogFooter className="mt-4">
						<DialogTrigger asChild>
							<Button variant="secondary">Cancel</Button>
						</DialogTrigger>
						<Button type="submit" disabled={loading}>
							{loading ? 'Updating...' : 'Update'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
