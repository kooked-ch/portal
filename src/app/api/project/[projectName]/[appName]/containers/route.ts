import { NextRequest, NextResponse } from 'next/server';
import { checkAccreditation, getUser } from '@/lib/auth';
import { containerSchema } from '@/types/container';
import { createContainer } from '@/lib/container';

export async function POST(req: NextRequest, { params }: { params: { projectName: string; appName: string } }) {
	try {
		const user = await getUser();

		if (!user || !(await checkAccreditation('containers:2:create', `${params.projectName}/${params.appName}`))) {
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
		}

		const { name, image, version, env } = await req.json();

		if (env && Array.isArray(env) && (env.filter((e) => e.name.trim() === '' && e.value.trim() !== '').length > 0 || env.filter((e) => e.name.trim() !== '' && e.value.trim() === '').length > 0)) {
			return NextResponse.json({ message: 'Environment variables must have both a name and a value' }, { status: 400 });
		}

		const validationResult = containerSchema.safeParse({ name, image, version });
		if (!validationResult.success) {
			return NextResponse.json({ message: 'Invalid request', details: validationResult.error.errors }, { status: 400 });
		}

		const container = await createContainer({ projectName: params.projectName, appName: params.appName, name, image, version, env });

		return NextResponse.json({ message: container.message }, { status: container.status });
	} catch (error) {
		console.error('Error creating project:', error);
		return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
	}
}
