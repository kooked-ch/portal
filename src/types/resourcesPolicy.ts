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

export interface ResourcesPolicyList {
	name: string;
	description: string;
	slug: string;
	accessLevel: number;
	limitation: {
		level: number;
		[key: string]: number;
	};
}

export interface AllProjectResourcesPolicy {
	name: string;
	slug: string;
	description: string;
	apps: {
		name: string;
		policy: AppResourcesPolicy;
	}[];
	resourcesPolicyList: ResourcesPolicyList[];
}

export interface AllResourcesPolicy {
	[key: string]: {
		name: string;
		description: string;
		policy: AppResourcesPolicy;
	};
}
