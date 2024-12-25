import { z } from 'zod';

export interface DomainType {
	url: string;
	port: number;
	container: string;
	monitor?: DomainMonitorType;
}

export interface DomainMonitorType {
	responseTime: number;
	averageReponseTime: number;
	uptime: number;
	responseTimeHistory: {
		id: number;
		time: string;
		value: number;
		status: boolean;
	}[];
}

export const domainSchema = z.object({
	url: z
		.string()
		.min(1, 'URL is required')
		.transform((value) => value.replace(/^(?:https?:\/\/)/, ''))
		.refine((value) => /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(value), {
			message: 'Invalid URL format.',
		}),
	port: z.preprocess((value) => parseInt(value as string, 10), z.number().int().min(1, 'Port must be a positive integer')),
	container: z.string().min(1, 'Container name is required'),
});
