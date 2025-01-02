import { AppModel } from '@/models/App';
import { ProjectModel } from '@/models/Project';
import { ResourcesPolicyModel } from '@/models/ResourcesPolicy';
import { AppResourcesPolicy, ProjectResourcesPolicy } from '@/types/resourcesPolicy';
import { customObjectsApi } from './api';

export async function getProjectResourcesPolicy(projectName: string): Promise<ProjectResourcesPolicy> {
	const project = await ProjectModel.findOne({ slug: projectName }).populate('resourcesPolicy');
	if (!project) return { name: '', description: '', totalLimit: 0, remainingLimit: 0 };

	const apps = await AppModel.find({ projectId: project._id }).exec();

	const resourcesPolicy = project.resourcesPolicy;
	return {
		name: resourcesPolicy.name,
		description: resourcesPolicy.description,
		totalLimit: resourcesPolicy.limitation.apps,
		remainingLimit: resourcesPolicy.limitation.apps - (apps ? apps.length : 0),
	};
}

export async function getAppResourcesPolicy(projectName: string, appName: string): Promise<AppResourcesPolicy> {
	const project = await ProjectModel.findOne({ slug: projectName }).exec();
	if (!project) {
		return {
			containers: { name: '', description: '', totalLimit: 0, remainingLimit: 0 },
			domains: { name: '', description: '', totalLimit: 0, remainingLimit: 0 },
			databases: { name: '', description: '', totalLimit: 0, remainingLimit: 0 },
		};
	}

	const appData = await customObjectsApi.getNamespacedCustomObject({ group: 'kooked.ch', version: 'v1', namespace: projectName, plural: 'kookedapps', name: appName });
	const app = await AppModel.findOne({ name: appName, projectId: project._id }).exec();
	if (!appData) {
		return {
			containers: { name: '', description: '', totalLimit: 0, remainingLimit: 0 },
			domains: { name: '', description: '', totalLimit: 0, remainingLimit: 0 },
			databases: { name: '', description: '', totalLimit: 0, remainingLimit: 0 },
		};
	}

	const resourcesPolicy = await Promise.all([ResourcesPolicyModel.findOne({ _id: app.resourcesPolicy.container }).exec(), ResourcesPolicyModel.findOne({ _id: app.resourcesPolicy.domain }).exec(), ResourcesPolicyModel.findOne({ _id: app.resourcesPolicy.database }).exec()]);

	return {
		containers: {
			name: resourcesPolicy[0]?.name || '',
			description: resourcesPolicy[0]?.description || '',
			totalLimit: resourcesPolicy[0]?.limitation.containers || 0,
			remainingLimit: resourcesPolicy[0]?.limitation.containers - (appData.spec.containers ? appData.spec.containers.length : 0),
		},
		domains: {
			name: resourcesPolicy[1]?.name || '',
			description: resourcesPolicy[1]?.description || '',
			totalLimit: resourcesPolicy[1]?.limitation.domains || 0,
			remainingLimit: resourcesPolicy[1]?.limitation.domains - (appData.spec.domains ? appData.spec.domains.length : 0),
		},
		databases: {
			name: resourcesPolicy[2]?.name || '',
			description: resourcesPolicy[2]?.description || '',
			totalLimit: resourcesPolicy[2]?.limitation.databases || 0,
			remainingLimit: resourcesPolicy[2]?.limitation.databases - (appData.spec.databases ? appData.spec.databases.length : 0),
		},
	};
}
