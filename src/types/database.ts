import { z } from 'zod';

export interface DatabaseType {
	name: string;
	provider: 'mongodb' | 'mariadb' | 'postgresql';
	username: string;
	password: string;
}

export const databaseSchema = z.object({
	name: z
		.string()
		.min(1, 'Database name is required')
		.transform((value) => value.replace(/[^a-z0-9-]/g, '-')),
	provider: z.enum(['mongodb', 'mariadb', 'postgresql']),
	username: z.string().min(1, 'User is required'),
	password: z.string().min(1, 'Password is required'),
});
