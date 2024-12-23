import { NextRequest, NextResponse } from 'next/server';
import { checkAccreditation, getUser } from '@/lib/auth';
import { getDomains } from '@/lib/domain';

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
