import { AccreditationModel } from '@/models/Accreditation';
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

	const accreditations = [
		{
			name: 'Super Administrator',
			description: 'Has full access to all system features and settings.',
			slug: 'sadm',
			accessLevel: 0,
			authorizations: {
				level: 0,
				projects: ['create', 'read', 'update', 'delete'],
				users: ['read', 'update'],
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
	];

	accreditations.forEach(async (accreditation) => {
		await AccreditationModel.findOneAndReplace({ name: accreditation.name }, accreditation, { upsert: true, new: true });
	});

	return cached.conn;
}

async function disconnect() {
	await mongoose.disconnect();
}

const db = { connect, disconnect };
export default db;
