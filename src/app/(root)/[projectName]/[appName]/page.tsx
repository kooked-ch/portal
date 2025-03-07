'use server';

import { AppDropdown } from '@/components/appDropdown';
import AppView from '@/components/AppView';
import { Button } from '@/components/ui/button';
import { getApp } from '@/lib/app';
import { AppType } from '@/types/app';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function AppPage({ params }: { params: { projectName: string; appName: string } }) {
	const app: AppType | null = await getApp(params.projectName, params.appName);

	if (!app) {
		return <div className="text-muted-foreground text-center justify-center flex items-center h-[calc(100vh-100px)]">App not found</div>;
	}

	return (
		<div className="xl:container mx-auto md:px-4 px-0 xl:px-28">
			<div className="flex justify-between py-4">
				<Button variant="link" className="text-muted-foreground" asChild>
					<Link href={'/' + params.projectName} className="gap-1 flex">
						<ArrowLeft size={24} />
						<span>Back</span>
					</Link>
				</Button>

				{(app.authorizations.apps?.length ?? 0) >= 2 && <AppDropdown app={app} />}
			</div>
			<AppView app={app} />
		</div>
	);
}
