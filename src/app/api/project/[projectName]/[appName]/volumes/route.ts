import { NextRequest, NextResponse } from 'next/server';
import { checkAccreditation, getUser } from '@/lib/auth';
import { log } from '@/lib/log';
import { volumeSchema } from '@/types/volume';
import { createVolume } from '@/lib/volume';
import { checkResourcesPolicy } from '@/lib/resourcesPolicy';

export async function POST(req: NextRequest, { params }: { params: { projectName: string; appName: string } }) {
	try {
		const user = await getUser();

		if (!user || !(await checkAccreditation('volumes:2:create', `${params.projectName}/${params.appName}`))) {
			log(`Unauthorized: Create volume`, 'info', params.projectName, params.appName);
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
		}

		if (!(await checkResourcesPolicy('volumes', params.projectName, params.appName))) {
			return NextResponse.json({ message: 'Resource limit reached' }, { status: 400 });
		}

		const { name, mountPath, container, size } = await req.json();

		console.log('Creating volume:', { name, mountPath, container, size });

		const validationResult = volumeSchema.safeParse({ name, mountPath, container, size });
		if (!validationResult.success) {
			return NextResponse.json({ message: 'Invalid request', details: validationResult.error.errors }, { status: 400 });
		}

		const volume = await createVolume(params.projectName, params.appName, { name, mountPath, container, size });

		return NextResponse.json({ message: volume.message }, { status: volume.status });
	} catch (error) {
		console.error('Error creating volume:', error);
		return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
	}
}
