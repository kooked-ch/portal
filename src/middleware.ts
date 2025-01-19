import { encode, getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
	try {
		const forwardedFor = req.headers.get('x-forwarded-for');
		const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : req.ip;

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

		const createResponseWithHeaders = (response: NextResponse) => {
			response.headers.set('x-forwarded-for', clientIp || '127.0.0.1');
			return response;
		};

		if (['factor', 'factor/skip', '/login', '/register'].includes(url.pathname)) {
			const response = NextResponse.next();
			return createResponseWithHeaders(response);
		}

		if (!token) {
			const response = NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(sanitizeRedirectUrl(url.pathname))}`, req.url));
			return createResponseWithHeaders(response);
		}

		if (!token.iat) {
			console.error('Invalid token');
			const response = NextResponse.redirect(new URL('/login', req.url));
			return createResponseWithHeaders(response);
		}

		if (token.twoFactorDisabled && url.pathname !== '/enable') {
			const response = NextResponse.next();
			return createResponseWithHeaders(response);
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

				return createResponseWithHeaders(response);
			}
		}

		if (!token.twoFactorComplete && url.pathname !== '/factor' && url.pathname !== '/enable') {
			const response = NextResponse.redirect(new URL(`/factor?callbackUrl=${encodeURIComponent(sanitizeRedirectUrl(url.pathname))}`, req.url));
			return createResponseWithHeaders(response);
		}

		const response = NextResponse.next();
		return createResponseWithHeaders(response);
	} catch (error) {
		console.error('Middleware error', { error });
		return NextResponse.redirect(new URL('/login', req.url));
	}
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|error|favicon.ico|image).*)'],
};
