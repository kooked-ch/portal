import { NextRequest, NextResponse } from 'next/server';
import { checkAccreditation, getUser } from '@/lib/auth';
import { containerSchema } from '@/types/container';
import { createContainer } from '@/lib/container';

export async function POST(req: NextRequest, { params }: { params: { projectName: string; appName: string } }) {
	try {
		const user = await getUser();

		if (!user || !(await checkAccreditation('containers:2:create'), params.projectName)) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { name, image, version } = await req.json();

		const validationResult = containerSchema.safeParse({ name, image, version });
		if (!validationResult.success) {
			return NextResponse.json({ error: 'Invalid request', details: validationResult.error.errors }, { status: 400 });
		}

		const app = await createContainer({ projectName: params.projectName, appName: params.appName, name, image, version });

		return NextResponse.json({ error: app.message }, { status: app.status });
	} catch (error) {
		console.error('Error creating project:', error);
		return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
	}
}
