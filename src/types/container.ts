import { z } from 'zod';

export interface ContainerType {
	name: string;
	image: string;
	env: {
		name: string;
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
	logs: {
		podName: string;
		logs: string[] | null;
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
