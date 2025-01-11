import { ErrorType } from '@/types/error';
import { VolumeType } from '@/types/volume';
import { customObjectsApi } from './api';
import { log } from './log';

export async function createVolume(projectName: string, appName: string, data: VolumeType): Promise<ErrorType> {
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
		const container = containers.find((container: any) => container.name === data.container);

		if (!container) {
			return { message: 'Container not found', status: 404 };
		}

		const volumes = containers.flatMap((container: any) => container.volumes || []);
		const existingVolume = volumes.find((volume: any) => volume.name === data.name);

		if (existingVolume) {
			return { message: 'Volume already exists', status: 400 };
		}

		const patch = [
			{
				op: 'replace',
				path: `/spec/containers/${containers.indexOf(container)}/volumes`,
				value: [
					...volumes,
					{
						name: data.name,
						mountPath: data.mountPath,
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

		log(`Created volume ${data.name} mounted at ${data.mountPath}`, 'info', projectName, appName);

		return {
			message: 'Volume created',
			status: 201,
		};
	} catch (error: unknown) {
		console.error('Error creating database:', error);
		return { message: 'An unexpected error occurred', status: 500 };
	}
}
