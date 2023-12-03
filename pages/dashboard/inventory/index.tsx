import ProdukModal from "@/components/ProdukModal";
import useMutation from "@/hooks/useMutation";
import useQuery from "@/hooks/useQuery";
import DashboardLayout from "@/layout/dashboard.layout";
import { parseToOption } from "@/lib/helpers/parseToOption";
import { Inventory } from "@/types/inventory.type";
import { LokasiProduk } from "@/types/produk.type";
import { Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Table } from "antd";
import { NotificationInstance } from "antd/es/notification/interface";
import { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { AiOutlineEdit, AiOutlinePlus } from "react-icons/ai";
import { BsFillTrashFill } from "react-icons/bs";
import { GiSettingsKnobs } from "react-icons/gi";

type Props = {
  notificationApi: NotificationInstance;
};

export default function Inventory({ notificationApi }: Props) {
  const router = useRouter();
  const [form] = Form.useForm();

  const { data: lokasi, loading: loadingLokasi } = useQuery<LokasiProduk[]>("/api/admin/lokasi-produk");
  const { data: produk, loading: loadingProduk } = useQuery<LokasiProduk[]>("/api/admin/produk");

  const { data, loading, refetch } = useQuery<Inventory[]>("/api/admin/inventory");
  const [deleteInventory, { loading: loadingDelete }] = useMutation("/api/admin/inventory", "delete");
  const [editInventory, { loading: loadingEdit }] = useMutation("/api/admin/inventory", "put", {
    onSuccess: () => {
      form.resetFields();
      setOpenModal(false);
      setSelectedData(null);
      notificationApi.success({
        message: "Berhasil",
        description: "Berhasil mengubah inventory",
        placement: "topRight",
      });
      refetch();
    },
  });

  const [searchVal, setSearchVal] = useState<string>("");
  const [produkId, setProdukId] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<Inventory[]>([]);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedData, setSelectedData] = useState<Inventory | null>(null);

  const columns: ColumnsType<Inventory> = [
    {
      title: "#",
      align: "center",
      width: 50,
      render: (text, record, index) => index + 1,
    },
    {
      title: "Produk",
      render: (text, record) => (
        <span
          className="text-blue-500 cursor-pointer hover:text-blue-400 transition-all duration-100"
          onClick={() => setProdukId(record.produk.id)}
        >
          {record.produk.nama}
        </span>
      ),
    },
    {
      title: "Lokasi",
      dataIndex: ["lokasi", "nama"],
    },
    {
      title: "Stok",
      render: (text, record) => <span>{record.stok} UNIT</span>,
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

  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: Inventory[]) => {
      setSelectedRow(selectedRows);
    },
  };

  const handleEdit = async (values: any) => {
    editInventory(values, selectedData?.id).catch((error) => {
      console.log(error);
      notificationApi.error({
        message: "Gagal mengubah inventory",
        description: error?.response?.data?.message || "Gagal mengubah inventory",
        placement: "topRight",
      });
    });
  };

  useEffect(() => {
    if (selectedData) {
      form.setFieldsValue({
        lokasi_id: selectedData.lokasi.id,
        produk_id: selectedData.produk.id,
        stok: selectedData.stok,
      });
      setOpenModal(true);
    }
  }, [selectedData]);

  const handleBulkDelete = async () => {
    try {
      const promises = selectedRow.map((item) => deleteInventory(undefined, item.id));
      const resolved = await Promise.all(promises);

      if (resolved.every((item) => item.status === 200)) {
        notificationApi.success({
          message: "Berhasil",
          description: "Berhasil menghapus inventory produk",
          placement: "topRight",
        });
      }

      setSelectedRow([]);
      refetch();
    } catch (error: any) {
      console.log(error);
      notificationApi.error({
        message: "Gagal",
        description: error?.response?.data?.message || "Gagal menghapus inventory produk",
        placement: "topRight",
      });
    }
  };

  const filterOption = (input: string, option?: { label: string; value: string }) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  return (
    <>
      <ProdukModal open={!!produkId} onClose={() => setProdukId(null)} produkId={produkId || ""} />

      <Modal
        okText="Ubah"
        cancelText="Batal"
        okButtonProps={{ loading: loadingEdit }}
        title="Edit Inventory"
        open={openModal}
        onOk={() => form.submit()}
        onCancel={() => setOpenModal(false)}
      >
        <Form form={form} onFinish={handleEdit} layout="vertical">
          <Form.Item label="Produk" name="produk_id" rules={[{ required: true, message: "Wajib diisi" }]}>
            <Select
              showSearch
              optionFilterProp="children"
              filterOption={filterOption}
              loading={loadingProduk}
              placeholder="Cari produk"
              options={parseToOption(produk || [], "id", "nama")}
            />
          </Form.Item>
          <Form.Item label="Lokasi" name="lokasi_id" rules={[{ required: true, message: "Wajib diisi" }]}>
            <Select
              showSearch
              optionFilterProp="children"
              filterOption={filterOption}
              loading={loadingLokasi}
              placeholder="Cari lokasi"
              options={parseToOption(lokasi || [], "id", "nama")}
            />
          </Form.Item>
          <Form.Item label="Stok" name="stok" rules={[{ required: true, message: "Wajib diisi" }]}>
            <InputNumber className="w-full" min={0} />
          </Form.Item>
        </Form>
      </Modal>
      <DashboardLayout
        isLoading={loading}
        title="Inventory"
        header={
          <div className="w-full flex justify-between items-center">
            <div className="flex gap-2">
              <Input.Search onChange={(e) => setSearchVal(e.target.value)} placeholder="Cari produk" />
              <Button className="px-2 flex items-center border border-gray-400 rounded-md bg-white cursor-pointer">
                <GiSettingsKnobs size={18} />
              </Button>
              <Popconfirm
                okText="Hapus"
                cancelText="Batal"
                title="Hapus lokasi produk"
                okButtonProps={{ danger: true, loading: loadingDelete }}
                description="Apakah anda yakin ingin menghapus lokasi produk yang dipilih?"
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
                router.push("/dashboard/inventory/tambah");
              }}
              type="primary"
              className="flex gap-2 items-center"
            >
              <div className="flex items-center gap-2">
                <AiOutlinePlus size={18} />
                <span>Tambah Inventory</span>
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
          size="small"
          bordered
          columns={columns}
          dataSource={data || []}
          rowKey="id"
          loading={loading}
        />
      </DashboardLayout>
    </>
  );
}
