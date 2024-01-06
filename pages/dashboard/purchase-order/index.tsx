import DashboardLayout, { inria } from "@/layout/dashboard.layout";
import { Button, Input, Modal, Popconfirm, Popover, Select, Table, Tag, Tooltip } from "antd";
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
import { MdPayment } from "react-icons/md";
import { FaInfoCircle, FaPrint, FaTrash } from "react-icons/fa";
import { parseHarga } from "@/lib/helpers/parseNumber";
import { DetailPembelian, Pembelian } from "@/types/pembelian.type";
import Link from "next/link";
import PrintPO from "@/components/PrintPO";
import { useReactToPrint } from "react-to-print";
import { PESANAN_COLOR, PESANAN_TEXT_COLOR } from "@/lib/constant/icon_color";

import Cookies from "js-cookie";
import fetcher from "@/lib/axios";
import { LoadingOutlined, MenuOutlined } from "@ant-design/icons";
import { SuratJalanType } from "@/types/surat-jalan.type";
import { IoDocumentAttachOutline } from "react-icons/io5";
import dayjs from "dayjs";

const key = "notification-sr";

type Props = {
  notificationApi: NotificationInstance;
};

export default function PurchaseOrder({ notificationApi }: Props) {
  const router = useRouter();
  const [searchVal, setSearchVal] = useState<string>("");
  const debouncedSearchVal = useDebounce(searchVal, 500);
  const [loadingSuratJalan, setLoadingSuratJalan] = useState<boolean>(false);
  const [selectedRow, setSelectedRow] = useState<Pembelian[]>([]);
  const { data, loading, refetch } = useQuery<Pembelian[]>("/api/admin/pembelian");
  const [cancelPembelian, { loading: loadingCancel }] = useMutation("/api/admin/pembelian/cancel", "post", {
    onSuccess: () => {
      notificationApi.success({
        message: "Berhasil",
        description: "Berhasil membatalkan pembelian",
        placement: "topRight",
      });

      setPembelianId(null);
      setCancelMsg("");

      refetch();
    },
  });
  const [deletePembelian, { loading: loadingDelete }] = useMutation("/api/admin/pembelian", "delete");
  const [editPembelian, { loading: loadingEdit }] = useMutation("/api/admin/pembelian", "put");
  const [postSR] = useMutation("/api/admin/surat-jalan", "post", {
    onSuccess: (data: { data: SuratJalanType }) => {
      const bodyChangeStatus = {
        status: "Dikirim",
      };

      editPembelian(bodyChangeStatus, data.data?.pembelian_id).catch((error) => {
        notificationApi.error({
          message: "Gagal mengubah status pembelian",
          description: error?.response?.data?.message || "Gagal mengubah status pembelian",
          placement: "topRight",
        });
      });

      notificationApi.open({
        key,
        type: "success",
        message: "Berhasil",
        description: "Berhasil membuat surat jalan, mengarahkan ke halaman surat jalan",
        placement: "topRight",
      });

      setTimeout(() => {
        router.push(`/dashboard/surat-jalan?ref=${data?.data?.id}`);
        notificationApi.destroy();
      }, 1000);

      setLoadingSuratJalan(false);
    },
  });

  const [pembelianId, setPembelianId] = useState<string | null>(null);
  const [cancelMsg, setCancelMsg] = useState<string>("");

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

  const redirectPembayaran = (id: string) => {
    router.push(`/dashboard/purchase-order/${id}/pembayaran`);
  };

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
      title: "Tanggal Pembelian",
      key: "tanggal_pembelian",
      render: (_v, item) => dayjs(item.created_at).format("DD/MM/YYYY"),
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
      title: "Sales",
      key: "sales",
      dataIndex: ["user", "nama"],
    },
    {
      title: "Total Pembelian",
      key: "total",
      render: (_v, item) => `Rp ${parseHarga(item?.total || 0)}`,
    },
    {
      title: "Uang Muka",
      key: "uang_muka",
      render: (_v, item) => `Rp ${parseHarga((item?.uang_muka || 0) - (item?.uang_tukar_tambah || 0))}`,
    },
    {
      title: "Tukar Tambah",
      key: "uang_muka",
      render: (_v, item) => `Rp ${parseHarga(item?.uang_tukar_tambah || 0)}`,
    },
    {
      title: "Sisa Pembayaran",
      key: "sisa_pembayaran",
      render: (_v, item) => `Rp ${parseHarga(item?.sisa_pembayaran || 0)}`,
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
              <Tooltip title="Pembayaran">
                <Button
                  onClick={() => redirectPembayaran(item.id)}
                  type="primary"
                  className="flex p-1 justify-center items-center"
                >
                  <MdPayment size={18} />
                </Button>
              </Tooltip>
              <Tooltip title="Buat Surat Jalan">
                <Button
                  loading={loadingSuratJalan}
                  onClick={() => createSuratJalan(item.id)}
                  type="primary"
                  className="flex p-1 justify-center items-center"
                >
                  <IoDocumentAttachOutline size={18} />
                </Button>
              </Tooltip>
              <Tooltip title="Batalkan PO">
                <Button
                  onClick={() => setPembelianId(item.id)}
                  type="primary"
                  className="flex p-1 justify-center items-center"
                  danger
                >
                  <FaTrash size={18} />
                </Button>
              </Tooltip>
            </div>
          }
        >
          <Button>
            <MenuOutlined className="cursor-pointer" />
          </Button>
        </Popover>
      ),
    },
  ];

  const cekSuratJalan = async (id: string): Promise<string | null> => {
    try {
      const jwt = Cookies.get("jwt");
      const res = await fetcher.get<{ data: SuratJalanType[] }>(`/api/admin/surat-jalan?pembelian_id=${id}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (res.data.data.length > 0) {
        return res.data.data[0].id;
      }

      return null;
    } catch (error: any) {
      return null;
    }
  };

  const generateNomorSuratJalan = async (): Promise<string | null> => {
    try {
      const jwt = Cookies.get("jwt");
      const res = await fetcher.get<{ data: { nomor: string } }>(`/api/generate/surat-jalan`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (res.data.data) {
        return res.data.data.nomor;
      }

      return null;
    } catch (error: any) {
      return null;
    }
  };

  const createSuratJalan = async (id: string) => {
    setLoadingSuratJalan(true);

    notificationApi.open({
      key,
      type: "info",
      message: "Membuat surat jalan",
      icon: <LoadingOutlined />,
      description: "Surat jalan sedang dibuat harap tunggu",
      placement: "topRight",
      duration: 10000,
    });

    try {
      const isAlreadyPaired = await cekSuratJalan(id);

      if (isAlreadyPaired) {
        notificationApi.open({
          key,
          type: "error",
          message: "Gagal",
          description: (
            <div>
              <p className="m-0">
                Surat jalan dengan pembelian yang dipilih sudah dibuat, silahkan cek di halaman surat jalan
              </p>
              <div className="flex mt-2 justify-end">
                <Button
                  onClick={() => {
                    router.push(`/dashboard/surat-jalan?ref=${isAlreadyPaired}`);
                    notificationApi.destroy();
                  }}
                  type="link"
                  className="flex p-1 justify-center items-center"
                >
                  Lihat Surat Jalan
                </Button>
              </div>
            </div>
          ),
          placement: "topRight",
        });
        setLoadingSuratJalan(false);
        return;
      }

      const nomor = await generateNomorSuratJalan();

      if (!nomor) {
        notificationApi.open({
          key,
          type: "error",
          message: "Gagal",
          description: "Gagal mendapatkan nomor surat jalan, harap coba lagi nanti",
          placement: "topRight",
        });
        setLoadingSuratJalan(false);
        return;
      }

      const body = {
        nomor_surat_jalan: nomor,
        pembelian_id: id,
      };

      postSR(body).catch((error) => {
        notificationApi.open({
          key,
          type: "error",
          message: "Gagal membuat surat jalan",
          description: error?.response?.data?.message || "Gagal membuat surat jalan",
          placement: "topRight",
        });
        setLoadingSuratJalan(false);
      });
    } catch (error: any) {
      notificationApi.error({
        message: "Gagal",
        description: error?.response?.data?.message || "Gagal membuat surat jalan",
        placement: "topRight",
      });
      setLoadingSuratJalan(false);
    }
  };

  const changeStatus = async (id: string, status: string) => {
    const body = {
      status,
    };

    editPembelian(body, id).catch((error) => {
      notificationApi.error({
        message: "Gagal mengubah status pembelian",
        description: error?.response?.data?.message || "Gagal mengubah status pembelian",
        placement: "topRight",
      });
    });
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

  const handleCancel = () => {
    if (!cancelMsg) {
      notificationApi.error({
        message: "Gagal",
        description: "Alasan pembatalan harus diisi",
        placement: "topRight",
      });
      return;
    }

    if (!pembelianId) {
      notificationApi.error({
        message: "Gagal",
        description: "Pembatalan tidak diketahui",
        placement: "topRight",
      });
      return;
    }

    cancelPembelian({ alasan: cancelMsg }, pembelianId).catch((error) => {
      notificationApi.error({
        message: "Gagal",
        description: error?.response?.data?.message || "Gagal membatalkan pembelian",
        placement: "topRight",
      });
    });
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

      <Modal
        open={!!pembelianId}
        okButtonProps={{ loading: loadingCancel, danger: true }}
        title="Batalkan PO"
        okText="Ya"
        cancelText="Batal"
        onOk={handleCancel}
        onCancel={() => {
          setPembelianId(null);
          setCancelMsg("");
        }}
      >
        <p>
          Harap masukkan alasan pembatalan PO. Pembatalan PO akan mengubah status pesanan menjadi &apos;Dipesan&apos;
        </p>
        <Input.TextArea className="mt-4" rows={4} value={cancelMsg} onChange={(e) => setCancelMsg(e.target.value)} />
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
