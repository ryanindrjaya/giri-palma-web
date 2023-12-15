import SkeletonTable from "@/components/SkeletonTable";
import useQuery from "@/hooks/useQuery";
import DashboardLayout from "@/layout/dashboard.layout";
import { parseHarga } from "@/lib/helpers/parseNumber";
import { Pesanan, PesananDetail } from "@/types/pesanan.type";
import { Button, Descriptions, DescriptionsProps, Image, Table, Tag } from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import React, { useMemo, useState } from "react";
import { PESANAN_COLOR, PESANAN_TEXT_COLOR } from "..";
import { capitalize } from "@/lib/helpers/capitalize";
import ProdukModal from "@/components/ProdukModal";
import { BiPurchaseTag } from "react-icons/bi";
import { useRouter } from "next/router";
import { AiOutlineEdit } from "react-icons/ai";

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
  const router = useRouter();
  const { data, loading, error } = useQuery<Pesanan>(`/api/admin/pesanan/${id}`);
  const [produkId, setProdukId] = useState<string | null>(null);

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
    case "Dibatalkan":
      color = "red-inverse";
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
        <Tag color={color} className="flex gap-1 items-center justify-center w-fit">
          <p className="text-center w-full flex-1 m-0">{data?.status_pembayaran}</p>
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
          className="flex gap-1 font-bold items-center justify-center w-fit"
          color={PESANAN_COLOR[data?.status as keyof typeof PESANAN_COLOR]}
        >
          <p className="text-center w-full flex-1 m-0">{data?.status}</p>
        </Tag>
      ),
      span: 2,
    },
    {
      label: "Catatan",
      children: data?.catatan,
      span: 4,
    },
    {
      label: "Uang Muka (DP)",
      children: `Rp ${parseHarga((data?.uang_muka || 0) - (data?.uang_tukar_tambah || 0))}`,
      span: 4,
    },
    {
      label: "Uang Tukar Tambah",
      children: `Rp ${parseHarga(data?.uang_tukar_tambah || 0)}`,
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
            children: `${data?.termin_pembayaran ? data?.termin_pembayaran / 7 : 0} Minggu`,
            span: 2,
          },
          {
            label: "Pembayaran Per Minggu",
            children: `Rp ${parseHarga(data?.pembayaran_per_minggu || 0)}`,
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
        <span
          className="text-blue-500 cursor-pointer hover:text-blue-400 transition-all duration-100"
          onClick={() => setProdukId(item.produk_id)}
        >
          {item.produk.nama} ({item.produk_detail.tipe})
        </span>
      ),
    },
    {
      title: "Ukuran",
      dataIndex: ["produk_detail", "ukuran"],
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
          <Table.Summary.Cell index={0} align="center" colSpan={5}></Table.Summary.Cell>
          <Table.Summary.Cell index={1} className=" font-bold">
            Total
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2} className="font-bold">
            {`Rp ${parseHarga(data?.total || 0)}`}
          </Table.Summary.Cell>
        </Table.Summary.Row>
        <Table.Summary.Row>
          <Table.Summary.Cell index={0} align="center" colSpan={5}></Table.Summary.Cell>
          <Table.Summary.Cell index={1} className=" font-bold">
            Uang Muka (DP)
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2} className="font-bold">
            {`Rp ${parseHarga((data?.uang_muka || 0) - (data?.uang_tukar_tambah || 0))}`}
          </Table.Summary.Cell>
        </Table.Summary.Row>
        <Table.Summary.Row>
          <Table.Summary.Cell index={0} align="center" colSpan={5}></Table.Summary.Cell>
          <Table.Summary.Cell index={1} className=" font-bold">
            Uang Tukar Tambah
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2} className="font-bold">
            {`Rp ${parseHarga(data?.uang_tukar_tambah || 0)}`}
          </Table.Summary.Cell>
        </Table.Summary.Row>
        <Table.Summary.Row>
          <Table.Summary.Cell index={0} align="center" colSpan={5}></Table.Summary.Cell>
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
    <DashboardLayout
      overrideBreadcrumb={data?.nomor_pesanan}
      title={"Detail Pesanan"}
      header={
        <div className="flex justify-end">
          {!data?.paired && data?.status !== "Dibatalkan" ? (
            <div className="flex gap-3">
              <Button
                icon={<BiPurchaseTag size={18} />}
                onClick={() => router.push(`/dashboard/purchase-order/tambah?ref=${data?.id}`)}
                type="primary"
              >
                Jadikan PO
              </Button>
              <Button
                icon={<AiOutlineEdit size={18} />}
                onClick={() => router.push(`/dashboard/pesanan/${data?.id}/edit`)}
                type="primary"
              >
                Edit Pesanan
              </Button>
            </div>
          ) : null}
        </div>
      }
    >
      <ProdukModal readOnly open={!!produkId} onClose={() => setProdukId(null)} produkId={produkId || ""} />

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
