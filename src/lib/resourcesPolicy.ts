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

