import DashboardLayout from "@/layout/dashboard.layout";
import fetcher from "@/lib/axios";
import { CreatePembelian, CreatePembelianDetail } from "@/types/pembelian.type";
import { Button, DatePicker, Form, Input, InputNumber, Select, Skeleton, Table } from "antd";
import { NotificationInstance } from "antd/es/notification/interface";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { Pesanan } from "@/types/pesanan.type";
import useQuery from "@/hooks/useQuery";
import SkeletonTable from "@/components/SkeletonTable";
import { parseToOption } from "@/lib/helpers/parseToOption";
import { Pelanggan } from "@/types/pelanggan.type";
import { User } from "@/types/login.type";
import { ColumnsType } from "antd/es/table";
import useMutation from "@/hooks/useMutation";
import { FaRegEdit } from "react-icons/fa";
import dayjs from "dayjs";
import { parseHarga } from "@/lib/helpers/parseNumber";
import { capitalize } from "@/lib/helpers/capitalize";
type Props = {
  notificationApi: NotificationInstance;
};

type Summary = {
  total: number;
  uang_muka: number;
  harga_tukar_tambah: number;
  sisa_pembayaran: number;
  metode_pembayaran: string;
  nama_leasing?: string;
  rentang_pembayaran?: number;
  termin_pembayaran?: number;
  pembayaran_per_minggu?: number;
};

