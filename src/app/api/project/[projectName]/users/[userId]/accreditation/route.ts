import { NextRequest, NextResponse } from 'next/server';
import { checkAccreditation, getUser } from '@/lib/auth';
import { updateProjectAccreditation } from '@/lib/accreditation';

export async function POST(req: NextRequest, { params }: { params: { projectName: string; userId: string } }) {
	try {
		const user = await getUser();

		if (!user || !(await checkAccreditation('members:1:update', params.projectName))) {
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
		}

		const { accreditation } = await req.json();

		const update = await updateProjectAccreditation(params.projectName, params.userId, accreditation);

		return NextResponse.json({ message: update.message }, { status: update.status });
	} catch (error) {
		console.error('Error creating project:', error);
		return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
	}
}
