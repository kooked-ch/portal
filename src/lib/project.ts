import { AccreditationModel } from '@/models/Accreditation';
import { IProject, ProjectModel } from '@/models/Project';
import { ErrorType } from '@/types/error';
import { k3sApi } from './api';
import { ProjectType } from '@/types/project';

export async function createProject(userId: string, project: { name: string; description: string }): Promise<ErrorType> {
	try {
		const slug = project.name.toLowerCase().replace(/ /g, '-');

		if (['cert-manager', 'default', 'databases', 'kube-public', 'kube-system', 'kube-node-lease', 'monitoring', 'nfs-provisioner'].includes(slug)) {
			return { message: { name: { message: 'Project name is reserved' } }, status: 409 };
		}

		const existingProject = await ProjectModel.findOne({ slug }).exec();
		if (existingProject) {
			return { message: { name: { message: 'Project already exists' } }, status: 409 };
		}

		const defaultAccreditation = await AccreditationModel.findOne({ slug: 'own', accessLevel: 1 }).exec();
		if (!defaultAccreditation) {
			throw new Error('Default accreditation not found');
		}

		await ProjectModel.create({
			...project,
			slug,
			members: [{ userId, accreditation: defaultAccreditation._id }],
		});

		await k3sApi.createNamespace({
			metadata: { name: slug },
		});

		return { message: 'Project created successfully', status: 201 };
	} catch (error) {
		console.error('Error creating project:', error);
		return { message: 'An unexpected error occurred', status: 500 };
	}
}
