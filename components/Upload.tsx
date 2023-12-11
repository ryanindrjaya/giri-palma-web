import React from "react";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { message, Upload } from "antd";

const { Dragger } = Upload;

const props: UploadProps = {
  name: "file",
  action: "/api/noop",
  onDrop(e) {
    console.log("Dropped files", e.dataTransfer.files);
  },
};

type Props = {
  setFile: (file: any) => void;
  className?: string;
  multiple?: boolean;
};

const FileUpload: React.FC<Props> = ({ multiple = true, setFile, className }) => (
  <Dragger
    {...props}
    multiple={multiple}
    className={className}
    onChange={(info) => {
      const { status } = info.file;
      if (status !== "uploading") {
        console.log(info.file, info.fileList);
      }
      if (status === "done") {
        const allFile = info.fileList.map((item) => item.originFileObj);
        console.log(info.file.size);
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
    <p className="ant-upload-hint">
      {multiple
        ? "Anda dapat mengupload satu atau lebih file sekaligus"
        : "Anda hanya dapat mengupload 1 gambar dengan ukuran 350x200"}
    </p>
  </Dragger>
);

export default FileUpload;
