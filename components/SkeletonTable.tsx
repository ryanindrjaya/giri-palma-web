import { Skeleton } from "antd";
import React from "react";

type Props = {};

export default function SkeletonTable({}: Props) {
  return (
    <div>
      <Skeleton.Input block style={{ marginBottom: 10, height: 50 }} active={true} />
      <Skeleton.Input block style={{ marginBottom: 10, height: 400 }} active={true} />
    </div>
  );
}
