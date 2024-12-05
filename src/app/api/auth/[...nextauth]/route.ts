import type { NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

interface RouteHandlerContext {
	params: { nextauth: string[] };
}

async function auth(req: NextRequest, context: RouteHandlerContext) {
	return await NextAuth(req, context, authOptions);
}

export { auth as GET, auth as POST };
