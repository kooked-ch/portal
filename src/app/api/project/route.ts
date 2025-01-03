import { createProject } from '@/lib/project';
import { NextRequest, NextResponse } from 'next/server';
import { projectSchema } from '@/types/project';
import { checkAccreditation, getUser } from '@/lib/auth';
import { checkResourcesPolicy } from '@/lib/resourcesPolicy';

export async function POST(req: NextRequest) {
	try {
		const user = await getUser();

		console.log('user:', user);

		if (!user || !(await checkAccreditation('projects:0:create'))) {
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
		}

		console.log('checkResourcesPolicy');

		if (!(await checkResourcesPolicy('projects'))) {
			return NextResponse.json({ message: 'Resource limit reached' }, { status: 400 });
		}

		const { name, description } = await req.json();

		const validationResult = projectSchema.safeParse({ name, description });
		if (!validationResult.success) {
			return NextResponse.json({ message: 'Invalid request', details: validationResult.error.errors }, { status: 400 });
		}

		const project = await createProject(user.id, { name, description });

		return NextResponse.json({ message: project.message }, { status: project.status });
	} catch (error) {
		console.error('Error creating project:', error);
		return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
	}
}
