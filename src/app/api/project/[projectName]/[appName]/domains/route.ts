import { NextRequest, NextResponse } from 'next/server';
import { checkAccreditation, getUser } from '@/lib/auth';
import { createDomain, getDomains } from '@/lib/domain';
import { domainSchema } from '@/types/domain';

export async function GET(req: NextRequest, { params }: { params: { projectName: string; appName: string } }) {
	try {
		const user = await getUser();

		if (!user || !(await checkAccreditation('domains:2:read', `${params.projectName}/${params.appName}`))) {
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
		}

		const domains = await getDomains({ projectName: params.projectName, appName: params.appName });

		return NextResponse.json(domains);
	} catch (error) {
		console.error('Error creating project:', error);
		return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
	}
}

export async function POST(req: NextRequest, { params }: { params: { projectName: string; appName: string } }) {
	try {
		const user = await getUser();

		if (!user || !(await checkAccreditation('domains:2:create', `${params.projectName}/${params.appName}`))) {
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
		}

		const { url, port, container } = await req.json();

		const validationResult = domainSchema.safeParse({ url, port, container });
		if (!validationResult.success) {
			return NextResponse.json({ message: 'Invalid request', details: validationResult.error.errors }, { status: 400 });
		}

		const domain = await createDomain({ projectName: params.projectName, appName: params.appName, url, port, container });

		return NextResponse.json({ message: domain.message }, { status: domain.status });
	} catch (error) {
		console.error('Error creating project:', error);
		return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
	}
}
