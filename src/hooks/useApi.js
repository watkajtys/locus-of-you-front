
import { useState, useCallback } from 'react';

import { VITE_WORKER_API_URL } from '../lib/api';
import useStore from '../store/store';

const useApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const { session } = useStore();

  const callApi = useCallback(async (endpoint, method = 'POST', body = {}) => {
    setIsLoading(true);
    setError(null);
    setData(null);

    const VITE_WORKER_API_URL = import.meta.env.VITE_WORKER_API_URL;

    try {
      const response = await fetch(`${VITE_WORKER_API_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Request failed with status ${response.status}`);
      }

      const responseData = await response.json();
      setData(responseData.data);
      return { success: true, data: responseData.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  return { callApi, isLoading, error, data };
};

export default useApi;
