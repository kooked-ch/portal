import { AccreditationModel } from '@/models/Accreditation';
import { EmailModel } from '@/models/Email';
import { generateRandomString } from './utils';
import { IProject, ProjectModel } from '@/models/Project';
import { sendEmail } from './mail';
import { InvitationType } from '@/types/member';
import { ErrorType } from '@/types/error';
import { AllProjectUsers } from '@/types/user';
import { checkAccreditation, getUser } from './auth';
import { IUser, UserModel } from '@/models/User';
import { getAccreditations, updateAppAccreditation } from './accreditation';
import { IAccreditation } from '@/models/Accreditation';
import { AccreditationType } from '@/types/accreditations';
import { AppModel, IApp } from '@/models/App';

export async function getAllProjectMembers(projectName: string): Promise<AllProjectUsers | null> {
	if (!(await checkAccreditation('members:1:read', projectName))) return null;

	const user = await getUser();
	if (!user) return null;

	const userData = await UserModel.findOne({ email: user.email }).exec();
	if (!userData) return null;

	const filter = (await checkAccreditation('projects:0:read')) ? { slug: projectName } : { slug: projectName, 'members.userId': userData._id };

	const project = await ProjectModel.findOne<IProject>(filter)
		.populate<{ members: Array<{ userId: IUser; accreditation: IAccreditation }> }>({
			path: 'members.userId members.accreditation',
			select: 'username image id name description slug authorizations',
		})
		.exec();

	if (!project || !project.members) return null;

	const accreditationsList = await getAccreditations(1);

	return {
		users: project.members.map((member) => {
			return {
				username: member.userId.username || member.userId.name || 'Unknown',
				image: member.userId.image || '',
				id: member.userId.id,
				accreditation: {
					name: member.accreditation.name,
					description: member.accreditation.description,
					slug: member.accreditation.slug,
					accessLevel: member.accreditation.accessLevel,
					authorizations: {
						...member.accreditation.authorizations,
						level: Array.isArray(member.accreditation.authorizations.level) ? member.accreditation.authorizations.level.length : member.accreditation.authorizations.level || 0,
					},
				} as AccreditationType,
			};
		}),
		accreditationsList,
	};
}

export async function inviteMember(projectName: string, data: { email: string; accreditation: string }) {
	const accreditationData = await AccreditationModel.findOne({ slug: data.accreditation }).exec();
	if (!accreditationData) {
		return { message: 'Accreditation not found', status: 404 };
	}

	const project = await ProjectModel.findOne({ slug: projectName }).populate<{ members: { userId: IUser } }>('members.userId').exec();
	if (!project) {
		return { message: 'Project not found', status: 404 };
	}

	if (project.members.find((member: { userId: IUser }) => member.userId.email === data.email)) {
		return { message: 'Already a member', status: 400 };
	}

	const emailToken = generateRandomString(128);
	await EmailModel.create({
		email: data.email,
		type: 'invitation',
		token: emailToken,
		data: {
			projectId: project._id,
			accreditationId: accreditationData._id,
		},
	});

	sendEmail(data.email, 'invitation', {
		projectName,
		token: emailToken,
	});

	return {
		message: 'Member invited',
		status: 201,
	};
}

export async function getInvitation(token: string): Promise<InvitationType | null> {
	const emailData = await EmailModel.findOne({ token, type: 'invitation' }).exec();
	if (!emailData) {
		return null;
	}

	const project = await ProjectModel.findById(emailData.data.projectId).exec();

	return {
		project: {
			name: project.name,
			description: project.description,
			slug: project.slug,
		},
		token,
	};
}

export async function acceptInvitation(token: string, userId: string): Promise<ErrorType> {
	try {
		const emailData = await EmailModel.findOne({ token, type: 'invitation' }).exec();
		if (!emailData) {
			return { message: 'Invitation not found', status: 404 };
		}

		const { projectId, accreditationId } = emailData.data;
		if (!projectId || !accreditationId) {
			return { message: 'Invalid invitation data', status: 400 };
		}

		const project = await ProjectModel.findById<IProject>(projectId).exec();
		if (!project) {
			return { message: 'Project not found', status: 404 };
		}

		if (project?.members.find((member) => member.userId.toString() === userId.toString())) {
			return { message: 'Already a member', status: 400 };
		}

		const accreditation = await AccreditationModel.findById(accreditationId).exec();
		if (!accreditation) {
			return { message: 'Accreditation not found', status: 404 };
		}

		const apps = await AppModel.find<IApp>({ projectId }).exec();
		apps.forEach(async (app) => {
			const appAccreditation = await AccreditationModel.findOne({ slug: accreditation.slug, accessLevel: 2 }).exec();
			if (!appAccreditation) return;
			const collaborator = app.collaborators.find((collaborator) => collaborator.userId.toString() === userId.toString());
			if (collaborator) {
				collaborator.accreditation = appAccreditation._id;
				await app.save();
			}
			app.collaborators.push({ userId: userId, accreditation: appAccreditation._id });
			await app.save();
		});

		project.members.push({ userId, accreditation: accreditationId });
		await project.save();

		return { message: 'Invitation accepted', status: 200 };
	} catch (error) {
		console.error('Error accepting invitation:', error);
		return { message: 'Internal server error', status: 500 };
	}
}
