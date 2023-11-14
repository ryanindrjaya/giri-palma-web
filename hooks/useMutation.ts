import { useState } from "react";
import { AxiosError, AxiosResponse } from "axios";
import fetcher from "@/lib/axios";
import Cookies from "js-cookie";

type HttpMethod = "post" | "put" | "delete";

type UseMutationResult<T> = [
  (body: any, id?: string) => Promise<AxiosResponse<T>>,
  {
    loading: boolean;
    error: AxiosError<T> | null;
  }
];

type Config<T, R> = {
  useFormData?: boolean;
  onSuccess?: (data: R) => void;
  onError?: (error: AxiosResponse<T>) => void;
};

function useMutation<T, R>(uri: string, method: HttpMethod, config?: Config<T, R>): UseMutationResult<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AxiosError<T> | null>(null);

  const mutate = async (body: any, id?: string): Promise<AxiosResponse<T>> => {
    setLoading(true);
    setError(null);
    try {
      const jwt = Cookies.get("jwt");

      if (method === "delete") {
        const response = await fetcher[method]<T>(`${uri}${id ? `/${id}` : ""}`, {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });

        if (response?.status === 200) {
          config?.onSuccess && config.onSuccess(response.data as unknown as R);
        }

        setLoading(false);
        return response;
      } else {
        const response = await fetcher[method]<T>(`${uri}${id ? `/${id}` : ""}`, body, {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });

        if (response?.status === 200) {
          config?.onSuccess && config.onSuccess(response.data as unknown as R);
        }

        setLoading(false);
        return response;
      }
    } catch (error: any) {
      setLoading(false);
      setError(error);

      throw error;
    }
  };

  return [mutate, { loading, error }];
}

export default useMutation;
