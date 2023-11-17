import SkeletonTable from "@/components/SkeletonTable";
import useQuery from "@/hooks/useQuery";
import DashboardLayout from "@/layout/dashboard.layout";
import { parseHarga } from "@/lib/helpers/parseNumber";
import { Pesanan, PesananDetail } from "@/types/pesanan.type";
import { Descriptions, DescriptionsProps, Image, Table, Tag } from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import React, { useMemo } from "react";
import { PESANAN_COLOR, PESANAN_TEXT_COLOR } from ".";
import { capitalize } from "@/lib/helpers/capitalize";

export async function getServerSideProps(context: any) {
  const { id } = context.params;
  return {
    props: {
      id,
    },
  };
}

type Props = { id: string };

export default function DetailPesanan({ id }: Props) {
  const { data, loading, error } = useQuery<Pesanan>(`/api/admin/pesanan/${id}`);

  if (loading) {
    <DashboardLayout title={"Memuat..."}>
      <SkeletonTable />
    </DashboardLayout>;
  }

  if (error) {
    return <DashboardLayout title={"Error"}>{error?.response?.data?.message || "Terjadi Kesalahan"}</DashboardLayout>;
  }

  const descriptionPelanggan: DescriptionsProps["items"] = [
    {
      label: "Nama",
      span: 2,
      children: data?.pelanggan?.nama,
    },
    {
      label: "Nama Merchant",
      span: 1,
      children: data?.pelanggan?.nama_merchant,
    },
    {
      label: "Nomor Telepon",
      span: 1,
      children: data?.pelanggan?.telp,
    },
    {
      label: "Provinsi",
      children: data?.pelanggan?.provinsi,
    },
    {
      label: "Kota",
      children: data?.pelanggan?.kota,
    },
    {
      label: "Kecamatan",
      children: data?.pelanggan?.kecamatan,
    },
    {
      label: "Kelurahan",
      children: data?.pelanggan?.kelurahan,
    },
    {
      label: "Alamat",
      children: data?.pelanggan?.alamat,
      span: 4,
    },
    {
      label: "Sales",
      children: data?.user?.nama,
      span: 2,
    },
    {
      label: "Telepon Sales",
      children: data?.user?.phone,
      span: 2,
    },
  ];

  const status: string = data?.status_pembayaran || "Belum Lunas";
  let color: string = "";

  switch (status) {
    case "Lunas":
      color = "green";
      break;
    case "Bayar Sebagian":
      color = "orange";
      break;
    case "Belum Lunas":
      color = "red";
      break;
    default:
      color = "blue";
      break;
  }

  const descriptionPesanan: DescriptionsProps["items"] = [
    {
      label: "No. Pesanan",
      children: data?.nomor_pesanan,
      span: 4,
    },
    {
      label: "Tanggal Pesanan",
      children: dayjs(data?.created_at).format("D MMMM YYYY"),
      span: 4,
    },
    {
      label: "Status Pembayaran",
      children: (
        <Tag color={color} className="flex gap-1 items-center w-fit">
          {data?.status_pembayaran}
        </Tag>
      ),
      span: 2,
    },
    {
      label: "Status Pengiriman",
      children: (
        <Tag
          style={{
            color: PESANAN_TEXT_COLOR[data?.status as keyof typeof PESANAN_TEXT_COLOR],
          }}
          color={PESANAN_COLOR[data?.status as keyof typeof PESANAN_COLOR]}
        >
          <span className=" font-bold">{data?.status}</span>
        </Tag>
      ),
      span: 2,
    },
    {
      label: "Uang Muka (DP)",
      children: `Rp ${parseHarga(data?.uang_muka || 0)}`,
      span: 4,
    },
    {
      label: "Total Pesanan",
      children: `Rp ${parseHarga(data?.total || 0)}`,
      span: 4,
    },
    {
      label: "Sisa Pembayaran",
      children: `Rp ${parseHarga((data?.total || 0) - (data?.uang_muka || 0))}`,
      span: 4,
    },
    {
      label: "Metode Pembayaran",
      children: capitalize(data?.metode_bayar || ""),
      span: 4,
    },
    ...(data?.metode_bayar === "tempo"
      ? [
          {
            label: "Jangka Waktu Pembayaran",
            children: `${data?.rentang_waktu_pembayaran ? data?.rentang_waktu_pembayaran / 30 : 0} Bulan`,
            span: 2,
          },
          {
            label: "Termin Pembayaran",
            children: `${data?.termin_pembayaran ? data?.termin_pembayaran / 14 : 0} Minggu`,
            span: 2,
          },
          {
            label: "Pembayaran Per Minggu",
            children: `Rp ${parseHarga(
              data?.termin_pembayaran && data?.rentang_waktu_pembayaran
                ? data?.total - (data?.uang_muka || 0) / (data?.rentang_waktu_pembayaran / data?.termin_pembayaran)
                : 0
            )}`,
            span: 2,
          },
        ]
      : []),
  ];

  const detailColumns: ColumnsType<PesananDetail> = [
    {
      title: "#",
      width: 50,
      align: "center",
      render: (_v, _, index) => index + 1,
    },
    {
      title: "Produk",
      render: (_v, item) => (
        <a target="_blank" href={`/dashboard/produk?id=${item?.produk_id}`}>
          Produk
        </a>
      ),
    },
    {
      title: "Harga",
      key: "harga",
      render: (_v, item) => `Rp ${parseHarga(item?.harga || 0)}`,
    },
    {
      title: "Harga Jual",
      key: "harga_jual",
      render: (_v, item) => `Rp ${parseHarga(item?.harga_jual || 0)}`,
    },
    {
      title: "Jumlah Pesanan",
      key: "jumlah_pesanan",
      render: (_v, item) => `${item?.quantity} Item`,
    },
    {
      title: "Subtotal",
      key: "subtotal",
      render: (_v, item) => `Rp ${parseHarga(item?.subtotal || 0)}`,
    },
  ];

  const descriptionTukarTambah: DescriptionsProps["items"] = [
    {
      label: "Metode Bayar",
      children: data?.tukar_tambah?.[0]?.metode_bayar,
      span: 4,
    },
    {
      label: "Kode Bayar",
      children: data?.tukar_tambah?.[0]?.kode_bayar,
      span: 4,
    },
    {
      label: "Perkiraan Harga",
      children: `Rp ${parseHarga(data?.tukar_tambah?.[0]?.harga || 0)}`,
      span: 4,
    },
  ];

  const Footer = ({ detail }: { detail: readonly PesananDetail[] }) => {
    return (
      <>
        <Table.Summary.Row>
          <Table.Summary.Cell index={0} align="center" colSpan={4}></Table.Summary.Cell>
          <Table.Summary.Cell index={1} className=" font-bold">
            Total
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2} className="font-bold">
            {`Rp ${parseHarga(data?.total || 0)}`}
          </Table.Summary.Cell>
        </Table.Summary.Row>
        <Table.Summary.Row>
          <Table.Summary.Cell index={0} align="center" colSpan={4}></Table.Summary.Cell>
          <Table.Summary.Cell index={1} className=" font-bold">
            Uang Muka (DP)
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2} className="font-bold">
            {`Rp ${parseHarga(data?.uang_muka || 0)}`}
          </Table.Summary.Cell>
        </Table.Summary.Row>
        <Table.Summary.Row>
          <Table.Summary.Cell index={0} align="center" colSpan={4}></Table.Summary.Cell>
          <Table.Summary.Cell index={1} className="bg-primary text-white font-bold">
            Sisa Pembayaran
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2} className="bg-primary text-white font-bold">
            {`Rp ${parseHarga((data?.total || 0) - (data?.uang_muka || 0))}`}
          </Table.Summary.Cell>
        </Table.Summary.Row>
      </>
    );
  };

  return (
    <DashboardLayout overrideBreadcrumb={data?.nomor_pesanan} title={"Detail Pesanan"}>
      <Descriptions size="small" column={4} bordered title="Pesanan" items={descriptionPesanan} />
      <div className="h-4" />
      {data?.tukar_tambah
        ? data.tukar_tambah.map((item, index) => (
            <>
              <Descriptions size="small" column={4} bordered title="Tukar Tambah" items={descriptionTukarTambah} />
              <p className="font-bold text-base">Dokumen Tukar Tambah</p>
              <Image.PreviewGroup>
                {item?.image_url?.map((item, idx) => (
                  <Image
                    key={`gambar-tt-${idx}`}
                    src={item}
                    width={200}
                    height={200}
                    className="object-cover object-center"
                  />
                ))}
              </Image.PreviewGroup>
              <div className="h-4" />
            </>
          ))
        : null}
      <Descriptions size="small" column={4} bordered title="Detail Pelanggan" items={descriptionPelanggan} />
      <p className="text-base font-bold">Detail Pesanan</p>
      <Table
        bordered
        size="small"
        rowKey={(item) => item.detail_id}
        columns={detailColumns}
        dataSource={data?.pesanan_detail}
        summary={(data) => <Footer detail={data} />}
      />
    </DashboardLayout>
  );
}
