import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL as string;

const fetcher = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export default fetcher;