export default function TambahPO({ notificationApi }: Props) {
  const router = useRouter();
  const [form] = Form.useForm<CreatePembelian>();
  const [isFullfilled, setIsFullfilled] = useState<boolean>(false);
  const { data: pesanan, loading: loadingPesanan } = useQuery<Pesanan[]>("/api/admin/pesanan?paired=false", {
    params: {
      is_paired: false,
    },
  });
  const { data: pelanggan, loading: loadingPelanggan } = useQuery<Pelanggan[]>("/api/admin/pelanggan");
  const { data: user, loading: loadingUser } = useQuery<User[]>("/api/admin/user");

  const [summary, setSummary] = useState<Summary>({
    total: 0,
    uang_muka: 0,
    harga_tukar_tambah: 0,
    sisa_pembayaran: 0,
    metode_pembayaran: "",
    nama_leasing: "",
    rentang_pembayaran: 0,
    termin_pembayaran: 0,
    pembayaran_per_minggu: 0,
  });

  const [createPO, { loading: loadingCreate }] = useMutation<CreatePembelian, any>("/api/admin/pembelian", "post", {
    onSuccess: (data) => {
      setIsFullfilled(false);
      notificationApi.success({
        message: "Berhasil membuat pembelian",
        description: "Mengarahkan ke halaman pembelian",
      });

      const timeout = setTimeout(() => {
        router.push(`/dashboard/purchase-order`);
      }, 1000);

      return () => clearTimeout(timeout);
    },
  });

  const [loading, setLoading] = useState<boolean>(false);

  const fetchPesananDetail = async (id: string) => {
    setLoading(true);
    try {
      const jwt = Cookies.get("jwt");
      const res = await fetcher.get(`/api/admin/pesanan/${id}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      const data = res?.data?.data as Pesanan;

      if (data) {
        const pembelianDetail: CreatePembelianDetail[] = [];

        data.pesanan_detail?.forEach((item) => {
          let subtotal = item.quantity * (item.produk_detail?.harga || 0);

          if (item.diskon1 > 0) {
            subtotal = subtotal * ((100 - item.diskon1) / 100);
          }

          if (item.diskon2 > 0) {
            subtotal = subtotal * ((100 - item.diskon2) / 100);
          }

          pembelianDetail.push({
            produk: item.produk,
            produk_detail: item.produk_detail,
            produk_id: item.produk?.id,
            produk_detail_id: item.produk_detail?.detail_id,
            quantity: item.quantity,
            immutable_quantity: item.quantity,
            diskon1: item.diskon1,
            diskon2: item.diskon2,
            subtotal: Math.round(subtotal),
          });
        });

        const total = pembelianDetail.reduce((acc, item) => acc + (item?.subtotal || 0), 0);

        setSummary({
          total,
          uang_muka: data?.uang_muka || 0,
          harga_tukar_tambah: data?.uang_tukar_tambah || 0,
          sisa_pembayaran: total - (data?.uang_muka || 0) - (data?.uang_tukar_tambah || 0),
          metode_pembayaran: data?.metode_bayar || "",
          nama_leasing: data?.nama_leasing || "",
          rentang_pembayaran: data?.rentang_waktu_pembayaran || 0,
          termin_pembayaran: data?.termin_pembayaran || 0,
          pembayaran_per_minggu: data?.pembayaran_per_minggu || 0,
        });

        const setFieldPesanan: CreatePembelian = {
          pesanan_id: data.id,
          pelanggan_id: data.pelanggan?.id,
          user_id: data.user?.id,
          pembelian_detail: pembelianDetail,
          catatan: data.catatan,
          status: data.status,
          status_pembayaran: data.status_pembayaran,
        };

        if (data?.id && data?.pelanggan?.id && data?.user?.id && pembelianDetail?.length > 0) {
          setIsFullfilled(true);
        }

        form.setFieldsValue(setFieldPesanan);
      } else {
        notificationApi.error({
          message: "Data pesanan tidak ditemukan",
          description: "Data pesanan tidak ditemukan, silahkan coba lagi",
        });
      }
    } catch (error: any) {
      notificationApi.error({
        message: "Gagal mengambil data pesanan",
        description: error?.response?.data?.message || "Terjadi kesalahan saat mengambil data pesanan",
      });
    } finally {
      setLoading(false);
    }
  };

  const getNomorPembelian = useCallback(async () => {
    const jwt = Cookies.get("jwt");
    const response = await fetcher.get("/api/generate/po", {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    const noPo = response.data?.data?.nomor;

    if (noPo) {
      form.setFieldValue("nomor_pembelian", noPo);
    }
  }, []);

  useEffect(() => {
    if (router.query?.ref) {
      fetchPesananDetail(router.query.ref as string);
    }
  }, [router.query]);

  useEffect(() => {
    getNomorPembelian();
  }, []);

  const handleCreatePO = async (values: CreatePembelian) => {
    const detail = values?.pembelian_detail.map(({ produk, produk_detail, subtotal, immutable_quantity, ...rest }) => ({
      ...rest,
    }));

    const _userStr = localStorage.getItem("user");
    const user = JSON.parse(_userStr || "{}") as User;

    const body = {
      ...values,
      admin_id: user.id,
      pembelian_detail: detail,
    };

    createPO(body).catch((error: any) => {
      notificationApi.error({
        message: "Gagal membuat pembelian",
        description: error?.response?.data?.message || "Terjadi kesalahan saat membuat pembelian",
      });
    });
  };

  const isLoading = useMemo(() => {
    return loadingPesanan || loadingPelanggan || loadingUser;
  }, [loadingPesanan, loadingPelanggan, loadingUser]);

  const filterOption = (input: string, option?: { label: string; value: string }) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  const requiredRule = [{ required: true, message: "Field ini wajib diisi" }];

  const columns: ColumnsType<CreatePembelianDetail> = [
    {
      title: "No",
      key: "index",
      render: (_v, _item, index) => index + 1,
      align: "center",
    },
    {
      title: "Nama Produk",
      key: "produk",
      render: (_v, item, index) => (
        <>
          <Form.Item noStyle hidden name={["pembelian_detail", index, "produk_id"]} initialValue={item.produk_id} />
          <Form.Item noStyle hidden name={["pembelian_detail", index, "produk"]} initialValue={item.produk} />
          <Form.Item
            noStyle
            hidden
            name={["pembelian_detail", index, "produk_detail_id"]}
            initialValue={item.produk_detail_id}
          />
          <Form.Item
            noStyle
            hidden
            name={["pembelian_detail", index, "produk_detail"]}
            initialValue={item.produk_detail}
          />
          <span>{item.produk?.nama}</span>
        </>
      ),
    },
    {
      title: "Tipe & Ukuran",
      key: "detail_produk",
      render: (_v, item) => `${item.produk_detail?.tipe} (${item.produk_detail?.ukuran})`,
    },
    {
      title: "Harga Jual",
      key: "harga_jual",
      render: (_v, item) => `Rp ${parseHarga(item.produk_detail?.harga || 0)}`,
    },
    {
      key: "diskon1",
      title: "Diskon 1",
      render: (_v, item, index) => (
        <Form.Item noStyle name={["pembelian_detail", index, "diskon1"]} initialValue={item.diskon1}>
          <InputNumber
            className="w-full"
            onFocus={(e) => e.target.select()}
            onChange={(value) => {
              item.diskon1 = value || 0;
            }}
            min={0}
            max={100}
            suffix="%"
          />
        </Form.Item>
      ),
    },
    {
      key: "diskon2",
      title: "Diskon 2",
      render: (_v, item, index) => (
        <Form.Item noStyle name={["pembelian_detail", index, "diskon2"]} initialValue={item.diskon2}>
          <InputNumber
            className="w-full"
            onFocus={(e) => e.target.select()}
            onChange={(value) => {
              item.diskon2 = value || 0;
            }}
            min={0}
            max={100}
            suffix="%"
          />
        </Form.Item>
      ),
    },
    {
      title: "Jumlah",
      render: (_v, item, index) => {
        return (
          <>
            <Form.Item
              noStyle
              hidden
              name={["pembelian_detail", index, "immutable_quantity"]}
              initialValue={item.quantity}
            />
            <Form.Item noStyle name={["pembelian_detail", index, "quantity"]} initialValue={item.quantity}>
              <InputNumber
                className="w-full"
                onFocus={(e) => e.target.select()}
                min={0}
                max={item.immutable_quantity}
              />
            </Form.Item>
          </>
        );
      },
      key: "jumlah",
    },

    {
      key: "subtotal",
      title: "Subtotal",
      render: (_v, item, index) => {
        return (
          <Form.Item noStyle name={["pembelian_detail", index, "subtotal"]}>
            <InputNumber
              className="w-full"
              min={0}
              readOnly
              formatter={(value) => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            />
          </Form.Item>
        );
      },
    },
  ];

  const handleValueChange = (_: any, allValues: any) => {
    const detail = allValues.pembelian_detail || [];

    const newDetail = detail.map((item: any) => {
      let subtotal = item.quantity * (item.produk_detail?.harga || 0);

      if (item.diskon1 > 0) {
        subtotal = subtotal * ((100 - item.diskon1) / 100);
      }

      if (item.diskon2 > 0) {
        subtotal = subtotal * ((100 - item.diskon2) / 100);
      }
      item.subtotal = Math.round(subtotal);
      return item;
    });

    const total = newDetail.reduce((acc: number, item: any) => acc + (item?.subtotal || 0), 0);

    setSummary({
      ...summary,
      total,
      sisa_pembayaran: total - (summary?.uang_muka || 0) - (summary?.harga_tukar_tambah || 0),
    });

    form.setFieldsValue({
      pembelian_detail: newDetail,
    });

    if (newDetail?.length === 0) {
      setIsFullfilled(false);
      return;
    }

    const isQuantityZero = detail?.some((item: any) => item.quantity === 0);

    if (isQuantityZero) {
      setIsFullfilled(false);
      return;
    }

    if (allValues.pesanan_id && allValues.pelanggan_id && allValues.user_id) {
      setIsFullfilled(true);
    } else {
      setIsFullfilled(false);
    }
  };

  const fieldDetail = form.getFieldValue("pembelian_detail") || [];

  const Footer = () => {
    return (
      <>
        <Table.Summary.Row>
          <Table.Summary.Cell index={0} align="center" colSpan={5}></Table.Summary.Cell>
          <Table.Summary.Cell index={1} colSpan={2} className="font-bold bg-primary text-white rounded-md">
            Total Nilai Pesanan
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2} className="font-bold">
            {`Rp ${parseHarga(summary?.total || 0)}`}
          </Table.Summary.Cell>
        </Table.Summary.Row>

        <div className="h-1" />

        <Table.Summary.Row>
          <Table.Summary.Cell index={0} align="center" colSpan={5}></Table.Summary.Cell>
          <Table.Summary.Cell index={1} colSpan={2} className="font-bold bg-primary text-white rounded-t-md">
            Uang Muka
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2} className="font-bold">
            {`Rp ${parseHarga(summary?.uang_muka || 0)}`}
          </Table.Summary.Cell>
        </Table.Summary.Row>
        <Table.Summary.Row>
          <Table.Summary.Cell index={0} align="center" colSpan={5}></Table.Summary.Cell>
          <Table.Summary.Cell index={1} colSpan={2} className="font-bold bg-primary text-white rounded-b-md">
            Tukar Tambah
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2} className="font-bold">
            {`Rp ${parseHarga(summary?.harga_tukar_tambah || 0)}`}
          </Table.Summary.Cell>
        </Table.Summary.Row>

        <div className="h-1" />

        <Table.Summary.Row>
          <Table.Summary.Cell index={0} align="center" colSpan={5}></Table.Summary.Cell>
          <Table.Summary.Cell index={1} colSpan={2} className="font-bold bg-primary text-white rounded-md">
            Sisa Pembayaran
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2} className="font-bold">
            {`Rp ${summary?.sisa_pembayaran >= 0 ? parseHarga(summary?.sisa_pembayaran) : 0}`}
          </Table.Summary.Cell>
        </Table.Summary.Row>

        <div className="h-1" />

        <Table.Summary.Row>
          <Table.Summary.Cell index={0} align="center" colSpan={5}></Table.Summary.Cell>
          <Table.Summary.Cell index={1} colSpan={2} className="font-bold bg-primary text-white rounded-md">
            Metode Pembayaran
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2} className="font-bold">
            {capitalize(summary?.metode_pembayaran || "", " ")}
          </Table.Summary.Cell>
        </Table.Summary.Row>
        {summary?.metode_pembayaran === "tunai leasing" ? (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} align="center" colSpan={6}></Table.Summary.Cell>
            <Table.Summary.Cell index={1} className="font-bold border border-primary">
              Nama Leasing
            </Table.Summary.Cell>
            <Table.Summary.Cell index={2} className="font-bold">
              {summary?.nama_leasing}
            </Table.Summary.Cell>
          </Table.Summary.Row>
        ) : null}

        {summary?.metode_pembayaran === "tempo" ? (
          <>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} align="center" colSpan={6}></Table.Summary.Cell>
              <Table.Summary.Cell index={1} className="font-bold border border-primary">
                Termin Pembayaran
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} className="font-bold">
                {(summary?.termin_pembayaran || 1) / 7} Minggu
              </Table.Summary.Cell>
            </Table.Summary.Row>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} align="center" colSpan={6}></Table.Summary.Cell>
              <Table.Summary.Cell index={1} className="font-bold border border-primary">
                Jangka Waktu Pembayaran
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} className="font-bold">
                {(summary?.rentang_pembayaran || 1) / 30} Bulan
              </Table.Summary.Cell>
            </Table.Summary.Row>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} align="center" colSpan={6}></Table.Summary.Cell>
              <Table.Summary.Cell index={1} className="font-bold border border-primary">
                Pembayaran Per Termin
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} className="font-bold">
                Rp {parseHarga(summary?.pembayaran_per_minggu || 0)}
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </>
        ) : null}
      </>
    );
  };

  return (
    <DashboardLayout title="Tambah Purchase Order (PO)">
      {isLoading ? (
        <SkeletonTable />
      ) : (
        <Form form={form} layout="vertical" onFinish={handleCreatePO} onValuesChange={handleValueChange}>
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-x-4">
            <Form.Item label="Nomor Pesanan" name="pesanan_id" rules={requiredRule}>
              <Select
                optionFilterProp="children"
                showSearch
                onChange={(value) => fetchPesananDetail(value)}
                placeholder="Pilih nomor pesanan"
                options={parseToOption(pesanan || [], "id", "nomor_pesanan")}
                filterOption={filterOption}
              />
            </Form.Item>

            <Form.Item rules={requiredRule} label="Nomor Purchase Order" name="nomor_pembelian">
              {loading ? <Skeleton.Input block active /> : <Input readOnly />}
            </Form.Item>

            <Form.Item
              rules={requiredRule}
              label="Tanggal Purchase Order"
              className="pointer-events-none"
              initialValue={dayjs().format()}
            >
              {loading ? <Skeleton.Input block active /> : <DatePicker defaultValue={dayjs()} className="w-full" />}
            </Form.Item>

            <Form.Item rules={requiredRule} label="Pelanggan" name="pelanggan_id">
              {loading ? (
                <Skeleton.Input block active />
              ) : (
                <Select
                  optionFilterProp="children"
                  showSearch
                  onChange={(value) => fetchPesananDetail(value)}
                  placeholder="Pilih nomor pelanggan"
                  options={parseToOption(pelanggan || [], "id", "nama_merchant")}
                  filterOption={filterOption}
                />
              )}
            </Form.Item>
            <Form.Item rules={requiredRule} label="Sales" name="user_id">
              {loading ? (
                <Skeleton.Input block active />
              ) : (
                <Select
                  optionFilterProp="children"
                  showSearch
                  onChange={(value) => fetchPesananDetail(value)}
                  placeholder="Pilih nomor user/sales"
                  options={parseToOption(user || [], "id", "nama")}
                  filterOption={filterOption}
                />
              )}
            </Form.Item>
            <Form.Item rules={requiredRule} label="Status Pengiriman" name="status" initialValue="Dipesan">
              {loading ? (
                <Skeleton.Input block active />
              ) : (
                <Select options={parseToOption(["Dipesan", "Dikirim", "Diterima"])} />
              )}
            </Form.Item>
            <Form.Item label="Catatan" name="catatan" className="col-span-2">
              {loading ? <Skeleton.Input block active /> : <Input.TextArea rows={1} />}
            </Form.Item>
            <Form.Item
              rules={requiredRule}
              label="Status Pengiriman"
              name="status_pembayaran"
              initialValue="Belum Bayar"
            >
              {loading ? (
                <Skeleton.Input block active />
              ) : (
                <Select options={parseToOption(["Lunas", "Bayar Sebagian", "Belum Bayar"])} />
              )}
            </Form.Item>
          </div>

          {loading ? (
            <SkeletonTable />
          ) : (
            <Table
              rowKey={(row) => `${row.produk_id}|${row.produk_detail_id}`}
              columns={columns}
              bordered
              size="small"
              pagination={false}
              dataSource={fieldDetail}
              summary={Footer}
            />
          )}

          <Button
            loading={loadingCreate}
            disabled={loadingCreate || !isFullfilled}
            type="primary"
            htmlType="submit"
            className="mt-4"
          >
            Buat Pembelian
          </Button>
        </Form>
      )}
    </DashboardLayout>
  );
}
