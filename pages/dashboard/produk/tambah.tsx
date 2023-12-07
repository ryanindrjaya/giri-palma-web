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
import FileUpload from "@/components/Upload";
import { IoIosCloseCircle } from "react-icons/io";
import { NotificationInstance } from "antd/es/notification/interface";

type Props = {
  notificationApi: NotificationInstance;
};

const UKURAN_OPTION: string[] = ["90x200", "100x200", "120x200", "160x200", "180x200", "200x200"];

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
  const [types, setTypes] = useState<string[]>([]);
  const [openDrawer, setOpenDrawer] = useState<{ [x: string]: boolean }>({});
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
  };

  const filterOption = (input: string, option?: { label: string; value: string }) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  const filteredUkuranOptions = UKURAN_OPTION.filter((o) => !ukuran.includes(o));

  const handleSubmit = async () => {
    const values = await form.validateFields();

    const produkDetail = types
      .map((type) => {
        const parse = type.toLowerCase().replace(" ", "_");
        const detail = form.getFieldValue(`detail_${parse}`) as CreateProdukDetail[];

        delete values[`detail_${parse}`];

        return detail;
      })
      .flat();

    const body = {
      ...values,
      produk_detail: produkDetail,
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
      <Form<CreateProdukRequest> form={form} layout="vertical">
        {types.map((tipe, idx) => (
          <Drawer
            key={`drawer-${idx}`}
            title={`Harga ${tipe}`}
            placement="right"
            open={openDrawer?.[tipe]}
            onClose={() => {
              setOpenDrawer({ ...openDrawer, [tipe]: false });
            }}
          >
            {ukuran.map((item, index) => (
              <div key={index} className="flex flex-col md:flex-row w-full items-center gap-4">
                <Form.Item hidden name={[`detail_${tipe.toLowerCase().replace(" ", "_")}`, index, "tipe"]}></Form.Item>
                <Form.Item
                  labelAlign="left"
                  label="Ukuran"
                  className="flex-1 "
                  initialValue={item}
                  name={[`detail_${tipe.toLowerCase().replace(" ", "_")}`, index, "ukuran"]}
                  rules={[{ required: true, message: "Ukuran produk harus diisi" }]}
                >
                  <Input disabled readOnly />
                </Form.Item>
                <Form.Item
                  className="flex-1 "
                  label="Harga"
                  name={[`detail_${tipe.toLowerCase().replace(" ", "_")}`, index, "harga"]}
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
            <Button
              type="primary"
              onClick={() => {
                setOpenDrawer({ ...openDrawer, [tipe]: false });
              }}
            >
              Simpan
            </Button>
          </Drawer>
        ))}
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
            mode="tags"
            value={ukuran}
            onChange={setUkuran}
            onSelect={(value) => {
              types.forEach((type) => {
                const parse = type.toLowerCase().replace(" ", "_");
                const detail = form.getFieldValue(`detail_${parse}`) as CreateProdukDetail[];
                const newDetail = [...detail, { ukuran: value, harga: undefined, tipe: type }];
                form.setFieldValue(`detail_${parse}`, newDetail);
              });
            }}
            onDeselect={(value) => {
              types.forEach((type) => {
                const parse = type.toLowerCase().replace(" ", "_");
                const detail = form.getFieldValue(`detail_${parse}`) as CreateProdukDetail[];
                const newDetail = detail.filter((item) => item.ukuran !== value);
                form.setFieldValue(`detail_${parse}`, newDetail);
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
          {types.map((item, index) => (
            <Button
              className="relative"
              key={`tipe-${index}`}
              // disabled={ukuran.length === 0}
              onClick={() => {
                setOpenDrawer({ ...openDrawer, [item]: true });
              }}
              type="default"
            >
              <span>Input Harga {item}</span>
              <span
                className="absolute h-5 text-red-500 -top-2 -right-2 text-lg cursor-pointer bg-white rounded-full"
                onClick={() => {
                  form.setFieldValue(`detail_${item.toLowerCase().replace(" ", "_")}`, []);

                  const newTypes = types.filter((type) => type !== item);
                  setTypes(newTypes);
                }}
              >
                <IoIosCloseCircle />
              </span>
            </Button>
          ))}
          <Input
            className="w-40"
            placeholder="Masukkan tipe baru"
            onFocus={(e) => e.target.select()}
            onKeyUp={(e) => {
              if (e.key === "Enter") {
                setTypes([...types, e.currentTarget.value]);
                setOpenDrawer({ ...openDrawer, [e.currentTarget.value]: false });

                const parse = e.currentTarget.value.toLowerCase().replace(" ", "_");

                form.setFieldValue(`detail_${parse}`, []);

                e.currentTarget.value = "";
              }
            }}
          />
          <span className="text-xs text-gray-400 pointer-events-none">Enter untuk menambahkan</span>
        </div>

        <div className="my-8">
          <FileUpload className="w-1/2" setFile={(allFiles) => setFiles(allFiles)} />
        </div>

        <Button size="large" type="primary" onClick={handleSubmit} loading={loading} disabled={loading}>
          Simpan Produk
        </Button>
      </Form>
    </DashboardLayout>
  );
}
