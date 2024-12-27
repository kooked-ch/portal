import { AppModel } from '@/models/App';
import { checkAccreditation, getUser } from './auth';
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

export async function getLogs(projectName: string, appName: string): Promise<logType[]> {
	if (!(await checkAccreditation('logs:2:read', `${projectName}/${appName}`))) {
		return [];
	}

	const project = await ProjectModel.findOne({ slug: projectName }).exec();
	if (!project) {
		return [];
	}

	if (!appName) {
		return [];
	}

	const app = await AppModel.findOne({
		name: appName,
		projectId: project._id,
	}).exec();
	if (!app) {
		return [];
	}

	const logs = await LogsModel.find({
		appId: app._id,
		type: 'info',
	}).exec();

	const userIds = [...new Set(logs.map((log) => log.userId))];

	const users = await UserModel.find({ _id: { $in: userIds } })
		.select('username')
		.exec();

	const userMap = users.reduce((map, user) => {
		map[user._id.toString()] = user.username || 'Unknown';
		return map;
	}, {} as Record<string, string>);

	return logs.map((log) => {
		return {
			message: log.message,
			user: userMap[log.userId.toString()] || 'Unknown',
			date: log.timestamp,
		};
	});
}
