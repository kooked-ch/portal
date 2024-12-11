import { AppType } from '@/types/app';
import { customObjectsApi } from './api';
import { checkAccreditation } from './auth';
import { getRepository } from './utils';

export async function getApp(projectName: string, appname: string): Promise<AppType | null> {
	const hasAccess = await checkAccreditation('apps:2:read', `${projectName}/${appname}`);

	if (!hasAccess) {
		return null;
	}

	try {
		const app: any = await customObjectsApi.getNamespacedCustomObject('kooked.ch', 'v1', projectName, 'kookedapps', appname);
		return {
			name: app.body.metadata.name,
			description: app.body.metadata.annotations?.description,
			createdAt: app.body.metadata.creationTimestamp,
			repository: await getRepository(app.body.metadata.annotations?.repository),
			replicas: app.body.spec.replicas,
			domains: app.body.spec.domains,
			databases: app.body.spec.databases,
			containers: app.body.spec.containers,
		};
	} catch (error) {
		console.error('Error fetching app:', error);
		return null;
	}
}
