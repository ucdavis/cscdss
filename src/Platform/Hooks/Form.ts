import { useState } from 'react';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { serviceUrl } from '../App/components/Shared/config';

type MethodTypes = 'post' | 'put' | 'patch';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface SubmitFormHookProps {
  endpoint: string;
  method: MethodTypes;
}

export const useSubmitForm = <T>(apiDetails: SubmitFormHookProps) => {
  const { endpoint, method } = apiDetails;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: T): Promise<ApiResponse<T>> => {
    setLoading(true);
    setError(null);

    const baseUrl =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : process.env.REACT_APP_BE_URL;

    const url = serviceUrl + endpoint;

    console.log('Submitting to URL:', url);

    try {
      const response: AxiosResponse<T> = await axios({
        method,
        url,
        data
      });

      return { data: response.data };
    } catch (err) {
      console.error('API Error:', err);
      let errorMessage = 'An unknown error occurred';

      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ message?: string }>;
        errorMessage =
          axiosError.response?.data?.message ||
          axiosError.message ||
          errorMessage;
        console.error(
          'Full error details:',
          JSON.stringify(axiosError.toJSON(), null, 2)
        );
      }

      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { handleSubmit, loading, error };
};
