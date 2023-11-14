import fetcher from "@/lib/axios";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";

interface QueryResult<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  refetch: (params?: any) => void;
}

interface ConfigQuery {
  params?: any;
}

function useQuery<T>(uri: string, config?: ConfigQuery): QueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  async function fetchData(params?: any) {
    setLoading(true);
    try {
      const jwt = Cookies.get("jwt");
      const response = await fetcher.get(uri, {
        params,
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      setData(response.data?.data as T);
    } catch (error: any) {
      setError(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [uri]);

  return { data, error, loading, refetch: fetchData };
}

export default useQuery;
