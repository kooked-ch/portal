import { useState, useEffect } from 'react';

function useFetch(url: string) {
	const [data, setData] = useState<object | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<any | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch(url);
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				const result = await response.json();
				setData(result);
			} catch (error: any) {
				setError(error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [url]);

	return { data, loading, error };
}

export default useFetch;
