import { z } from 'zod';

export interface ContainerType {
	name: string;
	image: string;
	env: {
		key: string;
		value: string;
	}[];
	status: {
		ready: boolean;
		state: string;
		stateDetails: Record<string, unknown>;
		restartCount: number;
		message: string;
		reason: string;
	}[];
}

export const containerSchema = z.object({
	name: z
		.string()
		.min(1, 'Container name is required')
		.transform((value) => value.replace(/[^a-z0-9-]/g, '-')),
	image: z.string().min(1, 'Image name is required'),
	version: z.string().min(1, 'Version is required'),
});
