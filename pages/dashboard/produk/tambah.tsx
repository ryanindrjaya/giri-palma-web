import useMutation from "@/hooks/useMutation";
import DashboardLayout from "@/layout/dashboard.layout";
import { CreateProdukDetail, CreateProdukRequest, KategoriProduk, LokasiProduk, Produk } from "@/types/produk.type";
import { Button, Drawer, Form, Input, InputNumber, Select, notification } from "antd";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import fetcher from "@/lib/axios";
import useQuery from "@/hooks/useQuery";
import { parseToOption } from "@/lib/helpers/parseToOption";
import { parseHarga } from "@/lib/helpers/parseNumber";
import { CheckCircleOutlined } from "@ant-design/icons";
import FileUpload from "@/components/Upload";
import { NotificationInstance } from "antd/es/notification/interface";

type Props = {
  notificationApi: NotificationInstance;
};

export const UKURAN_OPTION: string[] = ["90x200", "100x200", "120x200", "160x200", "180x200", "200x200"];

export default function TambahProduk({ notificationApi }: Props) {
  const router = useRouter();
  const [form] = Form.useForm<CreateProdukRequest>();
  const { data: produkKategori, loading: loadingKategori } = useQuery<KategoriProduk[]>("/api/admin/kategori");
  const { data: produkLokasi, loading: loadingLokasi } = useQuery<LokasiProduk[]>("/api/admin/lokasi-produk");
  const [createProduk, { loading, error }] = useMutation<CreateProdukRequest, Produk>("/api/admin/produk", "post", {
    onSuccess: async (data: any) => {
      const produk = data?.data as Produk;
      await uploadProdukImage(produk.id);

      notificationApi.success({
        message: "Berhasil Membuat Produk",
        description: "Mengarahkan ke halaman produk",
        placement: "topRight",
      });
      router.push("/dashboard/produk");

      form.resetFields();
    },
  });

  const [ukuran, setUkuran] = useState<string[]>([]);
  const [openFullset, setOpenFullset] = useState<boolean>(false);
  const [openMatras, setOpenMatras] = useState<boolean>(false);

  const [files, setFiles] = useState<File[]>([]);

  const isLoading = useMemo(() => {
    return loadingKategori || loadingLokasi;
  }, [loadingKategori, loadingLokasi]);

  const fetchLatestKode = async () => {
    const jwt = Cookies.get("jwt");
    const response = await fetcher.get("/api/admin/produk", {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    const data = response.data?.data;

    if (data) {
      const kodeNumber = data.length + 1;
      const kode = `KBD${kodeNumber.toString().padStart(3, "0")}`;
      form.setFieldValue("kode", kode);
    }
  };

  useEffect(() => {
    fetchLatestKode();
  }, []);

  const uploadProdukImage = async (id: string) => {
    const jwt = Cookies.get("jwt");
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    formData.append("produk_id", id);

    const resUpload = await fetcher
      .post(`/api/admin/upload/produk`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${jwt}`,
        },
      })
      .catch((error) => {
        console.log(error);
        notificationApi.error({
          message: "Gagal Upload Gambar",
          description: error?.response?.data?.message || "Terjadi kesalahan saat upload gambar",
          placement: "topRight",
        });
      });

    console.log(resUpload);
  };

  const filterOption = (input: string, option?: { label: string; value: string }) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  const filteredUkuranOptions = UKURAN_OPTION.filter((o) => !ukuran.includes(o));

  const handleSubmit = async (values: CreateProdukRequest) => {
    console.log(values);
    const body = {
      ...values,
      produk_detail: [...values.detail_fullset, ...values.detail_matras],
    };

    createProduk(body).catch((error: any) => {
      notificationApi.error({
        message: "Gagal Membuat Produk",
        description: error?.response?.data?.message || "Terjadi kesalahan saat membuat produk",
        placement: "topRight",
      });
    });
  };

  return (
    <DashboardLayout title="Tambah Produk" isLoading={isLoading}>
      <Form<CreateProdukRequest> form={form} layout="vertical" onFinish={handleSubmit}>
        <Drawer title="Harga Fullset" placement="right" open={openFullset} onClose={() => setOpenFullset(false)}>
          {ukuran.map((item, index) => (
            <div key={index} className="flex flex-col md:flex-row w-full items-center gap-4">
              <Form.Item hidden name={["detail_fullset", index, "tipe"]}></Form.Item>
              <Form.Item
                labelAlign="left"
                label="Ukuran"
                className="flex-1 "
                initialValue={item}
                name={["detail_fullset", index, "ukuran"]}
                rules={[{ required: true, message: "Ukuran produk harus diisi" }]}
              >
                <Input disabled readOnly />
              </Form.Item>
              <Form.Item
                className="flex-1 "
                label="Harga"
                name={["detail_fullset", index, "harga"]}
                rules={[{ required: true, message: "Harga ukuran produk harus diisi" }]}
              >
                <InputNumber
                  className="w-full"
                  prefix="Rp "
                  onFocus={(e) => e.target.select()}
                  formatter={(value) => parseHarga(value as string)}
                  parser={(value) => Number(value?.replace(/[^0-9]/g, "") || 0)}
                />
              </Form.Item>
            </div>
          ))}
          <Button type="primary" onClick={() => setOpenFullset(false)}>
            Simpan
          </Button>
        </Drawer>
        <Drawer title="Harga Matras Only" placement="right" open={openMatras} onClose={() => setOpenMatras(false)}>
          {ukuran.map((item, index) => (
            <div key={index} className="flex flex-col md:flex-row w-full items-center gap-4">
              <Form.Item hidden name={["detail_matras", index, "tipe"]}></Form.Item>
              <Form.Item
                labelAlign="left"
                label="Ukuran"
                className="flex-1 "
                name={["detail_matras", index, "ukuran"]}
                initialValue={item}
                rules={[{ required: true, message: "Ukuran produk harus diisi" }]}
              >
                <Input disabled readOnly />
              </Form.Item>
              <Form.Item
                className="flex-1 "
                label="Harga"
                name={["detail_matras", index, "harga"]}
                rules={[{ required: true, message: "Harga ukuran produk harus diisi" }]}
              >
                <InputNumber
                  className="w-full"
                  prefix="Rp "
                  onFocus={(e) => e.target.select()}
                  formatter={(value) => parseHarga(value as string)}
                  parser={(value) => Number(value?.replace(/[^0-9]/g, "") || 0)}
                />
              </Form.Item>
            </div>
          ))}
          <Button type="primary" onClick={() => setOpenMatras(false)}>
            Simpan
          </Button>
        </Drawer>
        <div className="flex flex-col md:flex-row w-full gap-4">
          <Form.Item
            label="Nama"
            className="flex-1 md:flex-[0.8]"
            name="nama"
            rules={[{ required: true, message: "Nama produk harus diisi" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            className="flex-1 md:flex-[0.2]"
            label="Kode"
            name="kode"
            rules={[{ required: true, message: "Kode produk harus diisi" }]}
          >
            <Input readOnly />
          </Form.Item>
        </div>
        <div className="flex flex-col md:flex-row w-full gap-4">
          <Form.Item
            label="Lokasi"
            name="lokasi_produk_id"
            className="flex-1 md:flex-[0.5]"
            rules={[{ required: true, message: "Lokasi produk harus diisi" }]}
          >
            <Select
              showSearch
              placeholder="Pilih lokasi produk"
              optionFilterProp="children"
              filterOption={filterOption}
              options={parseToOption(produkLokasi || [], "id", "nama")}
            />
          </Form.Item>
          <Form.Item
            label="Kategori"
            name="kategori_produk_id"
            className="flex-1 md:flex-[0.5]"
            rules={[{ required: true, message: "Kategori produk harus diisi" }]}
          >
            <Select
              showSearch
              placeholder="Pilih kategori produk"
              optionFilterProp="children"
              filterOption={filterOption}
              options={parseToOption(produkKategori || [], "id", "nama")}
            />
          </Form.Item>
        </div>

        <Form.Item rules={[{ required: true, message: "Ukuran produk harus diisi" }]} label="Ukuran Tersedia">
          <Select
            mode="multiple"
            value={ukuran}
            onChange={setUkuran}
            onSelect={(value) => {
              const detailFullset = (form?.getFieldValue("detail_fullset") || []) as CreateProdukDetail[];
              const detailMatras = (form?.getFieldValue("detail_matras") || []) as CreateProdukDetail[];

              const newDetailFullset = [...detailFullset, { tipe: "Fullset", ukuran: value, harga: undefined }];
              const newDetailMatras = [...detailMatras, { tipe: "Matras Only", ukuran: value, harga: undefined }];

              console.log({
                detail_fullset: newDetailFullset,
                detail_matras: newDetailMatras,
              });

              form.setFieldsValue({
                detail_fullset: newDetailFullset,
                detail_matras: newDetailMatras,
              });
            }}
            onDeselect={(value) => {
              console.log("deselect", value);
              const detailFullset = form.getFieldValue("detail_fullset") as CreateProdukDetail[];
              const detailMatras = form.getFieldValue("detail_matras") as CreateProdukDetail[];

              const filteredDetailFullset = detailFullset.filter((item) => item.ukuran !== value);
              const filteredDetailMatras = detailMatras.filter((item) => item.ukuran !== value);

              console.log({
                detail_fullset: filteredDetailFullset,
                detail_matras: filteredDetailMatras,
              });

              form.setFieldsValue({
                detail_fullset: filteredDetailFullset,
                detail_matras: filteredDetailMatras,
              });
            }}
            className="w-full"
            options={filteredUkuranOptions.map((item) => ({
              value: item,
              label: item,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Deskripsi"
          name="deskripsi"
          rules={[{ required: true, message: "Deskripsi produk harus diisi" }]}
        >
          <Input.TextArea />
        </Form.Item>

        <div className="flex gap-3">
          <Button disabled={ukuran.length === 0} onClick={() => setOpenFullset(true)} type="default">
            <span>Input Harga Fullset</span>
            {(form?.getFieldValue("detail_fullset") || []).every((item: CreateProdukDetail) =>
              item?.harga ? item.harga > 0 : false
            ) ? (
              <CheckCircleOutlined style={{ color: "#97d895" }} className="text-success" />
            ) : null}
          </Button>
          <Button onClick={() => setOpenMatras(true)} disabled={ukuran.length === 0} type="default">
            <span>Input Harga Matras</span>
            {(form?.getFieldValue("detail_matras") || []).every((item: CreateProdukDetail) =>
              item?.harga ? item.harga > 0 : false
            ) ? (
              <CheckCircleOutlined style={{ color: "#97d895" }} className="text-success" />
            ) : null}
          </Button>
        </div>

        <div className="my-8">
          <FileUpload setFile={(allFiles) => setFiles(allFiles)} />
        </div>

        <Button size="large" type="primary" htmlType="submit" loading={loading} disabled={loading}>
          Simpan Produk
        </Button>
      </Form>
    </DashboardLayout>
  );
}
