import { AccreditationModel } from '@/models/Accreditation';
import { IProject, ProjectModel } from '@/models/Project';
import { ErrorType } from '@/types/error';
import { customObjectsApi, k3sApi } from './api';
import { ProjectsType, ProjectType } from '@/types/project';
import { checkAccreditation } from './auth';
import { getRepository } from './utils';

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
		return { message: { name: { message: 'An unexpected error occurred' } }, status: 500 };
	}
}

export async function getProjects(userId: string): Promise<ProjectsType[] | null> {
	try {
		const hasAccessAll = await checkAccreditation('projects:0:read');
		const filter = hasAccessAll ? {} : { 'members.userId': userId };
		const projects = await ProjectModel.find<IProject>(filter).populate<{ members: Array<{ userId: { image: string; username: string } }> }>('members.userId', 'username image').exec();

		return projects.map((project) => ({
			name: project.name,
			description: project.description,
			slug: project.slug,
			createdAt: project.createdAt,
			members: project.members.map((member) => ({
				username: member.userId?.username ?? 'Unknown',
				image: member.userId?.image ?? 'default-image.png',
			})),
		}));
	} catch (error: unknown) {
		console.error('Error fetching projects:', (error as Error).message);
		return null;
	}
}

export async function getProject(slug: string): Promise<ProjectType | null> {
	try {
		const hasAccess = await checkAccreditation('projects:1:read', slug);
		if (!hasAccess) {
			return null;
		}

		const project = await ProjectModel.findOne<IProject>({ slug });
		if (!project) {
			return null;
		}

		const apps = await customObjectsApi.listNamespacedCustomObject('kooked.ch', 'v1', project.slug, 'kookedapps');

		return {
			name: project.name,
			description: project.description,
			slug: project.slug,
			createdAt: project.createdAt,
			apps: await Promise.all(
				apps.body.items.map(async (app: any) => ({
					name: app.metadata.name,
					description: app.metadata.annotations?.description || '',
					repository: await getRepository(app.metadata.annotations?.repository || ''),
					createdAt: app.metadata.creationTimestamp,
				}))
			),
		};
	} catch (error: unknown) {
		console.error('Error fetching project:', (error as Error).message);
		return null;
	}
}
