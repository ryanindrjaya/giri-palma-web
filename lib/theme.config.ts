import { inria } from "@/layout/dashboard.layout";
import { ThemeConfig } from "antd";

export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: "#13B1BC",
    colorInfo: "#13B1BC",
    colorError: "#ff8a8a",
    colorSuccess: "#97d895",
    ...inria.style,
  },
  components: {
    Button: {
      colorBgBase: "#13B1BC",
    },
  },
};
