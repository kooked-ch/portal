import { NextRequest, NextResponse } from 'next/server';
import { checkAccreditation, getUser } from '@/lib/auth';
import { updateResourcesPolicy } from '@/lib/resourcesPolicy';

export async function POST(req: NextRequest, { params }: { params: { projectName: string; appName: string } }) {
	try {
		const user = await getUser();

		if (!user || !(await checkAccreditation('resourcesPolicy:0:update'))) {
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
		}

		const { policy, resource } = await req.json();

		const update = await updateResourcesPolicy(params.projectName, params.appName, policy, resource);

		return NextResponse.json({ message: update.message }, { status: update.status });
	} catch (error) {
		console.error('Error updating resources policy:', error);
		return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
	}
}
