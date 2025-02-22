import { NextRequest, NextResponse } from 'next/server';
import { checkAccreditation, getUser } from '@/lib/auth';
import { updateProject } from '@/lib/project';
import { projectSchema } from '@/types/project';

export async function PUT(req: NextRequest, { params }: { params: { projectName: string } }) {
	try {
		const user = await getUser();

		if (!user || !(await checkAccreditation('projects:1:update', params.projectName))) {
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
		}

		const { name, description } = await req.json();

		const validationResult = projectSchema.safeParse({ name, description });
		if (!validationResult.success) {
			return NextResponse.json({ message: 'Invalid request', details: validationResult.error.errors }, { status: 400 });
		}

		const project = await updateProject(params.projectName, { name, description });

		return NextResponse.json({ message: project.message }, { status: project.status });
	} catch (error) {
		console.error('Error creating project:', error);
		return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
	}
}
