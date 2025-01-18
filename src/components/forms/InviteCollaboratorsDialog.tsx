'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { Label } from '../ui/label';
import { usePathname, useRouter } from 'next/navigation';
import { AccreditationType } from '@/types/accreditations';

export default function InviteCollaboratorsDialog({ accreditations }: { accreditations: AccreditationType[] }) {
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const [globalError, setGlobalError] = useState<string | null>(null);
	const pathname = usePathname();
	const router = useRouter();

	const {
		register,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { errors },
	} = useForm({
		defaultValues: { email: '', accreditation: accreditations[accreditations.length - 1].slug },
	});

	const onSubmit = async (data: { email: string; accreditation: string }) => {
		setLoading(true);

		try {
			const response = await fetch(`/api/project${pathname}/collaborators`, {
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
					<Plus className="w-4 h-4" /> Invite Collaborator
				</Button>
			</DialogTrigger>
			<DialogContent tabIndex={undefined}>
				<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
					<DialogHeader className="mb-5">
						<DialogTitle>Invite a Collaborator</DialogTitle>
						<DialogDescription>Provide the collaborator's email and their level of access.</DialogDescription>
					</DialogHeader>

					<Label htmlFor="email" className="mb-2">
						Collaborator Email
					</Label>
					<Input id="email" type="email" {...register('email', { required: 'Email is required' })} placeholder="example@domain.com" />
					{errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}

					<Label htmlFor="accreditation" className="mt-3 mb-2">
						Accreditation
					</Label>
					<Select onValueChange={(value) => setValue('accreditation', value)} defaultValue={watch('accreditation')}>
						<SelectTrigger id="accreditation">
							<SelectValue placeholder="Select accreditation" />
						</SelectTrigger>
						<SelectContent>
							{accreditations.map((accreditation) => (
								<SelectItem key={accreditation.slug} value={accreditation.slug}>
									{accreditation.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{globalError && <p className="text-red-500 text-sm mt-3">{globalError}</p>}

					<DialogFooter className="mt-4 gap-2 md:gap-0">
						<DialogTrigger asChild>
							<Button variant="secondary">Cancel</Button>
						</DialogTrigger>
						<Button type="submit" disabled={loading}>
							{loading ? 'Inviting...' : 'Invite'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
