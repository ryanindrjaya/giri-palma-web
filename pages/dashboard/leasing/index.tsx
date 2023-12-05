import useDebounce from "@/hooks/useDebounce";
import useMutation from "@/hooks/useMutation";
import useQuery from "@/hooks/useQuery";
import DashboardLayout from "@/layout/dashboard.layout";
import { LeasingType } from "@/types/leasing.type";
import { Button, Form, Input, Modal, Popconfirm, Table } from "antd";
import { NotificationInstance } from "antd/es/notification/interface";
import { ColumnsType } from "antd/es/table";
import React, { useState, useEffect } from "react";
import { AiOutlineEdit, AiOutlinePlus } from "react-icons/ai";
import { BsFillTrashFill } from "react-icons/bs";
import { GiSettingsKnobs } from "react-icons/gi";

type Props = {
  notificationApi: NotificationInstance;
};

export default function Leasing({ notificationApi }: Props) {
  const [form] = Form.useForm();
  const [searchVal, setSearchVal] = useState<string>("");
  const debouncedSearchVal = useDebounce(searchVal, 500);
  const [selectedRow, setSelectedRow] = useState<LeasingType[]>([]);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedData, setSelectedData] = useState<LeasingType | null>(null);

  const { data, loading, error, refetch } = useQuery<LeasingType[]>("/api/admin/leasing");
  const [editLeasing, { loading: loadingEdit }] = useMutation("/api/admin/leasing", "put", {
    onSuccess: () => {
      form.resetFields();
      setOpenModal(false);
      setSelectedData(null);
      notificationApi.success({
        message: "Berhasil",
        description: "Berhasil mengubah Leasing",
        placement: "topRight",
      });
      refetch();
    },
  });
  const [deleteLeasing, { loading: loadingDelete }] = useMutation("/api/admin/leasing", "delete");
  const [postLeasing, { loading: loadingPost }] = useMutation("/api/admin/leasing", "post", {
    onSuccess: () => {
      form.resetFields();
      setOpenModal(false);
      notificationApi.success({
        message: "Berhasil",
        description: "Berhasil menambahkan Leasing",
        placement: "topRight",
      });
      refetch();
    },
  });

  const handleBulkDelete = async () => {
    try {
      const promises = selectedRow.map((item) => deleteLeasing(undefined, item.id));
      const resolved = await Promise.all(promises);

      if (resolved.every((item) => item.status === 200)) {
        notificationApi.success({
          message: "Berhasil",
          description: "Berhasil menghapus Leasing",
          placement: "topRight",
        });
      }

      setSelectedRow([]);
      refetch();
    } catch (error: any) {
      console.log(error);
      notificationApi.error({
        message: "Gagal",
        description: error?.response?.data?.message || "Gagal menghapus Leasing",
        placement: "topRight",
      });
    }
  };

  const columns: ColumnsType<LeasingType> = [
    {
      key: "num",
      title: "#",
      width: 50,
      align: "center",
      render: (_v, _, index) => index + 1,
    },
    {
      key: "nama",
      title: "Nama",
      dataIndex: "nama",
    },
    {
      key: "kode",
      title: "Deskripsi",
      dataIndex: "deskripsi",
    },
    {
      key: "action",
      title: "Action",
      render: (_, item) => (
        <div className="flex justify-center items-center gap-2">
          <Button onClick={() => setSelectedData(item)} type="primary" className="flex p-1 justify-center items-center">
            <AiOutlineEdit size={18} />
          </Button>
        </div>
      ),
    },
  ];

  const handleCreate = async (values: any) => {
    postLeasing(values).catch((error) => {
      notificationApi.error({
        message: "Gagal menambahkan lokasi",
        description: error?.response?.data?.message || "Gagal menambahkan lokasi",
        placement: "topRight",
      });
    });
  };

  const handleEdit = async (values: any) => {
    editLeasing(values, selectedData?.id).catch((error) => {
      notificationApi.error({
        message: "Gagal mengubah lokasi",
        description: error?.response?.data?.message || "Gagal mengubah lokasi",
        placement: "topRight",
      });
    });
  };

  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: LeasingType[]) => {
      setSelectedRow(selectedRows);
    },
  };

  useEffect(() => {
    if (selectedData) {
      form.setFieldsValue({
        nama: selectedData.nama,
        deskripsi: selectedData.deskripsi,
      });
      setOpenModal(true);
    }
  }, [selectedData]);

  return (
    <>
      <Modal
        title={selectedData ? "Ubah Kategori" : "Tambah Kategori"}
        okText={selectedData ? "Ubah" : "Tambah"}
        cancelText="Batal"
        open={openModal}
        onOk={() => {
          form.validateFields().then((values) => {
            if (selectedData) {
              handleEdit(values);
            } else {
              handleCreate(values);
            }
          });
        }}
        okButtonProps={{ loading: loadingPost || loadingEdit }}
        onCancel={() => {
          form.resetFields();
          setOpenModal(false);
          setSelectedData(null);
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Nama" name="nama" rules={[{ required: true, message: "Nama harus diisi" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Deskripsi" name="deskripsi">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
      <DashboardLayout
        title="Daftar Leasing"
        isLoading={loading}
        header={
          <div className="w-full flex justify-between items-center">
            <div className="flex gap-2">
              <Input.Search onChange={(e) => setSearchVal(e.target.value)} placeholder="Cari leasing" />
              <Button className="px-2 flex items-center border border-gray-400 rounded-md bg-white cursor-pointer">
                <GiSettingsKnobs size={18} />
              </Button>
              <Popconfirm
                okText="Hapus"
                cancelText="Batal"
                title="Hapus leasing"
                okButtonProps={{ danger: true, loading: loadingDelete }}
                description="Apakah anda yakin ingin menghapus leasing yang dipilih?"
                onConfirm={handleBulkDelete}
              >
                <Button
                  danger
                  loading={loadingDelete}
                  disabled={loadingDelete}
                  className={`px-2 flex items-center border border-gray-400 transition-opacity duration-100 rounded-md bg-white cursor-pointer  ${
                    selectedRow.length > 0 ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                  } `}
                >
                  <BsFillTrashFill size={18} />
                </Button>
              </Popconfirm>
            </div>
            <Button
              onClick={() => {
                setOpenModal(true);
              }}
              type="primary"
              className="flex gap-2 items-center"
            >
              <div className="flex items-center gap-2">
                <AiOutlinePlus size={18} />
                <span>Tambah Leasing</span>
              </div>
            </Button>
          </div>
        }
      >
        <Table
          rowSelection={{
            type: "checkbox",
            ...rowSelection,
          }}
          rowKey={(record) => record.id}
          size="small"
          bordered
          columns={columns}
          dataSource={data || []}
        />
      </DashboardLayout>
    </>
  );
}
