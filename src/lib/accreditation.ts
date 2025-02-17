import { AccreditationModel } from '@/models/Accreditation';
import { IProject, ProjectModel } from '@/models/Project';
import { AccreditationType } from '@/types/accreditations';
import { ErrorType } from '@/types/error';
import { checkAccreditation, getUser } from './auth';
import { UserModel } from '@/models/User';
import { AppModel, IApp } from '@/models/App';

export async function getAccreditations(level: number): Promise<AccreditationType[]> {
	const accreditations = await AccreditationModel.find({ accessLevel: level }, { _id: 0 }).exec();
	if (!accreditations) return [];

	return accreditations
		.sort((a, b) => a.authorizations.level - b.authorizations.level)
		.map((accreditation) => ({
			name: accreditation.name,
			description: accreditation.description,
			slug: accreditation.slug,
			accessLevel: accreditation.accessLevel,
		}));
}

export async function updateProjectAccreditation(projectName: string, userId: string, slug: string): Promise<ErrorType> {
	const user = await getUser();
	if (!user) return { message: 'Unauthorized', status: 401 };

	const userData = await UserModel.findOne({ email: user.email }).exec();
	if (!userData) return { message: 'Unauthorized', status: 401 };

	if (slug === 'own') return { message: 'Unauthorized', status: 401 };

	const filter = (await checkAccreditation('members:0:update')) ? { slug: projectName } : { slug: projectName, 'members.userId': userData._id };
	const project = await ProjectModel.findOne<IProject>(filter);
	if (!project) return { message: 'Project Not found', status: 404 };

	const updatedUser = await UserModel.findOne({ id: userId }).exec();
	if (!updatedUser) return { message: 'User Not found', status: 404 };

	const member = project.members.find((member) => member.userId.toString() === updatedUser._id.toString());
	if (!member) return { message: 'User Not found', status: 404 };

	const oldAccreditation = await AccreditationModel.findOne({ _id: member.accreditation }).exec();
	if (oldAccreditation.slug === slug) return { message: 'Already accredited', status: 400 };
	if (oldAccreditation.slug === 'own') return { message: 'Unauthorized', status: 401 };

	const accreditation = await AccreditationModel.findOne({ slug, accessLevel: 1 }).exec();
	if (!accreditation) return { message: 'Accreditation Not found', status: 404 };

	member.accreditation = accreditation._id;

	await project.save();

	const apps = await AppModel.find<IApp>({ projectId: project._id }).exec();
	apps.forEach(async (app) => {
		await updateAppAccreditation(projectName, app.name, updatedUser.id, slug);
	});

	return { message: 'User accreditation updated successfully', status: 200 };
}

export async function updateAppAccreditation(projectName: string, appName: string, userId: string, slug: string): Promise<ErrorType> {
	const user = await getUser();
	if (!user) return { message: 'Unauthorized', status: 401 };

	const userData = await UserModel.findOne({ email: user.email }).exec();
	if (!userData) return { message: 'Unauthorized', status: 401 };

	const updatedUser = await UserModel.findOne({ id: userId }).exec();
	if (!updatedUser) return { message: 'User Not found', status: 404 };

	const filter = (await checkAccreditation('members:0:update')) ? { slug: projectName } : { slug: projectName, 'members.userId': userData._id };
	const project = await ProjectModel.findOne<IProject>(filter);
	if (!project) return { message: 'Project Not found', status: 404 };

	const app = await AppModel.findOne<IApp>({ name: appName, projectId: project._id }).exec();
	if (!app) return { message: 'App Not found', status: 404 };

	const accreditation = await AccreditationModel.findOne({ slug, accessLevel: 2 }).exec();
	if (!accreditation) return { message: 'Accreditation Not found', status: 404 };

	const collaborator = app.collaborators.find((collaborator) => collaborator.userId.toString() === updatedUser._id.toString());
	if (!collaborator) {
		app.collaborators.push({ userId: updatedUser._id, accreditation: accreditation._id });
		await app.save();
		return { message: 'App accreditation updated successfully', status: 200 };
	}

	const existingAccreditation = await AccreditationModel.findOne({ _id: collaborator.accreditation }).exec();
	if (existingAccreditation.slug === slug) return { message: 'Already accredited', status: 400 };
	if (existingAccreditation.slug === 'own') return { message: 'Cannot accredited', status: 400 };

	collaborator.accreditation = accreditation._id;
	await app.save();

	return { message: 'App accreditation updated successfully', status: 200 };
}
