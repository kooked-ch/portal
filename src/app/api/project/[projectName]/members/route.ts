import { NextRequest, NextResponse } from 'next/server';
import { checkAccreditation, getUser } from '@/lib/auth';
import { inviteMember } from '@/lib/member';

export async function POST(req: NextRequest, { params }: { params: { projectName: string; appName: string } }) {
	try {
		const user = await getUser();

		if (!user || !(await checkAccreditation('members:1:invite', params.projectName))) {
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
		}

		const { email, accreditation } = await req.json();

		if (!email || !accreditation) {
			return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
		}

		const invitation = await inviteMember(params.projectName, {
			email,
			accreditation,
		});

		return NextResponse.json({ message: invitation.message }, { status: invitation.status });
	} catch (error) {
		console.error('Error inviting collaborator:', error);
		return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
	}
}
