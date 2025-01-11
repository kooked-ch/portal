import { AccreditationModel } from '@/models/Accreditation';
import { ResourcesPolicyModel } from '@/models/ResourcesPolicy';
import mongoose from 'mongoose';

const MONGO_URI = `mongodb://${process.env.MONGO_USER_USERNAME}:${process.env.MONGO_USER_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT || 27017}/${process.env.MONGO_DATABASE || 'portalDB'}`;

//@ts-ignore
let cached = global.mongoose;

if (!cached) {
	//@ts-ignore
	cached = global.mongoose = { conn: null, promise: null };
}

async function connect() {
	if (cached.conn) {
		return cached.conn;
	}

	if (!cached.promise) {
		const opts = {
			bufferCommands: false,
		};

		cached.promise = mongoose.connect(MONGO_URI, opts).then((mongoose) => {
			return mongoose;
		});
	}

	cached.conn = await cached.promise;

	init();

	return cached.conn;
}

async function disconnect() {
	await mongoose.disconnect();
}

async function init() {
	const accreditations = [
		{
			name: 'Super Administrator',
			description: 'Has full access to all system features and settings.',
			slug: 'sadm',
			accessLevel: 0,
			authorizations: {
				level: 0,
				projects: ['create', 'read', 'update', 'delete'],
				apps: ['create', 'read', 'update', 'delete'],
				users: ['read', 'update'],
				containers: ['read'],
				domains: ['read'],
				databases: ['read'],
			},
		},
		{
			name: 'Administrator',
			description: 'Has extensive permissions to manage most system resources.',
			slug: 'adm',
			accessLevel: 0,
			authorizations: {
				level: 1,
				projects: ['create', 'read', 'update', 'delete'],
				apps: ['create', 'read', 'update', 'delete'],
				users: ['read', 'update'],
			},
		},
		{
			name: 'Standard User',
			description: 'Limited permissions for basic functionalities.',
			slug: 'std',
			accessLevel: 0,
			authorizations: {
				level: 2,
				projects: ['create'],
			},
		},
		{
			name: 'Guest User',
			description: 'Minimal permissions for read-only access.',
			slug: 'gst',
			accessLevel: 0,
			authorizations: {
				level: 3,
				projects: [],
			},
		},
		{
			name: 'Owner',
			description: 'Has full control over the project and can manage all aspects.',
			slug: 'own',
			accessLevel: 1,
			authorizations: {
				level: 0,
				projects: ['read', 'update', 'delete'],
				apps: ['create'],
			},
		},
		{
			name: 'Administrator',
			description: 'Can manage most project resources and perform updates.',
			slug: 'adm',
			accessLevel: 1,
			authorizations: {
				level: 1,
				projects: ['read', 'update'],
				apps: ['create'],
			},
		},
		{
			name: 'Project Member',
			description: 'Has permissions to read and collaborate on the project.',
			slug: 'mem',
			accessLevel: 1,
			authorizations: {
				level: 2,
				projects: ['read'],
				apps: ['create'],
			},
		},
		{
			name: 'Guest',
			description: 'Has minimal access for viewing project information only.',
			slug: 'gst',
			accessLevel: 1,
			authorizations: {
				level: 3,
				projects: ['read'],
			},
		},
		{
			name: 'Owner',
			description: 'Has full control over the app and can manage all aspects.',
			slug: 'own',
			accessLevel: 2,
			authorizations: {
				level: 0,
				apps: ['read', 'update', 'delete'],
				secrets: ['read', 'update'],
				containers: ['read', 'update', 'delete', 'create'],
				domains: ['read', 'update', 'delete', 'create'],
				databases: ['read', 'update', 'delete', 'create'],
				volumes: ['read', 'update', 'delete', 'create'],
				logs: ['read'],
				collaborators: ['invite', 'read', 'update', 'delete'],
			},
		},
		{
			name: 'Administrator',
			description: 'Can manage most app resources and perform updates.',
			slug: 'adm',
			accessLevel: 2,
			authorizations: {
				level: 1,
				apps: ['read', 'update'],
				secrets: ['read', 'update'],
				containers: ['read', 'update', 'delete', 'create'],
				domains: ['read', 'update', 'delete', 'create'],
				databases: ['read', 'update', 'delete', 'create'],
				volumes: ['read', 'update', 'delete', 'create'],
				logs: ['read'],
				collaborators: ['invite', 'read', 'update', 'delete'],
			},
		},
		{
			name: 'App Collaborator',
			description: 'Has permissions to read and collaborate on the app.',
			slug: 'col',
			accessLevel: 2,
			authorizations: {
				level: 2,
				apps: ['read', 'update'],
				secrets: ['read', 'update'],
				containers: ['read', 'update', 'delete', 'create'],
				domains: ['read', 'update', 'create'],
				databases: ['read', 'update', 'create'],
				volumes: ['read', 'update', 'create'],
				logs: ['read'],
				collaborators: ['read'],
			},
		},
		{
			name: 'Guest',
			description: 'Has minimal access for viewing app information only.',
			slug: 'gst',
			accessLevel: 2,
			authorizations: {
				level: 3,
				apps: ['read'],
				containers: ['read'],
				domains: ['read'],
				databases: ['read'],
				volumes: ['read'],
			},
		},
	];

	accreditations.forEach(async (accreditation) => {
		await AccreditationModel.findOneAndReplace({ name: accreditation.name, accessLevel: accreditation.accessLevel }, accreditation, { upsert: true, new: true });
	});

	const resourcesPolicy = [
		{
			name: 'No Project limit',
			description: 'No limit on the number of project that can be created.',
			slug: 'npl',
			accessLevel: 0,
			limitation: {
				level: 0,
				projects: -1,
			},
		},
		{
			name: 'Default Project limit',
			description: 'Default limit of 1 project that can be created.',
			slug: 'dpl',
			accessLevel: 0,
			limitation: {
				level: 1,
				projects: 1,
			},
		},
		{
			name: 'Max Project limit',
			description: 'Maximum limit of 5 projects that can be created.',
			slug: 'mpl',
			accessLevel: 0,
			limitation: {
				level: 2,
				projects: 5,
			},
		},
		{
			name: 'Denied Project creation',
			description: 'No permission to create any project.',
			slug: 'dpc',
			accessLevel: 0,
			limitation: {
				level: 3,
				projects: 0,
			},
		},
		{
			name: 'No App limit',
			description: 'No limit on the number of app that can be created.',
			slug: 'nal',
			accessLevel: 1,
			limitation: {
				level: 0,
				apps: -1,
			},
		},
		{
			name: 'Default App limit',
			description: 'Default limit of 1 app that can be created.',
			slug: 'dal',
			accessLevel: 1,
			limitation: {
				level: 1,
				apps: 1,
			},
		},
		{
			name: 'Max App limit',
			description: 'Maximum limit of 5 apps that can be created.',
			slug: 'mal',
			accessLevel: 1,
			limitation: {
				level: 2,
				apps: 5,
			},
		},
		{
			name: 'Denied App creation',
			description: 'No permission to create any app.',
			slug: 'dac',
			accessLevel: 1,
			limitation: {
				level: 3,
				apps: 0,
			},
		},
		{
			name: 'No Container limit',
			description: 'No limit on the number of container that can be created.',
			slug: 'ncl',
			accessLevel: 2,
			limitation: {
				level: 0,
				containers: -1,
			},
		},
		{
			name: 'Default Container limit',
			description: 'Default limit of 1 container that can be created.',
			slug: 'dcl',
			accessLevel: 2,
			limitation: {
				level: 1,
				containers: 1,
			},
		},
		{
			name: 'Max Container limit',
			description: 'Maximum limit of 5 containers that can be created.',
			slug: 'mcl',
			accessLevel: 2,
			limitation: {
				level: 2,
				containers: 5,
			},
		},
		{
			name: 'Denied Container creation',
			description: 'No permission to create any container.',
			slug: 'dcc',
			accessLevel: 2,
			limitation: {
				level: 3,
				containers: 0,
			},
		},
		{
			name: 'No Domain limit',
			description: 'No limit on the number of domain that can be created.',
			slug: 'ndl',
			accessLevel: 2,
			limitation: {
				level: 0,
				domains: -1,
			},
		},
		{
			name: 'Default Domain limit',
			description: 'Default limit of 1 domain that can be created.',
			slug: 'ddl',
			accessLevel: 2,
			limitation: {
				level: 1,
				domains: 1,
			},
		},
		{
			name: 'Max Domain limit',
			description: 'Maximum limit of 5 domains that can be created.',
			slug: 'mdl',
			accessLevel: 2,
			limitation: {
				level: 2,
				domains: 5,
			},
		},
		{
			name: 'Denied Domain creation',
			description: 'No permission to create any domain.',
			slug: 'ddc',
			accessLevel: 2,
			limitation: {
				level: 3,
				domains: 0,
			},
		},
		{
			name: 'No Database limit',
			description: 'No limit on the number of database that can be created.',
			slug: 'ndb',
			accessLevel: 2,
			limitation: {
				level: 0,
				databases: -1,
			},
		},
		{
			name: 'Default Database limit',
			description: 'Default limit of 1 database that can be created.',
			slug: 'ddb',
			accessLevel: 2,
			limitation: {
				level: 1,
				databases: 1,
			},
		},
		{
			name: 'Max Database limit',
			description: 'Maximum limit of 2 databases that can be created.',
			slug: 'mdb',
			accessLevel: 2,
			limitation: {
				level: 2,
				databases: 2,
			},
		},
		{
			name: 'Denied Database creation',
			description: 'No permission to create any database.',
			slug: 'ddc',
			accessLevel: 2,
			limitation: {
				level: 3,
				databases: 0,
			},
		},
		{
			name: 'No Volume limit',
			description: 'No limit on the number of volume that can be created.',
			slug: 'nvl',
			accessLevel: 2,
			limitation: {
				level: 0,
				volumes: -1,
			},
		},
		{
			name: 'Default Volume limit',
			description: 'Default limit of 1 volume that can be created.',
			slug: 'dvl',
			accessLevel: 2,
			limitation: {
				level: 1,
				volumes: 1,
			},
		},
		{
			name: 'Max Volume limit',
			description: 'Maximum limit of 5 volumes that can be created.',
			slug: 'mvl',
			accessLevel: 2,
			limitation: {
				level: 2,
				volumes: 5,
			},
		},
		{
			name: 'Denied Volume creation',
			description: 'No permission to create any volume.',
			slug: 'dvc',
			accessLevel: 2,
			limitation: {
				level: 3,
				volumes: 0,
			},
		},
	];

	resourcesPolicy.forEach(async (policy) => {
		await ResourcesPolicyModel.findOneAndReplace({ name: policy.name, accessLevel: policy.accessLevel }, policy, { upsert: true, new: true });
	});
}

const db = { connect, disconnect };
export default db;

// {
// 	$set: {
// 		"resourcesPolicy.volume": ObjectId("678284c33d8fafafe4ad672c")
// 	},
// }
