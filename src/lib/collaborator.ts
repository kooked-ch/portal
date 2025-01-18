import { AccreditationModel } from '@/models/Accreditation';
import { EmailModel } from '@/models/Email';
import { generateRandomString } from './utils';
import { ProjectModel } from '@/models/Project';
import { AppModel, IApp } from '@/models/App';
import { sendEmail } from './mail';
import { customObjectsApi } from './api';
import { InvitationType } from '@/types/collaborator';
import { ErrorType } from '@/types/error';

export async function inviteCollaborator(projectName: string, appName: string, data: { email: string; accreditation: string }) {
	const accreditationData = await AccreditationModel.findOne({ slug: data.accreditation }).exec();
	if (!accreditationData) {
		return { message: 'Accreditation not found', status: 404 };
	}

	const project = await ProjectModel.findOne({ slug: projectName }).exec();
	if (!project) {
		return { message: 'Project not found', status: 404 };
	}

	const app = await AppModel.findOne({ name: appName }).exec();
	if (!app) {
		return { message: 'App not found', status: 404 };
	}

	const emailToken = generateRandomString(128);
	await EmailModel.create({
		email: data.email,
		type: 'invitation',
		token: emailToken,
		data: {
			projectId: project._id,
			appId: app._id,
			accreditationId: accreditationData._id,
		},
	});

	sendEmail(data.email, 'invitation', {
		projectName,
		appName,
		token: emailToken,
	});

	return {
		message: 'Collaborator invited',
		status: 201,
	};
}

