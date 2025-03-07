import { AppType } from '@/types/app';
import { appsApi, coreV1Api, customObjectsApi } from './api';
import { checkAccreditation } from './auth';
import { ErrorType } from '@/types/error';
import { AppModel, IApp } from '@/models/App';
import { IProject, ProjectModel } from '@/models/Project';
import { AccreditationModel, IAccreditation } from '@/models/Accreditation';
import { IUser } from '@/models/User';
import { getLogs, log } from './log';
import { ResourcesPolicyModel } from '@/models/ResourcesPolicy';
import { getAppResourcesPolicy } from './resourcesPolicy';
import { getAppAuthorization } from './authorization';
import { getAccreditations } from './accreditation';
import { deleteMonitor } from './kuma';

export async function getApp(projectName: string, appName: string): Promise<AppType | null> {
	const hasAccess = await checkAccreditation('apps:2:read', `${projectName}/${appName}`);
	if (!hasAccess) return null;

	const hasSecretsAccess = await checkAccreditation('secrets:2:read', `${projectName}/${appName}`);
	const hasCollaboratorsAccess = await checkAccreditation('collaborators:2:read', `${projectName}/${appName}`);

	const app = await AppModel.findOne<IApp>({ name: appName })
		.populate<{ collaborators: Array<{ userId: IUser; accreditation: IAccreditation }> }>({
			path: 'collaborators.userId collaborators.accreditation',
			select: 'username image id name description slug authorizations',
		})
		.exec();

	if (!app) return null;

	try {
		const [podsResponse, appData]: [any, any] = await Promise.all([coreV1Api.listNamespacedPod({ namespace: projectName, labelSelector: `app=${appName}` }), customObjectsApi.getNamespacedCustomObject({ group: 'kooked.ch', version: 'v1', namespace: projectName, plural: 'kookedapps', name: appName })]);

		let deploymentData: any = {};
		try {
			deploymentData = await appsApi.readNamespacedDeployment({ name: appName, namespace: projectName });
		} catch (error: any) {
			deploymentData = {
				body: {
					spec: { replicas: 0 },
					status: {
						availableReplicas: 0,
						readyReplicas: 0,
						updatedReplicas: 0,
					},
				},
			};
		}

		const domainStatuses = await Promise.all(
			(appData.spec?.domains || []).map(async (domain: any) => {
				try {
					const response = await fetch(`https://${domain.url}`, { method: 'GET' });
					return { ...domain, status: response.ok };
				} catch (error) {
					console.warn(`Domain check failed for ${domain.url}`);
					return { ...domain, status: 'down' };
				}
			})
		);

		const databaseStatuses = await Promise.all(
			(appData.spec?.databases || []).map(async (db: any) => {
				try {
					const statefulSet = await appsApi.readNamespacedStatefulSet({ name: `${appName}-${db.provider}`, namespace: projectName });
					const databasePod = podsResponse.items.find((pod: any) => pod.metadata?.labels?.type === db.provider);

					return {
						name: db.name,
						provider: db.provider,
						...(hasSecretsAccess && {
							username: db.user,
							password: db.password,
						}),
						status: {
							state: databasePod?.status?.phase || 'Unknown',
							replicas: {
								desired: statefulSet.spec?.replicas || 0,
								current: statefulSet.status?.currentReplicas || 0,
								ready: statefulSet.status?.readyReplicas || 0,
							},
						},
					};
				} catch (error) {
					console.error(`Error fetching StatefulSet for database ${db.name}:`, error);
					return {
						name: db.name,
						provider: db.provider,
						status: null,
					};
				}
			})
		);

		const containers = await Promise.all(
			(appData.spec?.containers || []).map(async (container: any) => {
				const status = podsResponse.items
					.filter((pod: any) => pod.metadata?.labels?.type === 'container' && !pod.metadata?.deletionTimestamp)
					.flatMap((pod: any) =>
						(pod.status?.containerStatuses || [])
							.filter((containerStatus: any) => containerStatus.name === container.name)
							.map((status: any) => {
								const state = status?.state?.waiting?.reason || status?.state?.terminated?.reason || (pod.status?.phase === 'Running' ? 'Running' : 'Unknown');

								if (!state || (pod.status?.phase === 'Pending' && !status.state?.waiting)) {
									return null;
								}

								return {
									podName: pod.metadata?.name,
									ready: status.ready || false,
									state,
									stateDetails: JSON.parse(JSON.stringify(status.state)),
									restartCount: status.restartCount || 0,
									message: status?.state?.waiting?.message || '',
								};
							})
					)
					.filter((status: any) => status !== null)
					.filter((status: any, index: number, self: any[]) => {
						if (status.state === 'Running' && status.ready) return true;
						if (status.state === 'ContainerCreating') {
							const availableReplicas = deploymentData.status?.availableReplicas || 0;
							const nonCreatingCount = self.filter((s: any) => s.state !== 'ContainerCreating').length;
							return nonCreatingCount === availableReplicas;
						}
						return true;
					});

				const logs = await Promise.all(
					status.map(async (status: any, index: number) => {
						try {
							if (podsResponse.items.find((pod: any) => pod.metadata?.name === status.podName)?.status?.phase === 'Pending') return { podName: `container-${index + 1}`, logs: ['The container is starting'] };
							const podLogs = await coreV1Api.readNamespacedPodLog({ name: status.podName, namespace: projectName, container: container.name });
							return {
								podName: `container-${index + 1}`,
								logs: podLogs.split('\n').slice(0, 500),
							};
						} catch (error) {
							console.warn(`Error fetching logs for pod ${status.podName}:`, error);
							return { podName: status.podName, logs: null };
						}
					})
				);

				return {
					name: container.name,
					image: container.image,
					env: container.env ? (hasSecretsAccess ? container.env : container.env.map((env: any) => ({ name: env.name, value: '********' }))) : [],
					status,
					logs,
				};
			})
		);

		const logs = await getLogs(projectName, appName);
		const resourcesPolicy = await getAppResourcesPolicy(projectName, appName);
		const authorizations = await getAppAuthorization(projectName, appName);
		const accreditations = await getAccreditations(2);
		const volumes = (appData.spec?.containers || []).map((container: any) => (container.volumes || []).map((volume: any) => ({ name: volume.name, mountPath: volume.mountPath, container: container.name }))).flat();

		return {
			name: appData.metadata.name,
			description: appData.metadata.annotations?.description || '',
			createdAt: appData.metadata.creationTimestamp,
			repository: {
				url: appData.metadata.annotations?.repository || '',
				image: '',
				version: '',
			},
			replicas: {
				desired: deploymentData.spec?.replicas || 0,
				available: deploymentData.status?.availableReplicas || 0,
				ready: deploymentData.status?.readyReplicas || 0,
				updated: deploymentData.status?.updatedReplicas || 0,
				asked: appData.spec?.replicas || 0,
			},
			domains: domainStatuses,
			databases: databaseStatuses,
			containers,
			resourcesPolicy: resourcesPolicy,
			collaborators: hasCollaboratorsAccess
				? app.collaborators.map((collaborator) => ({
						username: collaborator.userId.username || collaborator.userId.name || 'Unknown',
						image: collaborator.userId.image || '',
						accreditation: {
							name: collaborator.accreditation.name,
							description: collaborator.accreditation.description,
							slug: collaborator.accreditation.slug,
							authorizations: collaborator.accreditation.authorizations,
						},
				  }))
				: [],
			logs,
			volumes,
			authorizations,
			accreditations: hasCollaboratorsAccess ? accreditations : [],
		};
	} catch (error) {
		console.error('Error fetching app:', error);
		return null;
	}
}

