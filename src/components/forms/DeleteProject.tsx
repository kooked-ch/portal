'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { usePathname, useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

export default function DeleteProject() {
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const [globalError, setGlobalError] = useState<string | null>(null);
	const router = useRouter();
	const pathname = usePathname();

	const handleDelete = async () => {
		setLoading(true);

		try {
			const response = await fetch(`/api/project${pathname}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				const error = await response.json();
				console.error(error);
				setGlobalError(error.message || 'An unexpected error occurred. Please try again later.');
			} else {
				router.push('/');
				setOpen(false);
				setGlobalError(null);
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
				<div className="relative flex select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors text-red-500 hover:bg-red-500 hover:bg-opacity-10 focus:bg-red-500 focus:bg-opacity-10 focus:text-red-500 cursor-pointer">
					<Trash2 className="size-4" />
					Delete
				</div>
			</DialogTrigger>
			<DialogContent tabIndex={undefined}>
				<form className="flex flex-col">
					<DialogHeader className="">
						<DialogTitle>Delete Project</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete <strong>{pathname.replace('/', '')}</strong> project? This action cannot be undone.
						</DialogDescription>
					</DialogHeader>

					{globalError && <p className="text-red-500 text-sm my-3">{globalError}</p>}

					<DialogFooter className="mt-4 gap-2 md:gap-0">
						<DialogTrigger asChild>
							<Button variant="secondary">Cancel</Button>
						</DialogTrigger>
						<Button type="button" onClick={handleDelete} disabled={loading}>
							{loading ? 'Deleting...' : 'Delete'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
