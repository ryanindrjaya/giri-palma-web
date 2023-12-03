import useQuery from "@/hooks/useQuery";
import DashboardLayout from "@/layout/dashboard.layout";
import { parseHarga } from "@/lib/helpers/parseNumber";
import { Pembelian, RiwayatPembayaran } from "@/types/pembelian.type";
import { ColumnsType } from "antd/es/table";
import { Button, Popconfirm, Table, Tag, Tooltip } from "antd";
import dayjs from "dayjs";
import React, { useMemo } from "react";
import { CheckOutlined } from "@ant-design/icons";
import useMutation from "@/hooks/useMutation";
import { NotificationInstance } from "antd/es/notification/interface";

export async function getServerSideProps(context: any) {
  const { id } = context.params;
  return {
    props: {
      id,
    },
  };
}

type Props = {
  id: string;
  notificationApi: NotificationInstance;
};

export default function pembayaran({ id, notificationApi }: Props) {
  const { data, loading, refetch } = useQuery<Pembelian>(`/api/admin/pembelian/${id}`);
  const [verifPembayaran, { loading: loadingVerif }] = useMutation("/api/admin/pembayaran/confirm", "post", {
    onSuccess: () => {
      notificationApi.success({
        message: "Berhasil",
        description: "Berhasil memverifikasi pembayaran",
        placement: "topRight",
      });

      refetch();
    },
  });

  const pembayaran = useMemo<RiwayatPembayaran[] | undefined>(() => {
    if (!data) return;

    if (data?.riwayat_pembayaran.length === 0) return;

    const sortByTanggalBayar = data.riwayat_pembayaran.sort((a, b) => {
      if (a.tanggal_bayar && b.tanggal_bayar) {
        return dayjs(a.tanggal_bayar).unix() - dayjs(b.tanggal_bayar).unix();
      } else {
        return 0;
      }
    });

    return sortByTanggalBayar;
  }, [data]);

  const handleVerifPembayaran = (pembayaran_id: string) => {
    const body = {
      pembelian_id: id,
      pembayaran_id,
    };

    verifPembayaran(body).catch((err) => {
      notificationApi.error({
        message: "Error",
        description: err?.response?.data?.message || "Terjadi Kesalahan",
        placement: "topRight",
      });
    });
  };

  const columns: ColumnsType<RiwayatPembayaran> = [
    {
      title: "Tanggal Bayar",
      key: "tanggal_bayar",
      render: (_, record) => {
        return record.tanggal_bayar ? dayjs(record.tanggal_bayar).format("DD MMMM YYYY") : "-";
      },
    },
    {
      title: "No. Pembayaran",
      key: "no_pembayaran",
      dataIndex: "nomor_pembayaran",
    },
    {
      title: "Metode Pembayaran",
      key: "metode_pembayaran",
      render: (_, record) => {
        return record.metode_bayar;
      },
    },
    {
      title: "Status Bayar",
      key: "status",
      render: (_, record) => {
        return record.is_paid ? <Tag color="green-inverse">Dibayar</Tag> : <Tag color="red-inverse">Belum Dibayar</Tag>;
      },
    },
    {
      title: "Status Verifikasi",
      key: "bukti_pembayaran",
      render: (_, record) => {
        return record.is_confirmed ? (
          <Tag color="green">Terverifikasi</Tag>
        ) : (
          <Tag color="red">Belum Terverifikasi</Tag>
        );
      },
    },
    {
      title: "Total Bayar",
      key: "total_bayar",
      render: (_, record) => {
        return `Rp ${parseHarga(record.nilai_bayar)}`;
      },
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      render: (_, record) => {
        return record.is_confirmed || !record.is_paid ? null : (
          <Popconfirm
            placement="left"
            title="Verifikasi Pembayaran"
            description="Apakah anda yakin ingin memverifikasi pembayaran ini?"
            onConfirm={() => handleVerifPembayaran(record.id)}
            okButtonProps={{ loading: loadingVerif }}
            okText="Ya"
            cancelText="Tidak"
          >
            <Button type="primary">
              <CheckOutlined />
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <DashboardLayout overrideDetailId={data?.nomor_pembelian || "Detail"} title="Riwayat Pembayaran">
      <Table bordered size="small" loading={loading} dataSource={pembayaran} columns={columns} rowKey="id" />
    </DashboardLayout>
  );
}
