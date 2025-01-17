import { customObjectsApi } from './api';
import { ErrorType } from '@/types/error';
import { checkAccreditation } from './auth';
import { log } from './log';
import { DomainType } from '@/types/domain';

export async function createContainer({ projectName, appName, name, image, version, env }: { projectName: string; appName: string; name: string; image: string; version: string; env: { name: string; value: string }[] }): Promise<ErrorType> {
	try {
		const app: any = await customObjectsApi.getNamespacedCustomObject({
			group: 'kooked.ch',
			version: 'v1',
			namespace: projectName,
			plural: 'kookedapps',
			name: appName,
		});

		if (!app) {
			return {
				message: 'App not found',
				status: 404,
			};
		}

		const containers = app?.spec?.containers || [];
		const existingContainer = containers.find((container: any) => container.name === name);

		if (existingContainer) {
			return { message: 'Container already exists', status: 400 };
		}

		const patch = [
			{
				op: containers.length > 0 ? 'replace' : 'add',
				path: '/spec/containers',
				value: [
					...containers,
					{
						name,
						image: `${image}:${version}`,
						env: env.some((envVar) => envVar.name.trim() === '') ? undefined : env,
					},
				],
			},
		];

		await customObjectsApi.patchNamespacedCustomObject({
			group: 'kooked.ch',
			version: 'v1',
			namespace: projectName,
			plural: 'kookedapps',
			name: appName,
			body: patch,
		});
		await log(`Created ${name} container`, 'info', projectName, appName);

		return {
			message: 'Container created',
			status: 201,
		};
	} catch (error: unknown) {
		console.error('Error creating container:', error);
		return { message: 'An unexpected error occurred', status: 500 };
	}
}

export async function updateContainer({ projectName, appName, containerName, data }: { projectName: string; appName: string; containerName: string; data: { name: string; image: string; version: string; env: { name: string; value: string }[] } }): Promise<ErrorType> {
	try {
		const app: any = await customObjectsApi.getNamespacedCustomObject({ group: 'kooked.ch', version: 'v1', namespace: projectName, plural: 'kookedapps', name: appName });

		if (!app) {
			return {
				message: 'App not found',
				status: 404,
			};
		}

		const containerIndex = app.spec.containers.findIndex((container: any) => container.name === containerName);
		if (containerIndex === -1) {
			return { message: 'Container not found', status: 404 };
		}

		const container = app.spec.containers[containerIndex];
		const canUpdateEnv = await checkAccreditation('secrets:2:update', `${projectName}/${appName}`);

		const patch = [
			{
				op: 'replace',
				path: `/spec/containers/${containerIndex}`,
				value: {
					name: data.name,
					image: `${data.image}:${data.version}`,
					env: canUpdateEnv ? (data.env.some((envVar) => envVar.name.trim() === '') ? undefined : data.env) : container.env,
					volumes: container?.volumes,
				},
			},
		];

		if (app.spec.domains && Array.isArray(app.spec.domains) && app.spec.domains.length > 0) {
			patch.push({
				op: 'replace',
				path: '/spec/domains',
				value: app.spec.domains.map((domain: DomainType) => ({
					...domain,
					container: domain.container === containerName ? data.name : domain.container,
				})),
			});
		}

		await customObjectsApi.patchNamespacedCustomObject({ group: 'kooked.ch', version: 'v1', namespace: projectName, plural: 'kookedapps', name: appName, body: patch });
		await log(`Updated ${containerName} container`, 'info', projectName, appName);

		return {
			message: 'Container updated',
			status: 200,
		};
	} catch (error: unknown) {
		console.error('Error updating container:', error);
		return { message: 'An unexpected error occurred', status: 500 };
	}
}

export async function deleteContainer({ projectName, appName, containerName }: { projectName: string; appName: string; containerName: string }): Promise<ErrorType> {
	try {
		const app: any = await customObjectsApi.getNamespacedCustomObject({ group: 'kooked.ch', version: 'v1', namespace: projectName, plural: 'kookedapps', name: appName });

		if (!app) {
			return {
				message: 'App not found',
				status: 404,
			};
		}

		const containerIndex = app.spec.containers.findIndex((container: any) => container.name === containerName);

		if (containerIndex === -1) {
			return { message: 'Container not found', status: 404 };
		}

		const patch = [
			{
				op: 'remove',
				path: `/spec/containers/${containerIndex}`,
			},
		];

		await customObjectsApi.patchNamespacedCustomObject({ group: 'kooked.ch', version: 'v1', namespace: projectName, plural: 'kookedapps', name: appName, body: patch });
		await log(`Deleted ${containerName} container`, 'info', projectName, appName);

		return {
			message: 'Container deleted',
			status: 200,
		};
	} catch (error: unknown) {
		console.error('Error deleting container:', error);
		return { message: 'An unexpected error occurred', status: 500 };
	}
}
