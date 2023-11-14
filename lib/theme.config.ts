import { inria } from "@/layout/dashboard.layout";
import { ThemeConfig } from "antd";

export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: "#7cb4c3",
    colorInfo: "#7cb4c3",
    colorError: "#ff8a8a",
    colorSuccess: "#97d895",
    ...inria.style,
  },
  components: {
    Button: {
      colorBgBase: "#7cb4c3",
    },
  },
};
