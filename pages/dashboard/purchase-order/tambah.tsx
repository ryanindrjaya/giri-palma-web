import DashboardLayout from "@/layout/dashboard.layout";
import fetcher from "@/lib/axios";
import { CreatePembelian, CreatePembelianDetail } from "@/types/pembelian.type";
import { Button, Form, Input, InputNumber, Select, Skeleton, Table } from "antd";
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
type Props = {
  notificationApi: NotificationInstance;
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
          pembelianDetail.push({
            produk: item.produk,
            produk_detail: item.produk_detail,
            produk_id: item.produk?.id,
            produk_detail_id: item.produk_detail?.detail_id,
            quantity: item.quantity,
            immutable_quantity: item.quantity,
            diskon: item.diskon,
            subtotal: item.quantity * (item.produk_detail?.harga || 0) * ((100 - item.diskon) / 100),
          });
        });

        const setFieldPesanan = {
          pesanan_id: data.id,
          pelanggan_id: data.pelanggan?.id,
          user_id: data.user?.id,
          pembelian_detail: pembelianDetail,
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

    const body = {
      ...values,
      pembelian_detail: detail,
    };

    console.log("body", body);

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
      title: "Produk",
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
      title: "Detail Produk",
      key: "detail_produk",
      render: (_v, item) => `${item.produk_detail?.tipe} (${item.produk_detail?.ukuran})`,
    },
    {
      title: "Jumlah",
      render: (_v, item, index) => {
        console.log(item);
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
      key: "diskon",
      title: "Diskon",
      render: (_v, item, index) => (
        <Form.Item noStyle name={["pembelian_detail", index, "diskon"]} initialValue={item.diskon}>
          <InputNumber
            className="w-full"
            onFocus={(e) => e.target.select()}
            onChange={(value) => {
              item.diskon = value || 0;
            }}
            min={0}
            max={100}
            suffix="%"
          />
        </Form.Item>
      ),
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
      const subtotal = item.quantity * (item.produk_detail?.harga || 0) * ((100 - item.diskon) / 100);
      item.subtotal = subtotal;
      return item;
    });

    form.setFieldsValue({
      pembelian_detail: newDetail,
    });

    if (newDetail?.length === 0) {
      console.log("masuk cek new detail");
      setIsFullfilled(false);
      return;
    }

    const isQuantityZero = detail?.some((item: any) => item.quantity === 0);

    if (isQuantityZero) {
      console.log("masuk cek quantity");
      setIsFullfilled(false);
      return;
    }

    if (allValues.pesanan_id && allValues.pelanggan_id && allValues.user_id) {
      console.log("masuk cek all value");
      setIsFullfilled(true);
    } else {
      console.log("masuk cek all value else");
      setIsFullfilled(false);
    }
  };

  const fieldDetail = form.getFieldValue("pembelian_detail") || [];

  return (
    <DashboardLayout title="Tambah Purchase Order (PO)">
      {isLoading ? (
        <SkeletonTable />
      ) : (
        <Form form={form} layout="vertical" onFinish={handleCreatePO} onValuesChange={handleValueChange}>
          <div className="w-full flex gap-4">
            <Form.Item label="Pesanan" className="flex-[0.5]" name="pesanan_id" rules={requiredRule}>
              <Select
                optionFilterProp="children"
                showSearch
                onChange={(value) => fetchPesananDetail(value)}
                placeholder="Pilih nomor pesanan"
                options={parseToOption(pesanan || [], "id", "nomor_pesanan")}
                filterOption={filterOption}
              />
            </Form.Item>

            <Form.Item rules={requiredRule} label="Nomor PO" className="flex-[0.5]" name="nomor_pembelian">
              {loading ? <Skeleton.Input block active /> : <Input readOnly />}
            </Form.Item>
          </div>

          <div className="w-full flex gap-4">
            <Form.Item rules={requiredRule} label="Pelanggan" className="flex-[0.5]" name="pelanggan_id">
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
            <Form.Item rules={requiredRule} label="Sales" className="flex-[0.5]" name="user_id">
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
          </div>

          {loading ? (
            <SkeletonTable />
          ) : (
            <Table
              rowKey={(row) => `${row.produk_id}|${row.produk_detail_id}`}
              columns={columns}
              bordered
              size="small"
              dataSource={fieldDetail}
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