export async function createApp(userId: string, { name, description, repository, projectName }: { name: string; description: string; repository: string | null; projectName: string }): Promise<ErrorType> {
	const existingApp = await AppModel.findOne({ name });
	if (existingApp) {
		return {
			message: 'App already exists',
			status: 400,
		};
	}

	await customObjectsApi.createNamespacedCustomObject({
		group: 'kooked.ch',
		version: 'v1',
		namespace: projectName,
		plural: 'kookedapps',
		body: {
			apiVersion: 'kooked.ch/v1',
			kind: 'KookedApp',
			metadata: {
				name,
				annotations: {
					description,
					repository,
				},
			},
			spec: {
				replicas: 1,
			},
		},
	});

	const project = await ProjectModel.findOne<IProject>({ slug: projectName }).exec();
	if (!project) throw new Error('Project not found');
	const defaultAccreditation = await AccreditationModel.findOne({ slug: 'own', accessLevel: 2 }).exec();
	if (!defaultAccreditation) {
		throw new Error('Default accreditation not found');
	}

	const defaultContainerresourcesPolicy = await ResourcesPolicyModel.findOne({ slug: 'dcl', accessLevel: 2 }).exec();
	const defaultDomainresourcesPolicy = await ResourcesPolicyModel.findOne({ slug: 'ddl', accessLevel: 2 }).exec();
	const defaultDatabaseresourcesPolicy = await ResourcesPolicyModel.findOne({ slug: 'ddb', accessLevel: 2 }).exec();
	const defaultVolumeresourcesPolicy = await ResourcesPolicyModel.findOne({ slug: 'dvl', accessLevel: 2 }).exec();

	if (!defaultContainerresourcesPolicy || !defaultDomainresourcesPolicy || !defaultDatabaseresourcesPolicy) {
		throw new Error('Default resource policy not found');
	}

	const collaborators = project?.members.filter((member) => member.userId != userId);
	const collaboratorsWithAccreditation =
		(await Promise.all(
			collaborators.map(async (member) => {
				const accreditation = await AccreditationModel.findOne({ slug: (await AccreditationModel.findById(member.accreditation)).slug, accessLevel: 2 });
				return { userId: member.userId, accreditation: accreditation?._id };
			})
		)) || [];

	await AppModel.create({
		name,
		projectId: project?._id,
		image: '',
		resourcesPolicy: {
			container: defaultContainerresourcesPolicy._id,
			domain: defaultDomainresourcesPolicy._id,
			database: defaultDatabaseresourcesPolicy._id,
			volume: defaultVolumeresourcesPolicy._id,
		},
		collaborators: [{ userId, accreditation: defaultAccreditation._id }, ...collaboratorsWithAccreditation],
	});

	log(`Created app`, 'info', projectName, name);

	return {
		message: 'App created',
		status: 200,
	};
}

