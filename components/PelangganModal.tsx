import useQuery from "@/hooks/useQuery";
import { Pelanggan } from "@/types/pelanggan.type";
import { Descriptions, DescriptionsProps, Image, InputNumber, Modal } from "antd";
import React, { useMemo } from "react";
import { MdOutlineOpenInNew } from "react-icons/md";
import SkeletonTable from "./SkeletonTable";
import useMutation from "@/hooks/useMutation";
import _ from "lodash";

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

  const [edit] = useMutation(`/api/admin/pelanggan/${pelangganId}`, "put", {
    onSuccess: () => {
      if (refetch) refetch();
    },
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
          <div>
            <div className="flex">
              <InputNumber
                className="flex-1"
                controls={false}
                defaultValue={pelanggan?.latitude}
                formatter={(value) => `${value}`.slice(0, 10)}
                onChange={_.debounce((value) => {
                  if (pelanggan?.latitude) {
                    pelanggan.latitude = value;
                  }

                  edit({ latitude: value });
                }, 1000)}
              />
              <span className="flex-[0]">, </span>
              <InputNumber
                className="flex-1"
                controls={false}
                defaultValue={pelanggan?.longitude}
                formatter={(value) => `${value}`.slice(0, 10)}
                onChange={_.debounce((value) => {
                  if (pelanggan?.longitude) {
                    pelanggan.longitude = value;
                  }

                  edit({ longitude: value });
                }, 1000)}
              />
            </div>

            <a
              target="_blank"
              href={`https://maps.google.com/?q=${pelanggan?.latitude},${pelanggan?.longitude}`}
              className="text-blue-500 hover:text-blue-300 transition-all duration-75 items-center cursor-pointer flex gap-2"
            >
              <span>Lihat di Map</span>
              <MdOutlineOpenInNew size={18} />
            </a>
          </div>
        ),
      },
    ],
    [pelanggan]
  );

  return (
    <Modal
      okButtonProps={{ hidden: true, style: { display: "none" } }}
      cancelText="Tutup"
      title="Pelanggan Detail"
      width={1000}
      open={open}
      onOk={onClose}
      onCancel={onClose}
    >
      {loading ? (
        <SkeletonTable />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="mb-5">
            <p className="font-bold text-base">Gambar Pelanggan</p>
            <Image.PreviewGroup>
              <div className="flex gap-3">
                {pelanggan?.image_url?.map((item, idx) => (
                  <Image
                    key={`gambar-pelanggan-${idx}`}
                    src={item}
                    width={200}
                    height={200}
                    className="object-cover object-center rounded-md"
                  />
                ))}
              </div>
            </Image.PreviewGroup>
          </div>
          <Descriptions bordered size="small" title="Data Pelanggan" items={dataPelanggan} />
          <Descriptions bordered size="small" title="Lokasi Pelanggan" items={dataLokasi} />
        </div>
      )}
    </Modal>
  );
}
