'use client';

import { useState } from 'react';
import { Loader2, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvitationType } from '@/types/member';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from './ui/alert';

const AcceptInvitation = ({ invitation }: { invitation: InvitationType }) => {
	const [isLoading, setIsLoading] = useState(false);
	const [accepted, setAccepted] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const router = useRouter();

	const handleAccept = async () => {
		setIsLoading(true);
		const response = await fetch(`/api/invitation/${invitation.token}/accept`, {
			method: 'POST',
		});
		const data = await response.json();
		if (!response.ok) {
			console.error(data.message);
			setError(data.message);
			setIsLoading(false);
		} else {
			router.push(`${invitation.project.slug}`);
		}
	};

	return (
		<div className="h-svh w-full flex items-center justify-center p-4 md:p-8">
			<div className="w-full max-w-md bg-card/95 rounded-xl shadow-2xl shadow-black/20 md:border md:border-border/50 p-6 pt-2 md:p-8 space-y-6">
				<div className="space-y-2 text-center">
					<div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent mb-4">
						<Sparkles className="w-6 h-6 text-primary" />
					</div>
					<h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Join {invitation.project.name}</h1>
					<p className="text-sm text-muted-foreground max-w-sm mx-auto">You've been invited to collaborate</p>
				</div>

				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<Button className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleAccept} disabled={isLoading || accepted}>
					{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : accepted ? <Check className="mr-2 h-4 w-4" /> : null}
					{accepted ? 'Joined' : 'Accept Invitation'}
				</Button>
			</div>
		</div>
	);
};

export default AcceptInvitation;
