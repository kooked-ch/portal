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
