'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Mail, Lock, Github, Sparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription } from './ui/alert';

const formSchema = z.object({
	email: z.string().email('Invalid email address'),
	password: z.string().min(8, 'Password must be at least 8 characters'),
});

export default function LoginComponent() {
	const [isLoading, setIsLoading] = useState(false);
	const searchParams = useSearchParams();
	const error = searchParams.get('error');

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: '',
			password: '',
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		setIsLoading(true);
		await signIn('credentials', {
			email: values.email,
			password: values.password,
			callbackUrl: searchParams.get('callbackUrl') || '/',
		});
	}

	return (
		<div className="h-svh w-full flex items-center justify-center p-4 md:p-8">
			<div className={cn('w-full max-w-md bg-card/95 rounded-xl shadow-2xl shadow-black/20', 'md:border md:border-border/50 md:backdrop-blur-sm', 'p-6 pt-2 md:p-8 space-y-6')}>
				<div className="space-y-2 text-center">
					<div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent mb-4">
						<Sparkles className="w-6 h-6 text-accent-foreground" />
					</div>
					<h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
					<p className="text-sm text-muted-foreground max-w-sm mx-auto">Enter your credentials to access your account</p>
				</div>

				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error === 'CredentialsSignin' ? 'Invalid username or password' : error}</AlertDescription>
					</Alert>
				)}

				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

					<div className="flex items-center justify-between text-sm">
						<button type="button" className="text-primary hover:no-underline px-0">
							<a href="/forgot-password">Forgot password?</a>
						</button>
					</div>

					<button type="submit" className="w-full flex items-center gap-2 justify-center bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-md" disabled={isLoading}>
						{isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
						Sign In
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
						Don&apos;t have an account?{' '}
						<a href={'/register' + (searchParams.get('callbackUrl') ? '?callbackUrl=' + searchParams.get('callbackUrl') : '')} className="text-primary hover:underline">
							Sign up
						</a>
					</p>
				</div>
			</div>
		</div>
	);
}
