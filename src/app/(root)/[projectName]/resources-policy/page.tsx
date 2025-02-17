'use server';
import ResourcesPolicyEditor from '@/components/resourcesPolicy';
import { checkAccreditation } from '@/lib/auth';
import { getAllProjectResourcesPolicy } from '@/lib/resourcesPolicy';
import { redirect } from 'next/navigation';

export default async function ResourcesPolicyPage({ params }: { params: { projectName: string } }) {
	if (!(await checkAccreditation('resourcesPolicy:0:read'))) {
		return <div className="text-muted-foreground text-center justify-center flex items-center h-[calc(100vh-100px)]">Unable to access this page</div>;
	}

	const allProjectResourcesPolicy = await getAllProjectResourcesPolicy(params.projectName);

	if (!allProjectResourcesPolicy) {
		return <div className="text-muted-foreground text-center justify-center flex items-center h-[calc(100vh-100px)]">Failed to load resource policy</div>;
	}

	return (
		<div className="xl:container mx-auto px-3 xl:px-28 md:py-8 py-3">
			<ResourcesPolicyEditor allProjectResourcesPolicy={allProjectResourcesPolicy} />
		</div>
	);
}
