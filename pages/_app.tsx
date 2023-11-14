import { themeConfig } from "@/lib/theme.config";
import "@/styles/globals.css";
import { ConfigProvider, notification } from "antd";
import type { AppProps } from "next/app";
import NextNProgress from "nextjs-progressbar";

export default function App({ Component, pageProps }: AppProps) {
  const [api, contextHolder] = notification.useNotification();

  return (
    <ConfigProvider theme={themeConfig}>
      {contextHolder}
      <NextNProgress color="#7cb4c3" />
      <Component {...pageProps} notificationApi={api} />;
    </ConfigProvider>
  );
}
