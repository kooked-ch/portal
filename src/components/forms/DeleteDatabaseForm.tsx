'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export default function DeleteDatabaseDialog({ databaseName }: { databaseName: string }) {
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const [globalError, setGlobalError] = useState<string | null>(null);
	const router = useRouter();
	const pathname = usePathname();

	const handleDelete = async () => {
		setLoading(true);

		try {
			const response = await fetch(`/api/project${pathname}/databases/${databaseName}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				const error = await response.json();
				console.error(error);
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
				<Button variant="ghost" size="icon" className="hover:bg-red-500/10 hover:text-red-400">
					<Trash2 className="w-4 h-4" />
				</Button>
			</DialogTrigger>
			<DialogContent tabIndex={undefined}>
				<form className="flex flex-col">
					<DialogHeader className="">
						<DialogTitle>Delete Database</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete <strong>{databaseName}</strong> database? This action cannot be undone.
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
