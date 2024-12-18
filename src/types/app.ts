import { z } from 'zod';

export interface AppsType {
	name: string;
	description: string;
	createdAt: Date;
	repository: {
		url: string;
		image: string;
		version: string;
	};
}

export const appSchema = z.object({
	name: z
		.string()
		.min(3, 'Name must contain at least 3 characters')
		.max(255, 'Name must contain at most 255 characters')
		.transform((value) => value.toLowerCase()),
	description: z.string().min(3, 'Description must contain at least 3 characters').max(255, 'Description must contain at most 255 characters'),
	repository: z
		.union([z.string().url({ message: 'Invalid URL' }), z.literal('')])
		.transform((val) => (val === '' ? undefined : val))
		.optional(),
});

export interface AppType {
	name: string;
	description: string;
	createdAt: Date;
	repository: {
		url: string;
		image: string;
		version: string;
	} | null;
	replicas: number;
	domains: {
		url: string;
		port: number;
		container: string;
	}[];
	databases: {
		name: string;
		password: string;
		provider: string;
		user: string;
	}[];
	containers: {
		name: string;
		image: string;
		env: {
			key: string;
			value: string;
		}[];
	}[];
	collaborators: {
		username: string;
		image: string;
	}[];
}
