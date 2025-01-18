'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Github, Loader2, Lock, Mail, Sparkle, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { signIn } from 'next-auth/react';

const formSchema = z
	.object({
		name: z.string().min(2, 'Name must be at least 2 characters'),
		email: z.string().email('Invalid email address'),
		password: z.string().min(8, 'Password must be at least 8 characters'),
		confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ['confirmPassword'],
	});

const codeSchema = z.object({
	code: z.string().length(6, 'Code must be 6 characters long'),
});

export default function RegisterComponent() {
	const [isLoading, setIsLoading] = useState(false);
	const [step, setStep] = useState('register');
	const [error, setError] = useState<string | null>(null);
	const searchParams = useSearchParams();
	const router = useRouter();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: '',
			email: '',
			password: '',
			confirmPassword: '',
		},
	});

	const codeForm = useForm<z.infer<typeof codeSchema>>({
		resolver: zodResolver(codeSchema),
		defaultValues: {
			code: '',
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		setIsLoading(true);
		const response = await fetch('/api/auth/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(values),
		});
		const data = await response.json();

		if (!response.ok) {
			setError(data.error);
			setIsLoading(false);
		} else {
			setStep('verify');
			setError(null);
			setIsLoading(false);
		}
	}

	async function onVerify(values: z.infer<typeof codeSchema>) {
		setIsLoading(true);
		const response = await fetch('/api/auth/verify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: form.getValues('email'), code: values.code }),
		});
		const data = await response.json();

		if (!response.ok) {
			setError(data.error);
			setIsLoading(false);
		} else {
			await signIn('credentials', {
				email: form.getValues('email'),
				password: form.getValues('password'),
				callbackUrl: searchParams.get('callbackUrl') || '/',
			});
		}
	}

	useEffect(() => {
		if (searchParams.get('error')) {
			setError(searchParams.get('error'));
		}
	}, [searchParams]);

	const register = (
		<div className={'w-full max-w-md bg-card/95 rounded-xl shadow-2xl shadow-black/20 md:border md:border-border/50 md:backdrop-blur-sm p-6 pt-2 md:p-8 space-y-6'}>
			<div className="space-y-2 text-center">
				<div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent mb-4">
					<Sparkle className="w-6 h-6 text-accent-foreground" />
				</div>
				<h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Create an account</h1>
				<p className="text-sm text-muted-foreground max-w-sm mx-auto">Enter your information to create your account</p>
			</div>

			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			<form
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit(onSubmit)(e);
				}}
				className="space-y-4">
				<div>
					<label className="text-foreground/80 block mb-1">Full Name</label>
					<div className="relative">
						<User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
						<Input type="text" placeholder="John Doe" {...form.register('name')} className="w-full pl-10 h-10 bg-accent/50 border-border focus:border-primary/50 focus:ring-primary/20 rounded-md" />
					</div>
					<p className="text-destructive text-xs mt-1.5">{form.formState.errors.name?.message}</p>
				</div>

				<div>
					<label className="text-foreground/80 block mb-1">Email</label>
					<div className="relative">
						<Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
						<Input type="text" placeholder="name@example.com" {...form.register('email')} className="w-full pl-10 h-10 bg-accent/50 border-border focus:border-primary/50 focus:ring-primary/20 rounded-md" />
					</div>
					<p className="text-destructive text-xs mt-1.5">{form.formState.errors.email?.message}</p>
				</div>

				<div>
					<label className="text-foreground/80 block mb-1">Password</label>
					<div className="relative">
						<Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
						<Input type="password" placeholder="••••••••" {...form.register('password')} className="w-full pl-10 h-10 bg-accent/50 border-border focus:border-primary/50 focus:ring-primary/20 rounded-md" />
					</div>
					<p className="text-destructive text-xs mt-1.5">{form.formState.errors.password?.message}</p>
				</div>

				<div>
					<label className="text-foreground/80 block mb-1">Confirm Password</label>
					<div className="relative">
						<Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
						<Input type="password" placeholder="••••••••" {...form.register('confirmPassword')} className="w-full pl-10 h-10 bg-accent/50 border-border focus:border-primary/50 focus:ring-primary/20 rounded-md" />
					</div>
					<p className="text-destructive text-xs mt-1.5">{form.formState.errors.confirmPassword?.message}</p>
				</div>

				<button type="submit" className="w-full flex items-center gap-2 justify-center bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-md" disabled={isLoading}>
					{isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
					Create Account
				</button>

				<Separator />
			</form>

			<div className="space-y-3">
				<div className="text-xs text-center text-muted-foreground mb-4">Or continue with</div>
				<Button type="button" className="w-full h-10 bg-accent/50 border-border hover:bg-accent/70 text-muted-foreground py-2 text-white rounded-md flex items-center justify-center" onClick={() => signIn('github', { callbackUrl: searchParams.get('callbackUrl') || '/' })}>
					<Github className="mr-2 h-4 w-4" />
					Continue with GitHub
				</Button>
			</div>

			<div className="text-center text-sm">
				<p className="text-muted-foreground">
					Already have an account?{' '}
					<a href="/login" className="text-primary hover:underline">
						Sign in
					</a>
				</p>
			</div>
		</div>
	);

	const verify = (
		<div className="w-full max-w-md bg-card/95 rounded-xl shadow-2xl shadow-black/20 md:border md:border-border/50 md:backdrop-blur-sm p-6 pt-2 md:p-8 space-y-6">
			<div className="space-y-2 text-center">
				<div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent mb-4">
					<Mail className="w-6 h-6 text-accent-foreground" />
				</div>
				<h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Check your email</h1>
				<p className="text-sm text-muted-foreground max-w-sm mx-auto">
					We've sent a 6-digit verification code to <strong>{form.getValues('email')}</strong>
				</p>
			</div>

			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			<form
				onSubmit={(e) => {
					e.preventDefault();
					codeForm.handleSubmit(onVerify)(e);
				}}
				className="space-y-4">
				<div>
					<label className="text-foreground/80 block mb-1">Verification Code</label>
					<div className="relative">
						<Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
						<Input type="text" placeholder="Enter 6-digit code" {...codeForm.register('code')} className="w-full pl-10 h-10 bg-accent/50 border-border focus:border-primary/50 focus:ring-primary/20 rounded-md text-center tracking-[0.5em] font-mono" maxLength={6} />
					</div>
					<p className="text-destructive text-xs mt-1.5">{codeForm.formState.errors.code?.message}</p>
				</div>

				<button type="submit" className="w-full flex items-center gap-2 justify-center bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-md" disabled={isLoading}>
					{isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
					Verify Email
				</button>

				<div className="text-center">
					<p className="text-sm text-muted-foreground">
						Didn't receive the code?{' '}
						<button
							type="button"
							onClick={() => {
								// Implement resend logic here
							}}
							className="text-primary hover:underline">
							Resend
						</button>
					</p>
				</div>
			</form>
		</div>
	);

	return <div className="h-svh w-full flex items-center justify-center p-4 md:p-8">{step === 'register' ? register : verify}</div>;
}
