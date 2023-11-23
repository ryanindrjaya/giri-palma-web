import { themeConfig } from "@/lib/theme.config";
import "@/styles/globals.css";
import { ConfigProvider, notification } from "antd";
import type { AppProps } from "next/app";
import NextNProgress from "nextjs-progressbar";
import "dayjs/locale/id";
import dayjs from "dayjs";
import { colors } from "@/lib/constant/colors";

dayjs.locale("id");

export default function App({ Component, pageProps }: AppProps) {
  const [api, contextHolder] = notification.useNotification();

  return (
    <ConfigProvider theme={themeConfig}>
      {contextHolder}
      <NextNProgress color={colors.primary} />
      <Component {...pageProps} notificationApi={api} />
    </ConfigProvider>
  );
}
