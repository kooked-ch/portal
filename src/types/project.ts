import { z } from 'zod';

export interface ProjectType {
	id: string;
	name: string;
	description: string;
	slug: string;
}

export const projectSchema = z.object({
	name: z.string().min(3).max(255),
	description: z.string().min(3).max(255),
});
