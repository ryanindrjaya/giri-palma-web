import useDebounce from "@/hooks/useDebounce";
import useMutation from "@/hooks/useMutation";
import useQuery from "@/hooks/useQuery";
import DashboardLayout from "@/layout/dashboard.layout";
import { Role } from "@/types/login.type";
import { KategoriProduk } from "@/types/produk.type";
import { CheckOutlined } from "@ant-design/icons";
import { Button, Checkbox, Form, Input, Modal, Popconfirm, Table } from "antd";
import { NotificationInstance } from "antd/es/notification/interface";
import { ColumnsType } from "antd/es/table";
import React, { useState, useEffect } from "react";
import { AiOutlineEdit, AiOutlinePlus } from "react-icons/ai";
import { BsFillTrashFill } from "react-icons/bs";
import { GiSettingsKnobs } from "react-icons/gi";

type Props = {
  notificationApi: NotificationInstance;
};

export default function Role({ notificationApi }: Props) {
  const [form] = Form.useForm();
  const [searchVal, setSearchVal] = useState<string>("");
  const debouncedSearchVal = useDebounce(searchVal, 500);
  const [selectedRow, setSelectedRow] = useState<Role[]>([]);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedData, setSelectedData] = useState<Role | null>(null);

  const { data, loading, error, refetch } = useQuery<Role[]>("/api/admin/role");
  const [editKategori, { loading: loadingEdit }] = useMutation("/api/admin/role", "put", {
    onSuccess: () => {
      form.resetFields();
      setOpenModal(false);
      setSelectedData(null);
      notificationApi.success({
        message: "Berhasil",
        description: "Berhasil mengubah role pengguna",
        placement: "topRight",
      });
      refetch();
    },
  });
  const [deleteKategori, { loading: loadingDelete }] = useMutation("/api/admin/role", "delete");
  const [postKategori, { loading: loadingPost }] = useMutation("/api/admin/role", "post", {
    onSuccess: () => {
      form.resetFields();
      setOpenModal(false);
      notificationApi.success({
        message: "Berhasil",
        description: "Berhasil menambahkan role pengguna",
        placement: "topRight",
      });
      refetch();
    },
  });

  const handleBulkDelete = async () => {
    try {
      const promises = selectedRow.map((item) => deleteKategori(undefined, item.id));
      const resolved = await Promise.all(promises);

      if (resolved.every((item) => item.status === 200)) {
        notificationApi.success({
          message: "Berhasil",
          description: "Berhasil menghapus role pengguna",
          placement: "topRight",
        });
      }

      setSelectedRow([]);
      refetch();
    } catch (error: any) {
      console.log(error);
      notificationApi.error({
        message: "Gagal",
        description: error?.response?.data?.message || "Gagal menghapus role pengguna",
        placement: "topRight",
      });
    }
  };

  const columns: ColumnsType<Role> = [
    {
      key: "num",
      title: "#",
      width: 50,
      align: "center",
      render: (_v, _, index) => index + 1,
    },
    {
      title: "Nama",
      dataIndex: "nama",
    },
    {
      title: "Lokasi",
      align: "center",
      width: 50,
      render: (_, item) => (item.master_lokasi ? <CheckOutlined className="text-success" /> : ""),
    },
    {
      title: "Pengguna",
      align: "center",
      width: 50,
      render: (_, item) => (item.master_pengguna ? <CheckOutlined className="text-success" /> : ""),
    },
    {
      title: "Pelanggan",
      align: "center",
      width: 50,
      render: (_, item) => (item.master_pelanggan ? <CheckOutlined className="text-success" /> : ""),
    },
    {
      title: "Produk",
      align: "center",
      width: 50,
      render: (_, item) => (item.master_produk ? <CheckOutlined className="text-success" /> : ""),
    },
    {
      title: "Inventory",
      align: "center",
      width: 50,
      render: (_, item) => (item.inventory ? <CheckOutlined className="text-success" /> : ""),
    },
    {
      title: "Pesanan",
      align: "center",
      width: 50,
      render: (_, item) => (item.pesanan ? <CheckOutlined className="text-success" /> : ""),
    },
    {
      title: "Pembelian",
      align: "center",
      width: 50,
      render: (_, item) => (item.pembelian ? <CheckOutlined className="text-success" /> : ""),
    },
    {
      key: "action",
      title: "Action",
      align: "center",
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
    postKategori(values).catch((error) => {
      notificationApi.error({
        message: "Gagal menambahkan role",
        description: error?.response?.data?.message || "Gagal menambahkan role",
        placement: "topRight",
      });
    });
  };

  const handleEdit = async (values: any) => {
    editKategori(values, selectedData?.id).catch((error) => {
      notificationApi.error({
        message: "Gagal mengubah role",
        description: error?.response?.data?.message || "Gagal mengubah role",
        placement: "topRight",
      });
    });
  };

  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: Role[]) => {
      setSelectedRow(selectedRows);
    },
  };

  useEffect(() => {
    if (selectedData) {
      form.setFieldsValue({
        nama: selectedData.nama,
        master_lokasi: selectedData.master_lokasi,
        master_pengguna: selectedData.master_pengguna,
        master_pelanggan: selectedData.master_pelanggan,
        master_produk: selectedData.master_produk,
        inventory: selectedData.inventory,
        pesanan: selectedData.pesanan,
        pembelian: selectedData.pembelian,
      });
      setOpenModal(true);
    }
  }, [selectedData]);

  return (
    <>
      <Modal
        title={selectedData ? "Ubah Role" : "Tambah Role"}
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
          <div className="grid grid-cols-1 md:grid-cols-3">
            <Form.Item name="master_lokasi" valuePropName="checked" label="Lokasi" className="col-span-1">
              <Checkbox />
            </Form.Item>
            <Form.Item name="master_pengguna" valuePropName="checked" label="Pengguna" className="col-span-1">
              <Checkbox />
            </Form.Item>
            <Form.Item name="master_pelanggan" valuePropName="checked" label="Pelanggan" className="col-span-1">
              <Checkbox />
            </Form.Item>

            <Form.Item name="master_produk" valuePropName="checked" label="Produk" className="col-span-1">
              <Checkbox />
            </Form.Item>
            <Form.Item name="inventory" valuePropName="checked" label="Inventory" className="col-span-1">
              <Checkbox />
            </Form.Item>
            <Form.Item name="pesanan" valuePropName="checked" label="Pesanan" className="col-span-1">
              <Checkbox />
            </Form.Item>

            <Form.Item name="pembelian" valuePropName="checked" label="Pembelian" className="col-span-1">
              <Checkbox />
            </Form.Item>
          </div>
        </Form>
      </Modal>
      <DashboardLayout
        title="Role"
        isLoading={loading}
        header={
          <div className="w-full flex justify-between items-center">
            <div className="flex gap-2">
              <Input.Search onChange={(e) => setSearchVal(e.target.value)} placeholder="Cari kategori" />
              <Button className="px-2 flex items-center border border-gray-400 rounded-md bg-white cursor-pointer">
                <GiSettingsKnobs size={18} />
              </Button>
              <Popconfirm
                okText="Hapus"
                cancelText="Batal"
                title="Hapus role"
                okButtonProps={{ danger: true, loading: loadingDelete }}
                description="Apakah anda yakin ingin menghapus role yang dipilih?"
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
                <span>Tambah Role</span>
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
