import { encode, getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
	try {
		const token = await getToken({
			req,
			secret: process.env.NEXTAUTH_SECRET,
		});

		const url = new URL(req.url);

		const sanitizeRedirectUrl = (path: string): string => {
			if (!path.startsWith('/')) {
				return '/';
			}

			const blockedPaths = ['/api', '/_next', '/admin'];
			if (blockedPaths.some((blocked) => path.startsWith(blocked))) {
				return '/';
			}

			return path.replace(/[^\w\-\/\?\&\=]/g, '');
		};

		if (!token) {
			return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(sanitizeRedirectUrl(url.pathname))}`, req.url));
		}

		if (!token.sub || !token.iat) {
			console.error('Invalid token', { userId: token.sub });
			return NextResponse.redirect(new URL('/login', req.url));
		}

		if (token.twoFactorDisabled && url.pathname !== '/enable') {
			return NextResponse.next();
		}

		if (token.twoFactorComplete && token.twoFactorExpiration) {
			if ((token.twoFactorExpiration as number) < Date.now()) {
				const updatedToken = {
					...token,
					twoFactorComplete: false,
					twoFactorExpiration: null,
				};

				const encodedToken = await encode({
					token: updatedToken,
					secret: process.env.NEXTAUTH_SECRET!,
				});

				const response = NextResponse.redirect(new URL('/', req.url));

				response.cookies.set({
					name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
					value: encodedToken,
					httpOnly: true,
					secure: process.env.NODE_ENV === 'production',
					sameSite: 'lax' as const,
					path: '/',
					maxAge: 60 * 60 * 24 * 7,
				});
				return response;
			}
		}

		if (!token.twoFactorComplete && url.pathname !== '/factor' && url.pathname !== '/enable') {
			return NextResponse.redirect(new URL(`/factor?callbackUrl=${encodeURIComponent(sanitizeRedirectUrl(url.pathname))}`, req.url));
		}

		return NextResponse.next();
	} catch (error) {
		console.error('Middleware error', { error });
		return NextResponse.redirect(new URL('/login', req.url));
	}
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|factor|login|register|error|media|favicon.ico|image).*)'],
};
