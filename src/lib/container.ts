import { customObjectsApi } from './api';
import { ErrorType } from '@/types/error';

export async function createContainer({ projectName, appName, name, image, version }: { projectName: string; appName: string; name: string; image: string; version: string }): Promise<ErrorType> {
	try {
		console.table({ projectName, appName, name, image, version });

		const app: any = await customObjectsApi.getNamespacedCustomObject('kooked.ch', 'v1', projectName, 'kookedapps', appName);

		if (!app || !app.body || !app.body.spec) {
			return {
				message: 'App not found',
				status: 404,
			};
		}

		const existingContainer = app.body.spec.containers.find((container: any) => container.name === name);

		if (existingContainer) {
			return { message: 'Container already exists', status: 400 };
		}

		const patch = [
			{
				op: 'replace',
				path: '/spec/containers',
				value: [
					...app.body.spec.containers,
					{
						name,
						image: `${image}:${version}`,
					},
				],
			},
		];

		const options = { headers: { 'Content-type': 'application/json-patch+json' } };

		await customObjectsApi.patchNamespacedCustomObject('kooked.ch', 'v1', projectName, 'kookedapps', appName, patch, undefined, undefined, undefined, options);

		return {
			message: 'Container created',
			status: 201,
		};
	} catch (error: unknown) {
		console.error('Error creating container:', error);
		return { message: 'An unexpected error occurred', status: 500 };
	}
}
