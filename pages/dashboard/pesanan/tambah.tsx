import ProdukSearch from "@/components/ProdukSearch";
import DashboardLayout from "@/layout/dashboard.layout";
import { getData } from "@/lib/fetcher/getData";
import { parseToOption } from "@/lib/helpers/parseToOption";
import { Pelanggan } from "@/types/pelanggan.type";
import { Pesanan, PesananDetail } from "@/types/pesanan.type";
import { Produk, ProdukDetail } from "@/types/produk.type";
import { Button, DatePicker, Form, Input, InputNumber, Select, Tooltip, Table, Modal } from "antd";
import { NotificationInstance } from "antd/es/notification/interface";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useState } from "react";
import { BiTrash } from "react-icons/bi";
import Cookies from "js-cookie";
import fetcher from "@/lib/axios";
import SkeletonTable from "@/components/SkeletonTable";
import { parseHarga } from "@/lib/helpers/parseNumber";
import { ExportOutlined } from "@ant-design/icons";
import useMutation from "@/hooks/useMutation";
import { useRouter } from "next/router";
import useQuery from "@/hooks/useQuery";
import { User } from "@/types/user.type";

type Props = {
  notificationApi: NotificationInstance;
};

interface ProductData extends Produk {
  detail_id?: string;
  quantity: number;
  subtotal: number;
  detail: ProdukDetail;
}

