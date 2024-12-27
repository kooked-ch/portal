import { AppModel } from '@/models/App';
import { getUser } from './auth';
import { ProjectModel } from '@/models/Project';
import { LogsModel } from '@/models/Logs';
import { UserModel } from '@/models/User';
import { logType } from '@/types/log';

export async function log(message: string, type: string, projectName: string, appName: string) {
	const user = await getUser();

	const project = await ProjectModel.findOne({ slug: projectName }).exec();

	if (!appName) {
		await LogsModel.create({ message, type, userId: user.id, projectId: project._id, timestamp: new Date() });
		return;
	}

	const app = await AppModel.findOne({ name: appName, projectId: project._id }).exec();

	await LogsModel.create({ message, type, userId: user.id, appId: app._id, projectId: project._id, timestamp: new Date() });
}
