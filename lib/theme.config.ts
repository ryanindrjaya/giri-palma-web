import { inria } from "@/layout/dashboard.layout";
import { ThemeConfig } from "antd";

export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: "#9870b1",
    colorInfo: "#9870b1",
    colorError: "#ff8a8a",
    colorSuccess: "#97d895",
    ...inria.style,
  },
  components: {
    Button: {
      colorBgBase: "#9870b1",
    },
  },
};
