export interface ProjectsResourcesPolicy {
	name: string;
	description: string;
	totalLimit: number;
	remainingLimit: number;
}

export interface ProjectResourcesPolicy {
	name: string;
	description: string;
	totalLimit: number;
	remainingLimit: number;
}

export interface AppResourcesPolicy {
	containers: {
		name: string;
		description: string;
		totalLimit: number;
		remainingLimit: number;
	};
	databases: {
		name: string;
		description: string;
		totalLimit: number;
		remainingLimit: number;
	};
	domains: {
		name: string;
		description: string;
		totalLimit: number;
		remainingLimit: number;
	};
	volumes: {
		name: string;
		description: string;
		totalLimit: number;
		remainingLimit: number;
	};
}
