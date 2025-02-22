import { NextRequest, NextResponse } from 'next/server';
import { checkAccreditation, getUser } from '@/lib/auth';
import { deleteApp } from '@/lib/app';

export async function DELETE(req: NextRequest, { params }: { params: { projectName: string; appName: string } }) {
	try {
		const user = await getUser();

		if (!user || !(await checkAccreditation('apps:2:delete', `${params.projectName}/${params.appName}`))) {
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
		}

		const app = await deleteApp(params.projectName, params.appName);

		return NextResponse.json({ message: app.message }, { status: app.status });
	} catch (error) {
		console.error('Error deleting app:', error);
		return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
	}
}
