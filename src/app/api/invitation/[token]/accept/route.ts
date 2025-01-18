import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { acceptAppInvitation } from '@/lib/collaborator';

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
	try {
		const user = await getUser();

		if (!user) {
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
		}

		const accept = await acceptAppInvitation(params.token, user.id);

		return NextResponse.json({ message: accept.message }, { status: accept.status });
	} catch (error) {
		console.error('Error joining app:', error);
		return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
	}
}
