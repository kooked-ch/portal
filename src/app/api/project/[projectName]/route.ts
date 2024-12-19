import { NextRequest, NextResponse } from 'next/server';
import { checkAccreditation, getUser } from '@/lib/auth';
import { appSchema } from '@/types/app';
import { createApp } from '@/lib/app';

export async function POST(req: NextRequest, { params }: { params: { projectName: string } }) {
	try {
		const user = await getUser();

		if (!user || !(await checkAccreditation('apps:2:create', params.projectName))) {
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
		}

		const { name, description, repository } = await req.json();

		const validationResult = appSchema.safeParse({ name, description, repository });
		if (!validationResult.success) {
			return NextResponse.json({ message: 'Invalid request', details: validationResult.error.errors }, { status: 400 });
		}

		const app = await createApp(user.id, { name, description, repository, projectName: params.projectName });

		return NextResponse.json({ message: app.message }, { status: app.status });
	} catch (error) {
		console.error('Error creating project:', error);
		return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
	}
}
