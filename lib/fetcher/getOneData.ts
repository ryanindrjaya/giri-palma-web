import Cookies from "js-cookie";
import fetcher from "../axios";

export async function getOneData<T>(url: string) {
  try {
    const jwt = Cookies.get("jwt");
    const res = await fetcher.get(url, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    const data = res?.data?.data as T;

    return data;
  } catch (error) {
    console.error(error);
  }
}
