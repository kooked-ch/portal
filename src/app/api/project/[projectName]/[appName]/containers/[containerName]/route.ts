import { NextRequest, NextResponse } from 'next/server';
import { checkAccreditation, getUser } from '@/lib/auth';
import { deleteContainer, updateContainer } from '@/lib/container';
import { containerSchema } from '@/types/container';

export async function PUT(req: NextRequest, { params }: { params: { projectName: string; appName: string; containerName: string } }) {
	try {
		const user = await getUser();

		if (!user || !(await checkAccreditation('containers:2:update', `${params.projectName}/${params.appName}`))) {
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

		const container = await updateContainer({ projectName: params.projectName, appName: params.appName, containerName: params.containerName, data: { name, image, version, env } });

		return NextResponse.json({ message: container.message }, { status: container.status });
	} catch (error) {
		console.error('Error creating project:', error);
		return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest, { params }: { params: { projectName: string; appName: string; containerName: string } }) {
	try {
		const user = await getUser();

		if (!user || !(await checkAccreditation('containers:2:delete', `${params.projectName}/${params.appName}`))) {
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
		}

		const container = await deleteContainer({ projectName: params.projectName, appName: params.appName, containerName: params.containerName });

		return NextResponse.json({ message: container.message }, { status: container.status });
	} catch (error) {
		console.error('Error creating project:', error);
		return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
	}
}
