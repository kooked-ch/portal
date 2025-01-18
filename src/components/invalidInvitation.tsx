'use client';
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

const InvalidInvitation = () => {
	const router = useRouter();

	return (
		<div className="h-svh w-full flex items-center justify-center p-4 md:p-8">
			<div className="w-full max-w-md bg-card/95 rounded-xl shadow-2xl shadow-black/20 md:border md:border-border/50 p-6 pt-2 md:p-8 space-y-6">
				<div className="space-y-2 text-center">
					<div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mb-4">
						<AlertCircle className="w-6 h-6 text-destructive" />
					</div>
					<h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Invalid Invitation</h1>
					<p className="text-sm text-muted-foreground max-w-sm mx-auto">This invitation link appears to be invalid or has expired</p>
				</div>

				<Alert className="bg-destructive/10 border-destructive/20">
					<AlertDescription className="text-destructive">The invitation token is either incorrect or no longer active. Please request a new invitation from the project owner.</AlertDescription>
				</Alert>

				<Button className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => router.push('/')}>
					Return to Home
				</Button>

				<div className="text-center text-sm">
					<p className="text-muted-foreground">
						Need help?{' '}
						<a href="/help" className="text-primary hover:underline">
							Contact us
						</a>
					</p>
				</div>
			</div>
		</div>
	);
};

export default InvalidInvitation;
