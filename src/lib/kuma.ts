import { DomainMonitorType } from '@/types/domain';

let cachedToken: string | null = null;
let tokenExpirationTime: number | null = null;

async function getToken(): Promise<string> {
	try {
		if (cachedToken && tokenExpirationTime && Date.now() < tokenExpirationTime) {
			return cachedToken;
		}

		const response = await fetch(new URL('/login/access-token', process.env.KUMA_URL), {
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
			throw new Error(`Error retrieving token: ${response.statusText}`);
		}

		const data = await response.json();
		cachedToken = data.access_token;

		tokenExpirationTime = Date.now() + 3600 * 100;

		return cachedToken as string;
	} catch (error: any) {
		console.error('Error retrieving token:', error);
		throw error;
	}
}

async function getMonitors() {
	try {
		const token = await getToken();
		const response = await fetch(new URL('/monitors', process.env.KUMA_URL), {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		const data = await response.json();
		console.log(data);
		return data.monitors;
	} catch (error: any) {
		console.error('Error getting monitors:', error);
		return [];
	}
}

async function getBeats(monitorId: number) {
	try {
		const token = await getToken();
		const response = await fetch(new URL(`/monitors/${monitorId}/beats`, process.env.KUMA_URL), {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		const data = await response.json();
		return data.monitor_beats;
	} catch (error: any) {
		console.error('Error getting beats:', error);
		return [];
	}
}

export async function getMonitor(url: string): Promise<DomainMonitorType | null> {
	try {
		const monitors = await getMonitors();
		const monitor = monitors.find((monitor: any) => monitor.url === 'https://' + url);

		if (!monitor) {
			return null;
		}

		const beats = await getBeats(monitor?.id);

		const latestBeat = beats[beats.length - 1];
		const responseTime = latestBeat ? latestBeat.ping : null;

		const totalPing = beats.reduce((sum: number, beat: any) => sum + beat.ping, 0);
		const averageReponseTime = beats.length > 0 ? totalPing / beats.length : null;

		const uptime = (beats.filter((beat: any) => beat.status).length / beats.length) * 100;

		const responseTimeHistory = beats.map((beat: any) => ({
			id: beat.id,
			time: beat.time,
			value: beat.ping,
			status: beat.status,
		}));

		return {
			responseTime,
			averageReponseTime: averageReponseTime ? Math.round(averageReponseTime) : 0,
			uptime,
			responseTimeHistory,
		};
	} catch (error: any) {
		console.error('Error getting monitor:', error);
		return null;
	}
}
