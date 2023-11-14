import DashboardLayout, { inria } from "@/layout/dashboard.layout";
import { Button, Descriptions, DescriptionsProps, Input, Popconfirm, Table, Tag } from "antd";
import { GiSettingsKnobs } from "react-icons/gi";
import { AiOutlinePlus, AiOutlineEdit } from "react-icons/ai";
import React, { useState, useEffect } from "react";
import useQuery from "@/hooks/useQuery";
import SkeletonTable from "@/components/SkeletonTable";
import type { ColumnsType } from "antd/es/table";
import { BsFillTrashFill } from "react-icons/bs";
import useDebounce from "@/hooks/useDebounce";
import useMutation from "@/hooks/useMutation";
import { useRouter } from "next/router";
import { NotificationInstance } from "antd/es/notification/interface";

import { PesananDetail } from "@/types/pesanan.type";

import { IoAlertCircleOutline } from "react-icons/io5";
import { FaBox } from "react-icons/fa";
import { FiTruck } from "react-icons/fi";
import { parseHarga } from "@/lib/helpers/parseNumber";
import { BiPurchaseTag } from "react-icons/bi";
import { Pembelian } from "@/types/pembelian.type";

type Props = {
  notificationApi: NotificationInstance;
};

export const PESANAN_COLOR = {
  Dipesan: "#F2D8D8",
  Dikirim: "#F2ECB3",
  Terkirim: "#B9E7A3",
};

export const PESANAN_TEXT_COLOR = {
  Dipesan: "#B87070",
  Dikirim: "#5E5E5E",
  Terkirim: "#3A4F26",
};

export const PESANAN_ICON = {
  Dipesan: <IoAlertCircleOutline size={18} />,
  Dikirim: <FaBox size={18} />,
  Terkirim: <FiTruck size={18} />,
};

