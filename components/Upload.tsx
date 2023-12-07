import React from "react";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { message, Upload } from "antd";

const { Dragger } = Upload;

const props: UploadProps = {
  name: "file",
  multiple: true,
  action: "/api/noop",
  onDrop(e) {
    console.log("Dropped files", e.dataTransfer.files);
  },
};

type Props = {
  setFile: (file: any) => void;
  className?: string;
};

const FileUpload: React.FC<Props> = ({ setFile, className }) => (
  <Dragger
    {...props}
    className={className}
    onChange={(info) => {
      const { status } = info.file;
      if (status !== "uploading") {
        console.log(info.file, info.fileList);
      }
      if (status === "done") {
        const allFile = info.fileList.map((item) => item.originFileObj);
        setFile(allFile);
        message.success(`${info.file.name} file uploaded successfully.`);
      } else if (status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    }}
  >
    <p className="ant-upload-drag-icon">
      <InboxOutlined />
    </p>
    <p className="ant-upload-text">Klik atau drop file disini untuk diupload</p>
    <p className="ant-upload-hint">Anda dapat mengupload satu atau lebih file sekaligus</p>
  </Dragger>
);

export default FileUpload;
