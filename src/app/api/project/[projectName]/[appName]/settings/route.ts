import { NextRequest, NextResponse } from 'next/server';
import { checkAccreditation, getUser } from '@/lib/auth';
import { updateApp } from '@/lib/app';
import { updateAppSchema } from '@/types/app';

export async function PUT(req: NextRequest, { params }: { params: { projectName: string; appName: string } }) {
	try {
		const user = await getUser();

		if (!user || !(await checkAccreditation('apps:2:update', `${params.projectName}/${params.appName}`))) {
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
		}

		const { description, repository } = await req.json();

		const validationResult = updateAppSchema.safeParse({ description, repository });
		if (!validationResult.success) {
			return NextResponse.json({ message: 'Invalid request', details: validationResult.error.errors }, { status: 400 });
		}

		const project = await updateApp(params.projectName, params.appName, { description, repository });

		return NextResponse.json({ message: project.message }, { status: project.status });
	} catch (error) {
		console.error('Error creating project:', error);
		return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
	}
}
