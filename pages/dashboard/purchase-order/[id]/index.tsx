import SkeletonTable from "@/components/SkeletonTable";
import useQuery from "@/hooks/useQuery";
import DashboardLayout from "@/layout/dashboard.layout";
import { parseHarga } from "@/lib/helpers/parseNumber";
import { Button, Descriptions, DescriptionsProps, Modal, Table, Tag } from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import React, { useMemo, useState, useRef } from "react";
import { PESANAN_COLOR, PESANAN_TEXT_COLOR } from "../../pesanan";
import { DetailPembelian, PembelianDetail } from "@/types/pembelian.type";
import { MdPayment } from "react-icons/md";
import { useRouter } from "next/router";
import ProdukModal from "@/components/ProdukModal";
import PrintPO from "@/components/PrintPO";
import { useReactToPrint } from "react-to-print";
import { FaPrint } from "react-icons/fa";

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
  const { data, loading, error } = useQuery<DetailPembelian>(`/api/admin/pembelian/${id}`);
  const [produkId, setProdukId] = React.useState<string | null>(null);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const printRef = useRef(null);

  if (loading) {
    <DashboardLayout title={"Memuat..."}>
      <SkeletonTable />
    </DashboardLayout>;
  }

  if (error) {
    return <DashboardLayout title={"Error"}>{error?.response?.data?.message || "Terjadi Kesalahan"}</DashboardLayout>;
  }

  const totalPembayaran = useMemo<number>(() => {
    if (!data) return 0;

    if (data?.riwayat_pembayaran.length === 0) return 0;

    return data.riwayat_pembayaran.reduce((acc, curr) => {
      if (curr.is_paid && curr.is_confirmed) {
        return acc + curr.nilai_bayar;
      }

      return acc;
    }, 0);
  }, [data]);

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
      children: data?.nomor_pembelian,
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
        <Tag color={color} className="flex gap-1 items-center justify-center text-center w-fit">
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
          className="flex gap-1 items-center font-bold justify-center text-center w-fit"
          color={PESANAN_COLOR[data?.status as keyof typeof PESANAN_COLOR]}
        >
          <p className="text-center w-full flex-1 m-0">{data?.status}</p>
        </Tag>
      ),
      span: 2,
    },
    {
      label: "Catatan",
      children: <span className="font-bold">{data?.catatan}</span>,
      span: 4,
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
  ];

  const detailColumns: ColumnsType<PembelianDetail> = [
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

  const Footer = ({ detail }: { detail: readonly PembelianDetail[] }) => {
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
            Total Pembayaran
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2} className="font-bold">
            {`Rp ${parseHarga(data?.uang_muka || 0)}`}
          </Table.Summary.Cell>
        </Table.Summary.Row>
        <Table.Summary.Row>
          <Table.Summary.Cell index={0} align="center" colSpan={5}></Table.Summary.Cell>
          <Table.Summary.Cell index={1} className="bg-primary text-white font-bold">
            Sisa Pembayaran
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2} className="bg-primary text-white font-bold">
            {`Rp ${parseHarga(data?.sisa_pembayaran || 0)}`}
          </Table.Summary.Cell>
        </Table.Summary.Row>
      </>
    );
  };

  const redirectToPembayaran = () => {
    router.push(`/dashboard/purchase-order/${id}/pembayaran`);
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    pageStyle: "@page { size: A5 landscape; margin: 2mm; }",
  });

  return (
    <>
      <Modal
        open={openModal}
        onOk={handlePrint}
        onCancel={() => setOpenModal(false)}
        okText="Cetak"
        cancelText="Batal"
        centered
        title="Cetak Purchase Order"
        width={1000}
      >
        <div className="w-full flex justify-center">
          <PrintPO data={data} ref={printRef} />
        </div>
      </Modal>
      <DashboardLayout
        header={
          <div className="flex gap-2 justify-end">
            <Button icon={<FaPrint size={18} />} onClick={() => setOpenModal(true)} type="primary">
              Cetak
            </Button>
            <Button icon={<MdPayment size={18} />} onClick={redirectToPembayaran} type="primary">
              Pembayaran
            </Button>
          </div>
        }
        overrideBreadcrumb={data?.nomor_pembelian}
        title={"Detail Pembelian"}
      >
        <ProdukModal readOnly open={!!produkId} onClose={() => setProdukId(null)} produkId={produkId || ""} />

        <Descriptions size="small" column={4} bordered title="Pembelian" items={descriptionPesanan} />
        <div className="h-4" />
        <Descriptions size="small" column={4} bordered title="Detail Pelanggan" items={descriptionPelanggan} />
        <p className="text-base font-bold">Detail Pembelian</p>
        <Table
          bordered
          size="small"
          rowKey={(item) => item.detail_id}
          columns={detailColumns}
          dataSource={data?.pembelian_detail}
          summary={(data) => <Footer detail={data} />}
        />
      </DashboardLayout>
    </>
  );
}
