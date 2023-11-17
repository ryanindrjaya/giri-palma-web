import DashboardLayout, { inria } from "@/layout/dashboard.layout";
import { Button, Descriptions, DescriptionsProps, Input, Modal, Popconfirm, Table, Tag, Tooltip } from "antd";
import { GiSettingsKnobs } from "react-icons/gi";
import { AiOutlinePlus } from "react-icons/ai";
import React, { useState, useEffect, useRef } from "react";
import useQuery from "@/hooks/useQuery";
import SkeletonTable from "@/components/SkeletonTable";
import type { ColumnsType } from "antd/es/table";
import { BsFillTrashFill } from "react-icons/bs";
import useDebounce from "@/hooks/useDebounce";
import useMutation from "@/hooks/useMutation";
import { useRouter } from "next/router";
import { NotificationInstance } from "antd/es/notification/interface";

import { FaInfoCircle, FaPrint } from "react-icons/fa";
import { parseHarga } from "@/lib/helpers/parseNumber";
import { DetailPembelian, Pembelian, PembelianDetail } from "@/types/pembelian.type";
import Link from "next/link";
import PrintPO from "@/components/PrintPO";
import { useReactToPrint } from "react-to-print";
import { PESANAN_COLOR, PESANAN_TEXT_COLOR } from "@/lib/constant/icon_color";

import Cookies from "js-cookie";
import fetcher from "@/lib/axios";
import { LoadingOutlined } from "@ant-design/icons";

type Props = {
  notificationApi: NotificationInstance;
};

export default function PurchaseOrder({ notificationApi }: Props) {
  const router = useRouter();
  const [searchVal, setSearchVal] = useState<string>("");
  const debouncedSearchVal = useDebounce(searchVal, 500);
  const [selectedRow, setSelectedRow] = useState<Pembelian[]>([]);
  const { data, loading, refetch } = useQuery<Pembelian[]>("/api/admin/pembelian");
  const [deletePembelian, { loading: loadingDelete }] = useMutation("/api/admin/pembelian", "delete");
  const [editPembelian, { loading: loadingEdit }] = useMutation("/api/admin/pembelian", "put");

  const [pembelianDetail, setPembelianDetail] = useState<DetailPembelian | null>(null);
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    pageStyle: "@page { size: A5 landscape; margin: 2mm; }",
  });

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
    {
      title: "Action",
      align: "center",
      render: (_, item) => (
        <div className="flex justify-center items-center gap-2">
          <Tooltip title="Lihat Detail">
            <Link href={`/dashboard/purchase-order/${item.id}`}>
              <Button type="primary" className="flex p-1 justify-center items-center">
                <FaInfoCircle size={18} />
              </Button>
            </Link>
          </Tooltip>
          <Tooltip title="Cetak PO">
            <Button
              onClick={() => fetchDetailPembelian(item.id)}
              type="primary"
              className="flex p-1 justify-center items-center"
            >
              <FaPrint size={18} />
            </Button>
          </Tooltip>
        </div>
      ),
    },
  ];

  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: Pembelian[]) => {
      setSelectedRow(selectedRows);
    },
  };

  const fetchDetailPembelian = async (id: string) => {
    notificationApi.info({
      message: "Loading",
      icon: <LoadingOutlined />,
      description: "Sedang mengambil data pembelian",
      placement: "topRight",
    });
    try {
      const jwt = Cookies.get("jwt");
      const res = await fetcher.get<{ data: DetailPembelian }>(`/api/admin/pembelian/${id}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      const data = res.data.data as DetailPembelian;

      setPembelianDetail(data);
    } catch (error: any) {
      console.log(error);
      notificationApi.error({
        message: "Gagal",
        description: error?.response?.data?.message || "Gagal mengambil data pembelian",
        placement: "topRight",
      });
    } finally {
      notificationApi.destroy();
    }
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
    <>
      <Modal
        open={!!pembelianDetail}
        onOk={handlePrint}
        onCancel={() => setPembelianDetail(null)}
        okText="Cetak"
        cancelText="Batal"
        centered
        title="Cetak Purchase Order"
        width={1000}
      >
        <div className="w-full flex justify-center">
          <PrintPO data={pembelianDetail} ref={printRef} />
        </div>
      </Modal>
      <DashboardLayout
        title="Purchase Order"
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
    </>
  );
}
