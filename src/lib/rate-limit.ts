import { LRUCache } from 'lru-cache';

type Options = {
	uniqueTokenPerInterval?: number;
	interval?: number;
};

export default function rateLimit(options?: Options) {
	const tokenCache = new LRUCache<string, number[]>({
		max: options?.uniqueTokenPerInterval || 500,
		ttl: options?.interval || 60000,
	});

	return {
		check: (limit: number, token: string) => {
			const tokenCount = tokenCache.get(token) || [0];
			if (tokenCount[0] === 0) {
				tokenCache.set(token, tokenCount);
			}
			tokenCount[0] += 1;
			const currentUsage = tokenCount[0];
			const isRateLimited = currentUsage > limit;
			return {
				isRateLimited,
				headers: {
					'X-RateLimit-Limit': limit.toString(),
					'X-RateLimit-Remaining': Math.max(limit - currentUsage, 0).toString(),
				},
			};
		},
	};
}
