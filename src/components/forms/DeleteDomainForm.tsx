'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { usePathname, useRouter } from 'next/navigation';

export default function DeleteDomainDialog({ url }: { url: string }) {
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const [globalError, setGlobalError] = useState<string | null>(null);
	const router = useRouter();
	const pathname = usePathname();

	const handleDelete = async () => {
		setLoading(true);

		try {
			const response = await fetch(`/api/project/${pathname}/domains/${url}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				const error = await response.json();
				console.log(error);
				setGlobalError(error.message || 'An unexpected error occurred. Please try again later.');
			} else {
				router.refresh();
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
				<Button variant="link" className="text-[#666] px-0 py-0 h-1">
					Delete
				</Button>
			</DialogTrigger>
			<DialogContent tabIndex={undefined}>
				<form className="flex flex-col">
					<DialogHeader className="">
						<DialogTitle>Delete Domain</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete <strong>{url}</strong> domain? This action cannot be undone.
						</DialogDescription>
					</DialogHeader>

					{globalError && <p className="text-red-500 text-sm my-3">{globalError}</p>}

					<DialogFooter className="">
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
