import { NextRequest, NextResponse } from 'next/server';
import { checkAccreditation, getUser } from '@/lib/auth';
import { containerSchema } from '@/types/container';
import { createContainer } from '@/lib/container';
import { log } from '@/lib/log';
import { checkResourcesPolicy } from '@/lib/resourcesPolicy';
import { inviteCollaborator } from '@/lib/collaborator';

export async function POST(req: NextRequest, { params }: { params: { projectName: string; appName: string } }) {
	try {
		const user = await getUser();

		if (!user || !(await checkAccreditation('collaborators:2:invite', `${params.projectName}/${params.appName}`))) {
			log(`Unauthorized: Invite collaborator`, 'info', params.projectName, params.appName);
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
		}

		const { email, accreditation } = await req.json();

		if (!email || !accreditation) {
			return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
		}

		const invitation = await inviteCollaborator(params.projectName, params.appName, {
			email,
			accreditation,
		});

		return NextResponse.json({ message: invitation.message }, { status: invitation.status });
	} catch (error) {
		console.error('Error inviting collaborator:', error);
		return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
	}
}
