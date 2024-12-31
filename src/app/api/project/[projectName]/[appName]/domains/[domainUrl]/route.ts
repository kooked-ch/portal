import { NextRequest, NextResponse } from 'next/server';
import { checkAccreditation, getUser } from '@/lib/auth';
import { log } from '@/lib/log';
import { deleteDomain, updateDomain } from '@/lib/domain';

export async function DELETE(req: NextRequest, { params }: { params: { projectName: string; appName: string; domainUrl: string } }) {
	try {
		const user = await getUser();

		if (!user || !(await checkAccreditation('domains:2:delete', `${params.projectName}/${params.appName}`))) {
			log(`Unauthorized: Delete domain`, 'info', params.projectName, params.appName);
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
		}

		const container = await deleteDomain({ projectName: params.projectName, appName: params.appName, url: params.domainUrl });

		return NextResponse.json({ message: container.message }, { status: container.status });
	} catch (error) {
		console.error('Error creating project:', error);
		return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
	}
}

export async function PUT(req: NextRequest, { params }: { params: { projectName: string; appName: string; domainUrl: string } }) {
	try {
		const user = await getUser();

		if (!user || !(await checkAccreditation('domains:2:update', `${params.projectName}/${params.appName}`))) {
			log(`Unauthorized: Update domain`, 'info', params.projectName, params.appName);
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
		}

		const { container, port } = await req.json();

		const domain = await updateDomain(params.projectName, params.appName, { url: params.domainUrl, container, port });

		return NextResponse.json({ message: domain.message }, { status: domain.status });
	} catch (error) {
		console.error('Error creating project:', error);
		return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
	}
}
