import SkeletonTable from "@/components/SkeletonTable";
import useDebounce from "@/hooks/useDebounce";
import useMutation from "@/hooks/useMutation";
import useQuery from "@/hooks/useQuery";
import DashboardLayout, { inria } from "@/layout/dashboard.layout";
import { Button, Input, Popconfirm, Popover, Table, Tag, Tooltip } from "antd";
import { NotificationInstance } from "antd/es/notification/interface";
import type { ColumnsType } from "antd/es/table";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { AiOutlineEdit, AiOutlinePlus } from "react-icons/ai";
import { BsFillTrashFill } from "react-icons/bs";
import { GiSettingsKnobs } from "react-icons/gi";

import { Pesanan as PesananType } from "@/types/pesanan.type";

import { parseHarga } from "@/lib/helpers/parseNumber";
import { MenuOutlined } from "@ant-design/icons";
import Link from "next/link";
import { BiPurchaseTag } from "react-icons/bi";
import { FaBox, FaInfoCircle } from "react-icons/fa";
import { FiTruck } from "react-icons/fi";
import { IoAlertCircleOutline } from "react-icons/io5";
type Props = {
  notificationApi: NotificationInstance;
};

export const PESANAN_COLOR = {
  Dipesan: "#F2D8D8",
  Dikirim: "#F2ECB3",
  Terkirim: "#B9E7A3",
  Dibatalkan: "red-inverse",
  Diterima: "green-inverse",
};

export const PESANAN_TEXT_COLOR = {
  Dipesan: "#B87070",
  Dikirim: "#5E5E5E",
  Terkirim: "#3A4F26",
  Diterima: "#FFFFFF",
  Dibatalkan: "#FFFFFF",
};

export const PESANAN_ICON = {
  Dipesan: <IoAlertCircleOutline size={18} />,
  Dikirim: <FaBox size={18} />,
  Terkirim: <FiTruck size={18} />,
};

export default function Pesanan({ notificationApi }: Props) {
  const router = useRouter();
  const [searchVal, setSearchVal] = useState<string>("");
  const debouncedSearchVal = useDebounce(searchVal, 500);
  const [selectedRow, setSelectedRow] = useState<PesananType[]>([]);
  const { data, loading, refetch } = useQuery<PesananType[]>("/api/admin/pesanan");
  const [deletePesanan, { loading: loadingDelete }] = useMutation("/api/admin/pesanan", "delete");
  const [editPesanan, { loading: loadingEdit }] = useMutation("/api/admin/pesanan", "put");

  const [pesananId, setPesananId] = useState<string | null>(null);

  useEffect(() => {
    if (debouncedSearchVal) {
      refetch({ nama_pelanggan: debouncedSearchVal });
    } else {
      refetch();
    }
  }, [debouncedSearchVal]);

  const columns: ColumnsType<PesananType> = [
    {
      title: "#",
      width: 50,
      align: "center",
      render: (_v, _, index) => index + 1,
    },
    {
      title: "Nomor Pesanan",
      dataIndex: "nomor_pesanan",
      key: "nomor_pesanan",
    },
    {
      title: "Pelanggan",
      dataIndex: ["pelanggan", "nama_merchant"],
      key: "pelanggan",
    },
    {
      title: "Status Pengiriman",
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
            <span className=" font-bold">{status}</span>
          </Tag>
        );
      },
    },
    {
      title: "Status Pembayaran",
      key: "status_pembayaran",
      width: 150,
      render: (_v, item) => {
        const status: string = item.status_pembayaran;
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

        return (
          <Tag color={color} className="flex gap-1 items-center w-fit">
            {status}
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
      render: (_v, item) => `Rp ${parseHarga((item?.uang_muka || 0))}`,
    },
    {
      title: "Tukar Tambah",
      key: "uang_muka",
      render: (_v, item) => `Rp ${parseHarga(item?.uang_tukar_tambah || 0)}`,
    },
    {
      title: "Catatan",
      key: "catatan",
      dataIndex: "catatan",
    },
    {
      title: "Action",
      align: "center",
      render: (_, item) => (
        <Popover
          trigger="click"
          placement="bottomLeft"
          content={
            <div className="flex justify-center items-center gap-2">
              <Tooltip title="Lihat Detail">
                <Link href={`/dashboard/pesanan/${item.id}`}>
                  <Button type="primary" className="flex p-1 justify-center items-center">
                    <FaInfoCircle size={18} />
                  </Button>
                </Link>
              </Tooltip>
              {!item.paired && item.status !== "Dibatalkan" ? (
                <>
                  <Tooltip title="Edit Pesanan">
                    <Button
                      onClick={() => router.push(`/dashboard/pesanan/${item.id}/edit`)}
                      type="primary"
                      className="flex p-1 justify-center items-center"
                    >
                      <AiOutlineEdit size={18} />
                    </Button>
                  </Tooltip>
                  <Tooltip title="Jadikan PO">
                    <Popconfirm
                      disabled={item.paired}
                      okText="Ya"
                      cancelText="Tidak"
                      onConfirm={() => router.push(`/dashboard/purchase-order/tambah?ref=${item.id}`)}
                      title={`Jadikan pesanan ${item.nomor_pesanan} menjadi PO?`}
                      description="Apakah anda yakin ingin meneruskan status pesanan menjadi PO?"
                      trigger="click"
                      className={`${item.status === "Dipesan" ? "block" : "hidden"}`}
                      placement="left"
                    >
                      <Button type="primary" disabled={item.paired} className="flex p-1 justify-center items-center">
                        <BiPurchaseTag size={18} />
                      </Button>
                    </Popconfirm>
                  </Tooltip>
                </>
              ) : null}
            </div>
          }
        >
          <Button className="relative">
            <MenuOutlined className="cursor-pointer" />
            {!item.paired && item.status !== "Dibatalkan" ? (
              <div className="absolute w-3 h-3 bg-primary rounded-full -top-1 -right-1"></div>
            ) : null}
          </Button>
        </Popover>
      ),
    },
  ];

  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: PesananType[]) => {
      setSelectedRow(selectedRows);
    },
  };

  const handleBulkDelete = async () => {
    try {
      const promises = selectedRow.map((item) => deletePesanan(undefined, item.id));
      const resolved = await Promise.all(promises);

      if (resolved.every((item) => item.status === 200)) {
        notificationApi.success({
          message: "Berhasil",
          description: "Berhasil menghapus pesanan",
          placement: "topRight",
        });
      }

      setSelectedRow([]);
      refetch();
    } catch (error: any) {
      console.log(error);
      notificationApi.error({
        message: "Gagal",
        description: error?.response?.data?.message || "Gagal menghapus pesanan",
        placement: "topRight",
      });
    }
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
                className={`px-2 flex items-center border border-gray-400 transition-opacity duration-100 rounded-md bg-white cursor-pointer  ${selectedRow.length > 0 ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                  } `}
              >
                <BsFillTrashFill size={18} />
              </Button>
            </Popconfirm>
          </div>
          <Button
            onClick={() => {
              router.push("/dashboard/pesanan/tambah");
            }}
            disabled
            type="primary"
            className="flex gap-2 items-center"
          >
            <div className="flex items-center gap-2">
              <AiOutlinePlus size={18} />
              <span>Tambah Pesanan</span>
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
            onRow={(record) => {
              return {
                onClick: () => {
                  setPesananId(record.id);
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
