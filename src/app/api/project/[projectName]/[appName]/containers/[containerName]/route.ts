import { NextRequest, NextResponse } from 'next/server';
import { checkAccreditation, getUser } from '@/lib/auth';
import { deleteContainer } from '@/lib/container';

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
