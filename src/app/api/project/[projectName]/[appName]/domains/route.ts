import { NextRequest, NextResponse } from 'next/server';
import { checkAccreditation, getUser } from '@/lib/auth';
import { createDomain, getDomains } from '@/lib/domain';
import { domainSchema } from '@/types/domain';
import { log } from '@/lib/log';
import { checkResourcesPolicy } from '@/lib/resourcesPolicy';

export async function GET(req: NextRequest, { params }: { params: { projectName: string; appName: string } }) {
	try {
		const user = await getUser();

		if (!user || !(await checkAccreditation('domains:2:read', `${params.projectName}/${params.appName}`))) {
			log('Unauthorized: Read domains', 'error', params.projectName, params.appName);
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
		}

		const domains = await getDomains({ projectName: params.projectName, appName: params.appName });

		return NextResponse.json(domains);
	} catch (error) {
		console.error('Error getting domains:', error);
		return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
	}
}

export async function POST(req: NextRequest, { params }: { params: { projectName: string; appName: string } }) {
	try {
		const user = await getUser();

		if (!user || !(await checkAccreditation('domains:2:create', `${params.projectName}/${params.appName}`))) {
			log('Unauthorized: Create domain', 'error', params.projectName, params.appName);
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
		}

		if (!(await checkResourcesPolicy(params.projectName, params.appName, 'domains'))) {
			return NextResponse.json({ message: 'Resource limit reached' }, { status: 400 });
		}

		const { url, port, container } = await req.json();

		const validationResult = domainSchema.safeParse({ url, port, container });
		if (!validationResult.success) {
			return NextResponse.json({ message: 'Invalid request', details: validationResult.error.errors }, { status: 400 });
		}

		const domain = await createDomain({ projectName: params.projectName, appName: params.appName, url, port, container });

		return NextResponse.json({ message: domain.message }, { status: domain.status });
	} catch (error) {
		console.error('Error creating domain:', error);
		return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
	}
}
