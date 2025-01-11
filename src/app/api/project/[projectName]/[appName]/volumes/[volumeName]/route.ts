import { NextRequest, NextResponse } from 'next/server';
import { checkAccreditation, getUser } from '@/lib/auth';
import { log } from '@/lib/log';
import { deleteVolume } from '@/lib/volume';

export async function DELETE(req: NextRequest, { params }: { params: { projectName: string; appName: string; volumeName: string } }) {
	try {
		const user = await getUser();

		if (!user || !(await checkAccreditation('volumes:2:delete', `${params.projectName}/${params.appName}`))) {
			log(`Unauthorized: Delete volume`, 'info', params.projectName, params.appName);
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
		}

		const volume = await deleteVolume(params.projectName, params.appName, params.volumeName);

		return NextResponse.json({ message: volume.message }, { status: volume.status });
	} catch (error) {
		console.error('Error creating project:', error);
		return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
	}
}
