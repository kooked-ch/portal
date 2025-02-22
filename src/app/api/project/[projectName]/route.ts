import { NextRequest, NextResponse } from 'next/server';
import { checkAccreditation, getUser } from '@/lib/auth';
import { deleteProject } from '@/lib/project';

export async function DELETE(req: NextRequest, { params }: { params: { projectName: string } }) {
	try {
		const user = await getUser();

		if (!user || !(await checkAccreditation('projects:1:delete', params.projectName))) {
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
		}

		const project = await deleteProject(params.projectName);

		return NextResponse.json({ message: project.message }, { status: project.status });
	} catch (error) {
		console.error('Error creating project:', error);
		return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
	}
}
