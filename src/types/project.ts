import { z } from 'zod';
import { AppsType } from './app';
import { ProjectResourcesPolicy } from './resourcesPolicy';
import { ProjectAuthorizationsType } from './authorization';

export interface ProjectsType {
	name: string;
	description: string;
	slug: string;
	createdAt: Date;
	members: {
		username: string;
		image: string;
	}[];
}

export const projectSchema = z.object({
	name: z.string().min(3, 'Name must contain at least 3 characters').max(255, 'Name must contain at most 255 characters'),
	description: z.string().min(3, 'Description must contain at least 3 characters').max(255, 'Description must contain at most 255 characters'),
});

export interface ProjectType {
	name: string;
	description: string;
	slug: string;
	createdAt: Date;
	apps: AppsType[];
	resourcesPolicy: ProjectResourcesPolicy;
	authorizations: ProjectAuthorizationsType;
}
