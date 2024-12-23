import { DomainType } from '@/types/domain';
import { customObjectsApi } from './api';
import { getMonitor } from './kuma';

export async function getDomains({ projectName, appName }: { projectName: string; appName: string }): Promise<DomainType[] | null> {
	try {
		const appData: any = await customObjectsApi.getNamespacedCustomObject('kooked.ch', 'v1', projectName, 'kookedapps', appName);

		if (!appData || !appData.body || !appData.body.spec || !appData.body.spec.domains) {
			return null;
		}

		const domains = await Promise.all(
			(appData.body?.spec?.domains || []).map(async (domain: { container: string; port: number; url: string }) => {
				const monitor = await getMonitor(domain.url);

				return {
					container: domain.container,
					port: domain.port,
					url: domain.url,
					monitor,
				};
			})
		);

		return domains || [];
	} catch (error) {
		console.error('Error getting domains:', error);
		return null;
	}
}