export default function PurchaseOrder({ notificationApi }: Props) {
  const router = useRouter();
  const [searchVal, setSearchVal] = useState<string>("");
  const debouncedSearchVal = useDebounce(searchVal, 500);
  const [selectedRow, setSelectedRow] = useState<Pembelian[]>([]);
  const { data, loading, refetch } = useQuery<Pembelian[]>("/api/admin/pembelian");
  const [deletePembelian, { loading: loadingDelete }] = useMutation("/api/admin/pembelian", "delete");
  const [editPembelian, { loading: loadingEdit }] = useMutation("/api/admin/pembelian", "put");

  const [pesananId, setPembelianId] = useState<string | null>(null);

  useEffect(() => {
    if (debouncedSearchVal) {
      refetch({ nama_pelanggan: debouncedSearchVal });
    } else {
      refetch();
    }
  }, [debouncedSearchVal]);

  const columns: ColumnsType<Pembelian> = [
    {
      title: "#",
      width: 50,
      align: "center",
      render: (_v, _, index) => index + 1,
    },
    {
      title: "Nomor Pembelian",
      dataIndex: "nomor_pembelian",
      key: "nomor_pembelian",
    },
    {
      title: "Pelanggan",
      dataIndex: ["pelanggan", "nama"],
      key: "pelanggan",
    },
    {
      title: "Status",
      key: "status",
      width: 150,
      render: (_v, item) => {
        const status: string = item.status;

        return (
          <Tag
            style={{
              color: PESANAN_TEXT_COLOR[status as keyof typeof PESANAN_TEXT_COLOR],
            }}
            color={PESANAN_COLOR[status as keyof typeof PESANAN_COLOR]}
            className="flex gap-1 items-center w-fit"
          >
            {PESANAN_ICON[status as keyof typeof PESANAN_ICON]}
            <span className=" font-bold">{status}</span>
          </Tag>
        );
      },
    },
    {
      title: "Total Pesanan",
      key: "total",
      render: (_v, item) => `Rp ${parseHarga(item?.total || 0)}`,
    },
    {
      title: "Uang Muka (DP)",
      key: "uang_muka",
      render: (_v, item) => `Rp ${parseHarga(item?.uang_muka || 0)}`,
    },
    {
      title: "Sisa Pembayaran",
      key: "sisa_pembayaran",
      render: (_v, item) => `Rp ${parseHarga(item?.sisa_pembayaran || 0)}`,
    },
    {
      title: "Catatan",
      key: "catatan",
      dataIndex: "catatan",
    },
  ];

  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: Pembelian[]) => {
      setSelectedRow(selectedRows);
    },
  };

  const handleBulkDelete = async () => {
    try {
      const promises = selectedRow.map((item) => deletePembelian(undefined, item.id));
      const resolved = await Promise.all(promises);

      if (resolved.every((item) => item.status === 200)) {
        notificationApi.success({
          message: "Berhasil",
          description: "Berhasil menghapus pembelian",
          placement: "topRight",
        });
      }

      setSelectedRow([]);
      refetch();
    } catch (error: any) {
      console.log(error);
      notificationApi.error({
        message: "Gagal",
        description: error?.response?.data?.message || "Gagal menghapus pembelian",
        placement: "topRight",
      });
    }
  };

  const DetailPembelian = ({ pembelian }: { pembelian: Pembelian }) => {
    console.log(pembelian);
    const descriptionPelanggan: DescriptionsProps["items"] = [
      {
        label: "Nama",
        span: 2,
        children: pembelian?.pelanggan?.nama,
      },
      {
        label: "Nama Merchant",
        span: 1,
        children: pembelian?.pelanggan?.nama_merchant,
      },
      {
        label: "Nomor Telepon",
        span: 1,
        children: pembelian?.pelanggan?.telp,
      },
      {
        label: "Provinsi",
        children: pembelian?.pelanggan?.provinsi,
      },
      {
        label: "Kota",
        children: pembelian?.pelanggan?.kota,
      },
      {
        label: "Kecamatan",
        children: pembelian?.pelanggan?.kecamatan,
      },
      {
        label: "Kelurahan",
        children: pembelian?.pelanggan?.kelurahan,
      },
      {
        label: "Alamat",
        children: pembelian?.pelanggan?.alamat,
        span: 4,
      },
      {
        label: "Sales",
        children: pembelian?.user?.nama,
        span: 2,
      },
      {
        label: "Telepon Sales",
        children: pembelian?.user?.phone,
        span: 2,
      },
    ];

    return (
      <div>
        <Descriptions
          contentStyle={{ backgroundColor: "#FFF" }}
          size="small"
          column={4}
          bordered
          title="Detail Pelanggan"
          items={descriptionPelanggan}
        />
      </div>
    );
  };

  return (
    <DashboardLayout
      title="Pesanan"
      header={
        <div className="w-full flex justify-between items-center">
          <div className="flex gap-2">
            <Input.Search onChange={(e) => setSearchVal(e.target.value)} placeholder="Cari nama pelanggan" />
            <Button className="px-2 flex items-center border border-gray-400 rounded-md bg-white cursor-pointer">
              <GiSettingsKnobs size={18} />
            </Button>
            <Popconfirm
              title="Hapus pesanan"
              okButtonProps={{ danger: true, loading: loadingDelete }}
              description="Apakah anda yakin ingin menghapus pesanan yang dipilih?"
              onConfirm={handleBulkDelete}
            >
              <Button
                danger
                loading={loadingDelete}
                disabled={loadingDelete}
                className={`px-2 flex items-center border border-gray-400 transition-opacity duration-100 rounded-md bg-white cursor-pointer  ${
                  selectedRow.length > 0 ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                } `}
              >
                <BsFillTrashFill size={18} />
              </Button>
            </Popconfirm>
          </div>
          <Button
            onClick={() => {
              router.push("/dashboard/purchase-order/tambah");
            }}
            type="primary"
            className="flex gap-2 items-center"
          >
            <div className="flex items-center gap-2">
              <AiOutlinePlus size={18} />
              <span>Tambah Pembelian</span>
            </div>
          </Button>
        </div>
      }
    >
      {loading ? (
        <SkeletonTable />
      ) : (
        <>
          <Table
            bordered
            // rowSelection={{
            //   type: "checkbox",
            //   ...rowSelection,
            // }}
            expandable={{
              expandedRowRender: (record) => <DetailPembelian pembelian={record} />,
              expandedRowClassName: () => "bg-white",
            }}
            onRow={(record) => {
              return {
                onClick: () => {
                  setPembelianId(record.id);
                },
              };
            }}
            rowKey={(item) => item.id}
            size="small"
            rootClassName={`rounded-md ${inria.className} `}
            columns={columns}
            rowClassName={`${inria.className} text-sm`}
            dataSource={data || []}
          />
        </>
      )}
    </DashboardLayout>
  );
}
