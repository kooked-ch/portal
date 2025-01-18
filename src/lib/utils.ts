import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const getRepository = async (url: string) => {
	if (!url) return null;

	try {
		const repoPath = url.replace('https://github.com/', '').replace(/\/$/, '');
		const headers = { Authorization: `token ${process.env.GITHUB_TOKEN}` };

		const [repo, release] = await Promise.all([
			fetch(`https://api.github.com/repos/${repoPath}`, { headers }).then((res) => (res.ok ? res.json() : null)),
			fetch(`https://api.github.com/repos/${repoPath}/releases/latest`, { headers })
				.then((res) => (res.ok ? res.json() : null))
				.catch(() => null),
		]);

		if (!repo || !repo.html_url || !repo.owner?.avatar_url) {
			console.warn(`Repository not found or incomplete: ${url}`);
			return null;
		}

		return {
			url: repo.html_url,
			image: repo.owner.avatar_url,
			version: release?.name || repo.default_branch,
		};
	} catch (error: any) {
		console.error(`Error fetching repository [${url}]:`, error.message);
		return null;
	}
};

export const generateRandomString = (length: number) => {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return result;
};
