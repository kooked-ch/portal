'use client';
import { SetStateAction, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function TwoFactorVerify() {
	const [error, setError] = useState<string | null>(null);
	const [otp, setOtp] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const searchParams = useSearchParams();
	const router = useRouter();
	const redirectPath = searchParams.get('callbackUrl') ?? '/';

	async function submit() {
		try {
			setIsLoading(true);
			const response = await fetch(`/api/auth/factor/verify`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ otp }),
			});

			if (response.ok) {
				router.push(redirectPath);
				return;
			}

			const body = await response.json();
			setError(body.error || 'An unexpected error occurred. Please try again later.');
		} catch (e) {
			setError('An unexpected error occurred. Please try again later.');
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="h-svh w-full flex items-center justify-center p-4">
			<Card className="w-full max-w-md md:border border-0">
				<CardHeader className="text-center space-y-4">
					<div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
						<Lock className="w-6 h-6 text-primary" />
					</div>
					<div className="space-y-2">
						<CardTitle>Kooked Portal</CardTitle>
						<p className="text-sm text-muted-foreground">Enter the 6-digit code from your authenticator app</p>
					</div>
				</CardHeader>

				<CardContent className="space-y-2 flex items-center justify-center flex-col">
					{error && (
						<Alert variant="destructive" className="w-full">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
					<div className="space-y-4">
						<InputOTP maxLength={6} value={otp} onChange={(value: SetStateAction<string>) => setOtp(value)} className="justify-center gap-2">
							<InputOTPGroup>
								<InputOTPSlot index={0} />
								<InputOTPSlot index={1} />
								<InputOTPSlot index={2} />
								<InputOTPSlot index={3} />
								<InputOTPSlot index={4} />
								<InputOTPSlot index={5} />
							</InputOTPGroup>
						</InputOTP>
					</div>
				</CardContent>

				<CardFooter>
					<Button className="w-full" onClick={submit} disabled={isLoading || otp.length !== 6}>
						{isLoading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
						Verify
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
