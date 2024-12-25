import { useState, useEffect, useCallback } from 'react';

function useFetch(url: string) {
	const [data, setData] = useState<object | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<any | null>(null);
	const [reloadKey, setReloadKey] = useState(0);

	const fetchData = useCallback(async () => {
		setLoading(true);
		setError(null);
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
	}, [url]);

	useEffect(() => {
		fetchData();
	}, [fetchData, reloadKey]);

	const refetch = () => setReloadKey((prev) => prev + 1);

	return { data, loading, error, refetch };
}

export default useFetch;
