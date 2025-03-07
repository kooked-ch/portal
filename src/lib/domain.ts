import { DomainType } from '@/types/domain';
import { customObjectsApi } from './api';
import { createMonitor, deleteMonitor, getMonitor } from './kuma';
import { ErrorType } from '@/types/error';
import fs from 'fs';
import path from 'path';
import { log } from './log';

export async function getDomains({ projectName, appName }: { projectName: string; appName: string }): Promise<DomainType[] | null> {
	try {
		const appData: any = await customObjectsApi.getNamespacedCustomObject({ group: 'kooked.ch', version: 'v1', namespace: projectName, plural: 'kookedapps', name: appName });

		if (!appData || !appData.spec.domains) {
			return null;
		}

		const domains = await Promise.all(
			(appData.spec.domains || []).map(async (domain: { container: string; port: number; url: string }) => {
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

export async function createDomain({ projectName, appName, url, port, container }: { projectName: string; appName: string; url: string; port: number; container: string }): Promise<ErrorType> {
	try {
		const app: any = await customObjectsApi.getNamespacedCustomObject({ group: 'kooked.ch', version: 'v1', namespace: projectName, plural: 'kookedapps', name: appName });

		if (!app) {
			return {
				message: 'App not found',
				status: 404,
			};
		}

		if (!app.spec.containers.find((c: any) => c.name === container)) {
			return {
				message: 'Container not found',
				status: 404,
			};
		}

		const appDomains = app.spec.domains || [];
		if (!Array.isArray(appDomains)) {
			return {
				message: 'Domains field is not an array',
				status: 500,
			};
		}

		const apps: any = await customObjectsApi.listClusterCustomObject({ group: 'kooked.ch', version: 'v1', plural: 'kookedapps' });
		const allDomains = apps.items.flatMap((app: any) => app?.spec?.domains || []);

		if (allDomains.some((domain: any) => domain?.url === url)) {
			return {
				message: `Domain ${url} already exists`,
				status: 400,
			};
		}

		const badWordsDir = path.resolve('./bad-words');
		const badWordsFiles = fs.readdirSync(badWordsDir);

		for (const file of badWordsFiles) {
			const filePath = path.join(badWordsDir, file);
			const words = fs
				.readFileSync(filePath, 'utf-8')
				.split('\n')
				.map((w) => w.trim().toLowerCase());

			for (const word of words) {
				const regex = new RegExp(`(^|\\.)${word}(\\.|$)`, 'i');
				if (regex.test(url)) {
					return {
						message: 'Domain not allowed due to restricted words',
						status: 400,
					};
				}
			}
		}

		const patch = [
			{
				op: appDomains.length > 0 ? 'replace' : 'add',
				path: '/spec/domains',
				value: [
					...appDomains,
					{
						container,
						port,
						url,
					},
				],
			},
		];

		const options = { headers: { 'Content-type': 'application/json-patch+json' } };

		const monitor = await createMonitor(url);

		if (monitor.status !== 201) {
			return monitor;
		}

		await customObjectsApi.patchNamespacedCustomObject({ group: 'kooked.ch', version: 'v1', namespace: projectName, plural: 'kookedapps', name: appName, body: patch });

		log(`Created ${url} domain for ${container} container`, 'info', projectName, appName);

		return {
			message: 'Domain created',
			status: 201,
		};
	} catch (error: unknown) {
		console.error('Error creating domain:', error);
		return { message: 'An unexpected error occurred', status: 500 };
	}
}

export async function updateDomain(projectName: string, appName: string, { url, container, port }: { url: string; container: string; port: number }): Promise<ErrorType> {
	try {
		const app: any = await customObjectsApi.getNamespacedCustomObject({ group: 'kooked.ch', version: 'v1', namespace: projectName, plural: 'kookedapps', name: appName });

		if (!app) {
			return {
				message: 'App not found',
				status: 404,
			};
		}

		const appDomains = app.spec.domains || [];
		if (!Array.isArray(appDomains)) {
			return {
				message: 'Domains field is not an array',
				status: 500,
			};
		}

		const domainIndex = appDomains.findIndex((d: any) => d.url === url);
		if (domainIndex === -1) {
			return {
				message: 'Domain not found',
				status: 404,
			};
		}

		const patch = [
			{
				op: 'replace',
				path: `/spec/domains/${domainIndex}`,
				value: {
					container,
					port,
					url,
				},
			},
		];

		await customObjectsApi.patchNamespacedCustomObject({ group: 'kooked.ch', version: 'v1', namespace: projectName, plural: 'kookedapps', name: appName, body: patch });

		log(`Updated ${url} domain for ${container} container`, 'info', projectName, appName);

		return {
			message: 'Domain updated',
			status: 200,
		};
	} catch (error: unknown) {
		console.error('Error updating domain:', error);
		return { message: 'An unexpected error occurred', status: 500 };
	}
}

export async function deleteDomain({ projectName, appName, url }: { projectName: string; appName: string; url: string }): Promise<ErrorType> {
	try {
		const app: any = await customObjectsApi.getNamespacedCustomObject({ group: 'kooked.ch', version: 'v1', namespace: projectName, plural: 'kookedapps', name: appName });

		const appDomains = app.spec.domains || [];
		if (!Array.isArray(appDomains)) {
			return {
				message: 'Domains field is not an array',
				status: 500,
			};
		}

		const domainIndex = appDomains.findIndex((d: any) => d.url === url);
		if (domainIndex === -1) {
			return {
				message: 'Domain not found',
				status: 404,
			};
		}

		const patch = [
			{
				op: appDomains.length > 0 ? 'replace' : 'add',
				path: '/spec/domains',
				value: appDomains.filter((d: any) => d.url !== url),
			},
		];

		const options = { headers: { 'Content-type': 'application/json-patch+json' } };

		const monitor = await deleteMonitor(url);
		if (monitor.status !== 200) return monitor;

		await customObjectsApi.patchNamespacedCustomObject({ group: 'kooked.ch', version: 'v1', namespace: projectName, plural: 'kookedapps', name: appName, body: patch });

		log(`Deleted ${url} domain`, 'info', projectName, appName);

		return {
			message: 'Domain deleted',
			status: 200,
		};
	} catch (error: unknown) {
		console.error('Error deleting domain:', error);
		return { message: 'An unexpected error occurred', status: 500 };
	}
}
