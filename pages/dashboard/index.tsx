import DashboardLayout, { inria } from "@/layout/dashboard.layout";
import { Result } from "antd";
import React from "react";

type Props = {};

export default function Dashboard({}: Props) {
  return (
    <DashboardLayout title="Dashboard">
      <Result
        className={inria.className}
        title="On Development"
        icon={<img src="/images/development.svg" alt="logo" width="350" height="350" />}
      />
    </DashboardLayout>
  );
}
