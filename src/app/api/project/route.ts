import { createProject } from '@/lib/project';
import { NextRequest, NextResponse } from 'next/server';
import { projectSchema } from '@/types/project';
import { checkAccreditation, getUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
	try {
		const user = await getUser();

		if (!user || !(await checkAccreditation('project:0:create'))) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { name, description } = await req.json();

		const validationResult = projectSchema.safeParse({ name, description });
		if (!validationResult.success) {
			return NextResponse.json({ error: 'Invalid request', details: validationResult.error.errors }, { status: 400 });
		}

		const project = await createProject(user.id, { name, description });

		return NextResponse.json({ message: project.message }, { status: project.status });
	} catch (error) {
		console.error('Error creating project:', error);
		return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
	}
}
