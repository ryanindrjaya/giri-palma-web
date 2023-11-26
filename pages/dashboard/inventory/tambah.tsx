import ProdukSearch from "@/components/ProdukSearch";
import useMutation from "@/hooks/useMutation";
import useQuery from "@/hooks/useQuery";
import DashboardLayout from "@/layout/dashboard.layout";
import { parseToOption } from "@/lib/helpers/parseToOption";
import { CreateInventoryRequest, InventoryResponse } from "@/types/inventory.type";
import { LokasiProduk, Produk } from "@/types/produk.type";
import { Button, DatePicker, Form, Input, InputNumber, Popover, Select, Table, Tooltip } from "antd";
import { NotificationInstance } from "antd/es/notification/interface";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { BiTrash } from "react-icons/bi";

type Props = {
  notificationApi: NotificationInstance;
};

interface ProductData extends Produk {
  stok: number;
}

export default function TambahInventory({ notificationApi }: Props) {
  const [form] = Form.useForm();
  const router = useRouter();

  const { data: lokasi, loading: loadingLokasi } = useQuery<LokasiProduk[]>("/api/admin/lokasi-produk");
  const [products, setProducts] = useState<ProductData[]>([]);
  const [disabled, setDisabled] = useState<boolean>(true);

  const [createInventory, { loading: loadingCreate }] = useMutation<InventoryResponse, CreateInventoryRequest>(
    "/api/admin/inventory",
    "post"
  );

  const handleSubmit = (values: any) => {
    const lokasi = values.lokasi_id;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const payload = {
        produk_id: product.id,
        stok: product.stok,
        lokasi_id: lokasi,
      };

      createInventory(payload).then((data) => {
        if (i === products.length - 1) {
          notificationApi.success({
            message: "Berhasil",
            description: "Berhasil menambahkan inventory",
            placement: "topRight",
          });

          router.push("/dashboard/inventory");
        }
      });
    }
  };

  const requiredRules = [{ required: true, message: "Wajib diisi" }];

  const columns: ColumnsType<Produk> = [
    {
      title: "Kode Produk",
      dataIndex: "kode",
      key: "kode",
    },
    {
      title: "Nama Produk",
      dataIndex: "nama",
      key: "nama",
    },
    {
      title: "Kategori Produk",
      dataIndex: ["kategori_produk", "nama"],
      key: "kategori",
    },
    {
      title: "Kuantitas",
      key: "kuantitas",
      width: 100,
      render: (record) => {
        return (
          <InputNumber
            min={1}
            suffix="UNIT"
            onFocus={(e) => e.target.select()}
            onChange={(value) => {
              const newProducts = [...products];
              const index = newProducts.findIndex((item) => item.id === record.id);
              newProducts[index].stok = value;
              setProducts(newProducts);
            }}
            value={record.stok}
            className="w-full"
          />
        );
      },
    },

    {
      title: "Aksi",
      dataIndex: "id",
      key: "id",
      width: 100,
      align: "center",
      render: (id) => {
        return (
          <Tooltip title="Hapus produk">
            <Button
              danger
              type="primary"
              onClick={() => {
                const newProducts = [...products];
                const index = newProducts.findIndex((item) => item.id === id);
                newProducts.splice(index, 1);
                setProducts(newProducts);
              }}
            >
              <BiTrash size={18} />
            </Button>
          </Tooltip>
        );
      },
    },
  ];

  useEffect(() => {
    if (products.length > 0 && form.getFieldValue("lokasi_id")) {
      setDisabled(false);
    } else {
      setDisabled(true);
    }
  }, [products]);

  const onValueChange = (changedValue: any, allValues: any) => {
    console.log(changedValue, allValues);
    if (allValues.lokasi_id && products.length > 0) {
      setDisabled(false);
    } else {
      setDisabled(true);
    }
  };

  return (
    <DashboardLayout title="Tambah Inventory">
      <Form onValuesChange={onValueChange} form={form} layout="vertical" onFinish={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Form.Item rules={requiredRules} label="Nomor Persediaan">
            <Input />
          </Form.Item>
          <Form.Item rules={requiredRules} label="Lokasi Kerja" name="lokasi_id">
            <Select loading={loadingLokasi} options={parseToOption(lokasi || [], "id", "nama")} />
          </Form.Item>
          <Form.Item rules={requiredRules} initialValue={dayjs()} name="tanggal_dokumen" label="Tanggal Dokumen">
            <DatePicker className="w-full" />
          </Form.Item>
        </div>

        <ProdukSearch
          onSelect={(value) => {
            setProducts([...products, { ...value, stok: 1 }]);
          }}
        />

        <Table pagination={false} size="small" className="mt-6" columns={columns} bordered dataSource={products} />

        <Button loading={loadingCreate} disabled={disabled} htmlType="submit" type="primary" className="mt-6">
          Tambah Inventory
        </Button>
      </Form>
    </DashboardLayout>
  );
}
