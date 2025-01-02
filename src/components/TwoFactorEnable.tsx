'use client';
import { SetStateAction, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2, KeyRound, ArrowRight, Lock } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function TwoFactorEnable({ secret, QRUri }: { secret: string; QRUri: string }) {
	const [showSecret, setShowSecret] = useState(false);
	const [QRCodePage, setQRCodePage] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [otp, setOtp] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const searchParams = useSearchParams();
	const router = useRouter();

	const callbackUrl = searchParams.get('callbackUrl');
	const redirectPath = callbackUrl || '/';

	async function enableTwoFactor() {
		try {
			setIsLoading(true);
			const response = await fetch(`/api/auth/factor/enable`, {
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

	async function skipTwoFactor() {
		try {
			setIsLoading(true);
			const response = await fetch(`/api/auth/factor/skip`, { method: 'POST' });
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
						<CardTitle>Two-Factor Authentication</CardTitle>
						{QRCodePage ? <p className="text-sm text-muted-foreground">Enhance your account security by setting up 2FA using an authenticator app</p> : <p className="text-sm text-muted-foreground">Enter the 6-digit code from your authenticator app</p>}
					</div>
				</CardHeader>

				<CardContent className="space-y-2">
					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
					{QRCodePage && (
						<div className="space-y-6">
							<div className="flex justify-center">
								<div className="p-4 bg-white rounded-lg">
									<img src={QRUri} alt="QR Code" width="180" height="180" className="aspect-square" />
								</div>
							</div>

							<div className="space-y-3">
								<Button variant="outline" onClick={() => setShowSecret(!showSecret)} className="w-full flex items-center justify-center gap-2">
									<KeyRound className="w-4 h-4" />
									{showSecret ? 'Hide' : 'Show'} Secret Key
								</Button>

								{showSecret && (
									<div className="space-y-2">
										<Input value={secret} readOnly className="font-mono text-center" />
									</div>
								)}
							</div>
						</div>
					)}

					{!QRCodePage && (
						<div className="space-y-4 flex items-center justify-center flex-col">
							<Label className="text-center block">Verification Code</Label>
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
					)}
				</CardContent>

				<CardFooter className="flex flex-col gap-3">
					<Button className="w-full flex gap-1.5 justify-center items-center" onClick={() => (QRCodePage ? setQRCodePage(false) : enableTwoFactor())} disabled={isLoading || (!QRCodePage && otp.length !== 6)}>
						{isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
						{QRCodePage ? (
							<>
								Continue
								<ArrowRight className="w-4 h-4" />
							</>
						) : (
							'Enable 2FA'
						)}
					</Button>

					<Button variant="ghost" className="w-full" onClick={() => skipTwoFactor()} disabled={isLoading}>
						Skip for now
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