export async function deleteApp(projectName: string, appName: string): Promise<ErrorType> {
	const hasAccess = await checkAccreditation('apps:2:delete', `${projectName}/${appName}`);
	if (!hasAccess) return { message: 'Unauthorized', status: 401 };

	const app = await customObjectsApi.getNamespacedCustomObject({ group: 'kooked.ch', version: 'v1', namespace: projectName, plural: 'kookedapps', name: appName });
	if (!app) return { message: 'App not found', status: 404 };

	if (app.spec.domains) {
		await Promise.all(app.spec.domains.map(async (domain: any) => await deleteMonitor(domain.url)));
	}

	await customObjectsApi.deleteNamespacedCustomObject({ group: 'kooked.ch', version: 'v1', namespace: projectName, plural: 'kookedapps', name: appName });

	await AppModel.deleteOne({ name: appName });

	return { message: 'App deleted', status: 200 };
}

export async function updateApp(projectName: string, appName: string, { description, repository }: { description: string; repository: string }): Promise<ErrorType> {
	const hasAccess = await checkAccreditation('apps:2:update', `${projectName}/${appName}`);
	if (!hasAccess) {
		return { message: 'Unauthorized', status: 401 };
	}

	const app = await customObjectsApi.getNamespacedCustomObject({
		group: 'kooked.ch',
		version: 'v1',
		namespace: projectName,
		plural: 'kookedapps',
		name: appName,
	});

	if (!app) {
		return { message: 'App not found', status: 404 };
	}

	const patchBody = [
		{
			op: 'replace',
			path: '/metadata/annotations/description',
			value: description,
		},
		{
			op: 'replace',
			path: '/metadata/annotations/repository',
			value: repository,
		},
	];

	await customObjectsApi.patchNamespacedCustomObject({
		group: 'kooked.ch',
		version: 'v1',
		namespace: projectName,
		plural: 'kookedapps',
		name: appName,
		body: patchBody,
	});

	return { message: 'App updated', status: 200 };
}
