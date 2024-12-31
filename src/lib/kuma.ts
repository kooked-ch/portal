import { DomainMonitorType } from '@/types/domain';
import { ErrorType } from '@/types/error';

let cachedToken: string | null = null;

async function validateToken(token: string): Promise<boolean> {
	try {
		const response = await fetch(`${process.env.KUMA_URL}/ping`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		return response.ok;
	} catch (error) {
		console.error('Error during token validation (ping):', error);
		return false;
	}
}

async function fetchNewToken(): Promise<string> {
	try {
		const response = await fetch(`${process.env.KUMA_URL}/login/access-token`, {
			method: 'POST',
			body: new URLSearchParams({
				username: process.env.KUMA_USER || '',
				password: process.env.KUMA_PASSWORD || '',
			}),
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		});

		if (!response.ok) {
			throw new Error(`Token request failed: ${response.status} - ${response.statusText}`);
		}

		const { access_token } = await response.json();
		cachedToken = access_token;

		return cachedToken as string;
	} catch (error) {
		console.error('Error fetching new token:', error);
		throw new Error('Unable to fetch a new token.');
	}
}

async function getToken(): Promise<string> {
	if (cachedToken) {
		const isValid = await validateToken(cachedToken);
		if (isValid) {
			return cachedToken;
		}
	}

	return await fetchNewToken();
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
	try {
		const token = await getToken();
		const response = await fetch(new URL(endpoint, process.env.KUMA_URL), {
			...options,
			headers: {
				Authorization: `Bearer ${token}`,
				...options.headers,
			},
		});

		if (!response.ok) {
			throw new Error(`API request failed: ${response.status} - ${response.statusText}`);
		}

		return await response.json();
	} catch (error) {
		console.error(`Error during API request to ${endpoint}:`, error);
		throw error;
	}
}

export async function getMonitors() {
	try {
		const data = await apiRequest<{ monitors: any[] }>('/monitors');
		return data.monitors;
	} catch (error) {
		console.error('Error fetching monitors:', error);
		return [];
	}
}

export async function getBeats(monitorId: number) {
	try {
		const data = await apiRequest<{ monitor_beats: any[] }>(`/monitors/${monitorId}/beats`);
		return data.monitor_beats;
	} catch (error) {
		console.error(`Error fetching beats for monitor ID ${monitorId}:`, error);
		return [];
	}
}

export async function getMonitor(url: string): Promise<DomainMonitorType | null> {
	try {
		const monitors = await getMonitors();
		const monitor = monitors.find((monitor) => monitor.url === `https://${url}`);

		if (!monitor) {
			console.warn(`Monitor not found for URL: ${url}`);
			return null;
		}

		const beats = await getBeats(monitor.id);

		const responseTimeHistory = beats.map((beat) => ({
			id: beat.id,
			time: new Date(new Date(beat.time).toLocaleString('en-US', { timeZone: 'Europe/Paris' })).toISOString(),
			value: beat.ping,
			status: beat.status === 2 ? 0 : beat.status,
		}));

		const latestBeat = beats[beats.length - 1];
		const responseTime = latestBeat ? latestBeat.ping : null;

		const totalPing = beats.reduce((sum, beat) => sum + beat.ping, 0);
		const averageReponseTime = beats.length > 0 ? Math.round(totalPing / beats.length) : 0;

		const uptime = (beats.filter((beat) => beat.status).length / beats.length) * 100;

		return {
			responseTime,
			averageReponseTime,
			uptime,
			responseTimeHistory,
		};
	} catch (error) {
		console.error(`Error fetching monitor data for URL ${url}:`, error);
		return null;
	}
}

export async function createMonitor(url: string): Promise<ErrorType> {
	try {
		const data = await apiRequest('/monitors', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				type: 'http',
				name: url,
				url: `https://${url}`,
				method: 'GET',
			}),
		});

		return {
			message: 'Monitor created',
			status: 201,
		};
	} catch (error) {
		console.error(`Error creating monitor for URL ${url}:`, error);
		return {
			message: 'An unexpected error occurred',
			status: 500,
		};
	}
}

export async function deleteMonitor(url: string): Promise<ErrorType> {
	try {
		const monitors = await getMonitors();
		const monitor = monitors.find((monitor) => monitor.url === `https://${url}`);

		if (!monitor) {
			console.warn(`Monitor not found for URL: ${url}`);
			return {
				message: 'Monitor not found',
				status: 404,
			};
		}

		await apiRequest(`/monitors/${monitor.id}`, {
			method: 'DELETE',
		});

		return {
			message: 'Monitor deleted',
			status: 200,
		};
	} catch (error) {
		console.error(`Error deleting monitor:`, error);
		return {
			message: 'An unexpected error occurred',
			status: 500,
		};
	}
}