export default function EditPesanan({ notificationApi }: Props) {
  const [form] = Form.useForm();
  const router = useRouter();

  const { data: pelanggan, loading: loadingPelanggan } = useQuery<Pelanggan[]>("/api/admin/pelanggan");
  const { data: sales, loading: loadingSales } = useQuery<User[]>("/api/admin/user");
  const [products, setProducts] = useState<ProductData[]>([]);
  const [metodeBayar, setMetodeBayar] = useState<string>("tunai");
  const [pembayaranPerTermin, setPembayaranPerTermin] = useState<number>(0);

  const [createPesanan, { loading: loadingCreatePesanan }] = useMutation("/api/admin/pesanan", "post", {
    onSuccess(data: Pesanan) {
      notificationApi.success({
        message: "Berhasil membuat pesanan",
      });
      router.push(`/dashboard/pesanan/${data?.id}`);
    },
  });

  const getProduk = async (pesanan: PesananDetail, detailId: string) => {
    try {
      const jwt = Cookies.get("jwt");

      const res = await fetcher.get(`/api/admin/produk/${pesanan.produk.id}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      const item = {
        ...res.data.data,
        detail_id: detailId,
        quantity: pesanan.quantity,
        subtotal: pesanan.subtotal || 0,
        detail: pesanan.produk_detail,
      };

      setProducts([...products, item]);
    } catch (error) {
      console.error(error);
    }
  };

  const getLatestNomorPesanan = async () => {
    try {
      const jwt = Cookies.get("jwt");
      const res = await fetcher.get("/api/generate/sp", {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      const nomor = res.data?.data?.nomor;

      if (nomor) {
        form.setFieldsValue({ nomor_pesanan: nomor });
      }
    } catch (error) {
      console.error(error);
      notificationApi.error({
        message: "Terjadi kesalahan saat mengambil nomor pesanan",
      });
    }
  };

  useEffect(() => {
    getLatestNomorPesanan();
  }, []);

  const filterOption = (input: string, option?: { label: string; value: string }) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

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
      title: "Detail Produk",
      key: "tipe",
      render: (record) => {
        const options = record.produk_detail?.map((item: ProdukDetail) => ({
          label: `${item.tipe} (${item.ukuran})`,
          value: item.detail_id,
        }));
        return (
          <Select
            showSearch
            options={options}
            optionFilterProp="children"
            filterOption={filterOption}
            className="w-full"
            value={record?.detail?.detail_id}
            onChange={(value) => {
              const selectedDetail = record.produk_detail?.find((item: ProdukDetail) => item.detail_id === value);
              const newProducts = [...products];
              const index = newProducts.findIndex((item) => item.id === record.id);
              newProducts[index].detail = selectedDetail;
              newProducts[index].subtotal = selectedDetail?.harga || 0;
              setProducts(newProducts);
            }}
          />
        );
      },
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
              newProducts[index].quantity = value;

              const detail = newProducts[index].detail;

              const harga = detail?.harga || 0;
              const diskon1 = detail?.diskon1 || 0;
              const diskon2 = detail?.diskon2 || 0;

              const subtotal = harga - (harga * diskon1) / 100 - (harga * diskon2) / 100;

              newProducts[index].subtotal = subtotal * value;

              setProducts(newProducts);
            }}
            value={record.quantity}
            className="w-full"
          />
        );
      },
    },
    {
      title: "Harga",
      key: "harga",
      render: (record) => {
        return <span>Rp {parseHarga(record?.detail?.harga || 0)}</span>;
      },
    },
    {
      title: "Diskon 1",
      key: "diskon1",
      width: 70,
      render: (record) => {
        return <span>{record?.detail?.diskon1 || 0}%</span>;
      },
    },
    {
      title: "Diskon 2",
      key: "diskon2",
      width: 70,
      render: (record) => {
        return <span>{record?.detail?.diskon2 || 0}%</span>;
      },
    },
    {
      title: "Subtotal",
      key: "subtotal",
      render: (record) => {
        return <span>Rp {parseHarga(record?.subtotal || 0)}</span>;
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

  const onFinish = async (values: any) => {
    const body = {
      ...values,
      metode_bayar: metodeBayar,
      pembayaran_per_minggu: pembayaranPerTermin,
      created_at: values.created_at?.toISOString(),
      pesanan_detail: products.map((item) => ({
        diskon1: item.detail?.diskon1,
        diskon2: item.detail?.diskon2,
        produk_detail_id: item.detail?.detail_id,
        produk_id: item.id,
        quantity: item.quantity,
      })),
    };

    createPesanan(body).catch((err) => {
      console.error(err);
      notificationApi.error({
        message: "Terjadi kesalahan saat membuat pesanan",
        description: err?.response?.data?.message || "Tidak diketahui",
        placement: "topRight",
      });
    });
  };

  const getPembayaranPerTermin = () => {
    const total = products.reduce((acc, item) => acc + item.subtotal, 0);
    const uangMuka = form.getFieldValue("uang_muka") || 0;
    const tukarTambah = form.getFieldValue("uang_tukar_tambah") || 0;
    const sisaPembayaran = total - uangMuka - tukarTambah;

    const terminPembayaran = form.getFieldValue("termin_pembayaran") || 0;
    const rentangWaktuPembayaran = form.getFieldValue("rentang_waktu_pembayaran") || 0;

    if (rentangWaktuPembayaran === 0 || terminPembayaran === 0) return;

    const pembayaranPerTermin = sisaPembayaran / Math.floor(rentangWaktuPembayaran / terminPembayaran);

    setPembayaranPerTermin(pembayaranPerTermin);
  };

  const Footer = () => {
    const total = products.reduce((acc, item) => acc + item.subtotal, 0);

    return (
      <Table.Summary>
        <Table.Summary.Row key="summary-0">
          <Table.Summary.Cell index={0} align="center" colSpan={4}></Table.Summary.Cell>
          <Table.Summary.Cell index={1} colSpan={3} className="font-bold bg-primary text-white rounded-md">
            Total Nilai Pesanan
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2} colSpan={3} className="font-bold">
            <p className="m-0 px-2">Rp {parseHarga(total)}</p>
          </Table.Summary.Cell>
        </Table.Summary.Row>

        <div className="h-1" />

        <Table.Summary.Row key="summary-1">
          <Table.Summary.Cell index={0} align="center" colSpan={4}></Table.Summary.Cell>
          <Table.Summary.Cell index={1} colSpan={3} className="font-bold bg-primary text-white rounded-t-md">
            <span>Uang Muka</span>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2} colSpan={3} className="font-bold">
            <Form.Item name="uang_muka" className="m-0" noStyle>
              <InputNumber
                className="w-full flex-1"
                min={0}
                prefix="Rp"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => parseFloat(`${value}`.replace(/\Rp\s?|(,*)/g, "")) as 0}
                onFocus={(e) => e.target.select()}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Table.Summary.Cell>
        </Table.Summary.Row>
        <Table.Summary.Row>
          <Table.Summary.Cell index={0} align="center" colSpan={4}></Table.Summary.Cell>
          <Table.Summary.Cell
            index={1}
            colSpan={3}
            className="font-bold bg-primary cursor-pointer hover:bg-primary/80 transition-all duration-150 text-white rounded-b-md"
          >
            <span>Tukar Tambah</span>
            <ExportOutlined className="ml-2" />
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2} colSpan={3} className="font-bold">
            <Form.Item name="uang_tukar_tambah" className="m-0" noStyle>
              <InputNumber
                style={{ width: "100%" }}
                className="w-full text-end"
                min={0}
                prefix="Rp"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => parseFloat(`${value}`.replace(/\Rp\s?|(,*)/g, "")) as 0}
                onFocus={(e) => e.target.select()}
              />
            </Form.Item>
          </Table.Summary.Cell>
        </Table.Summary.Row>

        <div className="h-1" />

        <Table.Summary.Row>
          <Table.Summary.Cell index={0} align="center" colSpan={4}></Table.Summary.Cell>
          <Table.Summary.Cell index={1} colSpan={3} className="font-bold bg-primary text-white rounded-md">
            Metode Pembayaran
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2} colSpan={3} className="font-bold">
            <Select
              className="w-full"
              value={metodeBayar}
              onChange={(value) => {
                if (value !== "tempo") {
                  form.setFieldsValue({
                    termin_pembayaran: null,
                    rentang_waktu_pembayaran: null,
                  });
                  setPembayaranPerTermin(0);
                }

                setMetodeBayar(value);
              }}
            >
              <Select.Option value="tunai">Tunai</Select.Option>
              <Select.Option value="tunai leasing">Tunai Leasing</Select.Option>
              <Select.Option value="tempo">Tempo</Select.Option>
            </Select>
          </Table.Summary.Cell>
        </Table.Summary.Row>
        {metodeBayar === "tunai leasing" ? (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} align="center" colSpan={5}></Table.Summary.Cell>
            <Table.Summary.Cell index={1} colSpan={2} className="font-bold border border-primary">
              Nama Leasing
            </Table.Summary.Cell>
            <Table.Summary.Cell index={2} colSpan={3} className="font-bold">
              <Form.Item name="nama_leasing" className="m-0" noStyle>
                <Input className="w-full" />
              </Form.Item>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        ) : null}

        {metodeBayar === "tempo" ? (
          <>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} align="center" colSpan={5}></Table.Summary.Cell>
              <Table.Summary.Cell index={1} colSpan={2} className="font-bold border border-primary">
                Termin Pembayaran
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} colSpan={3} className="font-bold">
                <Form.Item name="termin_pembayaran" className="m-0" noStyle>
                  <Select className="w-full">
                    <Select.Option value={14} key={14}>
                      2 Minggu
                    </Select.Option>
                    <Select.Option value={30} key={30}>
                      1 Bulan
                    </Select.Option>
                  </Select>
                </Form.Item>
              </Table.Summary.Cell>
            </Table.Summary.Row>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} align="center" colSpan={5}></Table.Summary.Cell>
              <Table.Summary.Cell index={1} colSpan={2} className="font-bold border border-primary">
                Jangka Waktu Pembayaran
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} colSpan={3} className="font-bold">
                <Form.Item name="rentang_waktu_pembayaran" className="m-0" noStyle>
                  <Select className="w-full">
                    <Select.Option value={30} key={30}>
                      1 Bulan
                    </Select.Option>
                    <Select.Option value={90} key={90}>
                      3 Bulan
                    </Select.Option>
                    <Select.Option value={180} key={180}>
                      6 Bulan
                    </Select.Option>
                  </Select>
                </Form.Item>
              </Table.Summary.Cell>
            </Table.Summary.Row>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} align="center" colSpan={5}></Table.Summary.Cell>
              <Table.Summary.Cell index={1} colSpan={2} className="font-bold border border-primary">
                Pembayaran Per Termin
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} colSpan={3} className="font-bold">
                <p className="m-0 px-2">Rp {parseHarga(pembayaranPerTermin)}</p>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </>
        ) : null}
      </Table.Summary>
    );
  };

  const requiredRules = [{ required: true, message: "Wajib diisi" }];

  const onValuesChange = (changedValues: any, allValues: any) => {
    const uangMuka = allValues.uang_muka || 0;
    const tukarTambah = allValues.uang_tukar_tambah || 0;
    const total = products.reduce((acc, item) => acc + item.subtotal, 0);

    const sisaPembayaran = total - uangMuka - tukarTambah;

    if (metodeBayar === "tempo") {
      getPembayaranPerTermin();
    }

    form.setFieldsValue({ sisa_pembayaran: sisaPembayaran });
  };

  useEffect(() => {
    const values = form.getFieldsValue();

    onValuesChange({}, values);
  }, [products]);

  return (
    <DashboardLayout title="Tambah Pesanan">
      {loadingPelanggan || loadingSales ? (
        <SkeletonTable />
      ) : (
        <>
          <Form form={form} onFinish={onFinish} onValuesChange={onValuesChange} layout="vertical">
            <div className="mb-4">
              <p className="text-lg font-bold">Detail Pemesanan</p>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Form.Item initialValue={dayjs()} name="created_at" label="Tanggal Pemesanan" rules={requiredRules}>
                  <DatePicker className="w-full" format={"DD/MM/YYYY"} />
                </Form.Item>
                <Form.Item name="nomor_pesanan" label="Nomor Pesanan" rules={requiredRules}>
                  <Input readOnly className="w-full" />
                </Form.Item>
                <Form.Item name="user_id" label="Sales" rules={requiredRules}>
                  <Select
                    className="w-full"
                    filterOption={filterOption}
                    showSearch
                    options={parseToOption(sales || [], "id", "nama")}
                  />
                </Form.Item>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Form.Item name="pelanggan_id" label="Pelanggan" rules={requiredRules}>
                  <Select className="w-full" options={parseToOption(pelanggan || [], "id", "nama_merchant")} />
                </Form.Item>
                <Form.Item name="catatan" label="Catatan" className="col-span-2">
                  <Input.TextArea rows={3} className="w-full" />
                </Form.Item>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-lg font-bold">Detail Produk</p>
              <ProdukSearch
                onSelect={(value) => {
                  const detail = value.produk_detail?.[0];

                  const harga = detail?.harga || 0;
                  const diskon1 = detail?.diskon1 || 0;
                  const diskon2 = detail?.diskon2 || 0;

                  const subtotal = harga - (harga * diskon1) / 100 - (harga * diskon2) / 100;
                  const item = {
                    ...value,
                    quantity: 1,
                    subtotal: subtotal,
                    detail: value.produk_detail?.[0],
                  };
                  setProducts([...products, item]);
                }}
              />

              <Table
                pagination={false}
                size="small"
                className="mt-6"
                columns={columns}
                bordered
                dataSource={products}
                summary={Footer}
              />
            </div>

            <div className="w-full gap-4 flex justify-center mt-7">
              <Button
                loading={loadingCreatePesanan}
                size="large"
                className="flex-[0.25]"
                type="primary"
                htmlType="submit"
              >
                Buat Pesanan
              </Button>
            </div>
          </Form>
        </>
      )}
    </DashboardLayout>
  );
}
