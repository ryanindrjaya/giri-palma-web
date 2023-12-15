import fetcher from "../axios";

type OptionID = string;

export async function getData<T>(uri: OptionID, jwt: string): Promise<T[] | []> {
  console.log("jwt =>", jwt);
  try {
    const res = await fetcher.get(`/api/admin/${uri}`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    return res.data?.data;
  } catch (error: any) {
    console.error(error?.response?.data?.message);
    return [];
  }
}
