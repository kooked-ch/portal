import { z } from 'zod';

export interface VolumeType {
	name: string;
	mountPath: string;
	size: number;
	container: string;
}

export const volumeSchema = z.object({
	name: z
		.string()
		.min(1, 'Volume name is required')
		.transform((value) => value.replace(/[^a-z0-9-]/g, '-')),
	mountPath: z
		.string()
		.min(1, 'Mount Path is required')
		.refine((value) => value.startsWith('/') && !/[^a-z0-9-\/]/.test(value), {
			message: 'Invalid mount path format.',
		}),
	size: z.preprocess((value) => parseInt(value as string, 5), z.number().int().min(1, 'Mount Path required').max(5, 'Size must be less than 5')),
	container: z.string().min(1, 'Container name is required'),
});
