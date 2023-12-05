import useQuery from "@/hooks/useQuery";
import { Pelanggan } from "@/types/pelanggan.type";
import { Descriptions, DescriptionsProps, Modal } from "antd";
import React, { useMemo } from "react";
import { MdOutlineOpenInNew } from "react-icons/md";
import SkeletonTable from "./SkeletonTable";

type Props = {
  pelangganId: string;
  open: boolean;
  onClose: () => void;
  refetch?: () => void;
};

export default function PelangganModal({ refetch, open, pelangganId, onClose }: Props) {
  if (!pelangganId) return null;

  const {
    data: pelanggan,
    loading,
    error,
  } = useQuery<Pelanggan>(`/api/admin/pelanggan/${pelangganId}`, {
    trigger: open,
  });

  const dataPelanggan: DescriptionsProps["items"] = useMemo(
    () => [
      {
        key: "1",
        label: "Nama",
        children: pelanggan?.nama,
      },
      {
        key: "2",
        label: "Nama Merchant",
        children: pelanggan?.nama_merchant,
      },
      {
        key: "3",
        label: "Kategori",
        children: pelanggan?.pelanggan_kategori?.nama,
      },
      {
        key: "4",
        label: "Kode",
        children: pelanggan?.kode,
      },
      {
        key: "5",
        label: "Kategori",
        children: pelanggan?.pelanggan_kategori.nama,
      },
      {
        key: "6",
        label: "No. HP",
        children: pelanggan?.telp,
      },
      {
        key: "7",
        label: "Kredit Limit",
        children: pelanggan?.kredit_limit,
      },
      {
        key: "8",
        label: "Tenor",
        children: pelanggan?.tenor,
      },
    ],
    [pelanggan]
  );

  const dataLokasi: DescriptionsProps["items"] = useMemo(
    () => [
      {
        key: "1",
        label: "Provinsi",
        children: pelanggan?.provinsi,
      },
      {
        key: "2",
        label: "Kabupaten",
        children: pelanggan?.kota,
      },
      {
        key: "3",
        label: "Kecamatan",
        children: pelanggan?.kecamatan,
      },
      {
        key: "4",
        label: "Kelurahan",
        children: pelanggan?.kelurahan,
      },
      {
        key: "5",
        label: "Alamat",
        children: pelanggan?.alamat,
      },
      {
        key: "kode_pos",
        label: "Kode Pos",
        children: pelanggan?.kode_pos,
      },
      {
        key: "6",
        label: "Koordinat",
        children: (
          <a
            target="_blank"
            href={`https://maps.google.com/?q=${pelanggan?.latitude},${pelanggan?.longitude}`}
            className="text-blue-500 hover:text-blue-300 transition-all duration-75 items-center cursor-pointer flex gap-2"
          >
            <p className="">
              {pelanggan?.latitude},&nbsp;{pelanggan?.longitude}
            </p>
            <MdOutlineOpenInNew size={18} />
          </a>
        ),
      },
    ],
    [pelanggan]
  );

  return (
    <Modal
      okButtonProps={{ hidden: true, style: { display: "none" } }}
      cancelText="Tutup"
      title="Customer Detail"
      width={1000}
      open={open}
      onOk={onClose}
      onCancel={onClose}
    >
      {loading ? (
        <SkeletonTable />
      ) : (
        <>
          <Descriptions bordered size="small" title="Data Pelanggan" items={dataPelanggan} />
          <Descriptions bordered size="small" title="Lokasi Pelanggan" items={dataLokasi} />
        </>
      )}
    </Modal>
  );
}
