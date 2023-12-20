import DashboardLayout, { inria } from "@/layout/dashboard.layout";
import { Button, Input, Modal, Popconfirm, Table, Tag, Tooltip } from "antd";
import { GiSettingsKnobs } from "react-icons/gi";
import { AiOutlinePlus } from "react-icons/ai";
import React, { useState, useEffect, useRef } from "react";
import useQuery from "@/hooks/useQuery";
import SkeletonTable from "@/components/SkeletonTable";
import type { ColumnsType } from "antd/es/table";
import useDebounce from "@/hooks/useDebounce";
import useMutation from "@/hooks/useMutation";
import { useRouter } from "next/router";
import { NotificationInstance } from "antd/es/notification/interface";
import { FaPrint } from "react-icons/fa";
import { useReactToPrint } from "react-to-print";

import Cookies from "js-cookie";
import fetcher from "@/lib/axios";
import { CheckOutlined, DeleteOutlined, LoadingOutlined, StopOutlined } from "@ant-design/icons";
import { SuratJalanType } from "@/types/surat-jalan.type";
import PrintSR from "@/components/PrintSR";

type Props = {
  notificationApi: NotificationInstance;
};

export default function SuratJalan({ notificationApi }: Props) {
  const router = useRouter();
  const [searchVal, setSearchVal] = useState<string>("");
  const debouncedSearchVal = useDebounce(searchVal, 500);
  const [selectedRow, setSelectedRow] = useState<SuratJalanType[]>([]);
  const { data, loading, refetch } = useQuery<SuratJalanType[]>("/api/admin/surat-jalan");
  const [editPembelian] = useMutation("/api/admin/pembelian", "put");
  const [deleteSuratJalan, { loading: loadingDelete }] = useMutation("/api/admin/surat-jalan", "delete", {
    onSuccess: () => {
      notificationApi.success({
        message: "Berhasil",
        description: "Berhasil menghapus surat jalan",
        placement: "topRight",
      });
      refetch();
    },
  });
  const [cancel, { loading: loadingCancel }] = useMutation("/api/admin/surat-jalan/cancel", "post", {
    onSuccess: (data: { data: SuratJalanType }) => {
      const editPOBody = {
        status: "Dipesan",
      };

      editPembelian(editPOBody, data.data?.pembelian_id).catch((err) => {
        console.log(err);
        notificationApi.error({
          message: "Gagal",
          description: err?.response?.data?.message || "Gagal mengubah status PO",
          placement: "topRight",
        });
      });

      setSuratJalanId(null);
      setCancelMsg("");

      notificationApi.success({
        message: "Berhasil",
        description: "Berhasil membatalkan surat jalan",
        placement: "topRight",
      });
      refetch();
    },
  });

  const [suratJalanId, setSuratJalanId] = useState<string | null>(null);
  const [cancelMsg, setCancelMsg] = useState<string>("");

  const [suratJalanDetail, setSuratJalanDetail] = useState<SuratJalanType | null>(null);
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

  const batalSuratJalan = () => {
    cancel({ id: suratJalanId, cancel_message: cancelMsg }).catch((err) => {
      console.log(err);
      notificationApi.error({
        message: "Gagal",
        description: err?.response?.data?.message || "Gagal membatalkan surat jalan",
        placement: "topRight",
      });
    });
  };

  const confirmSuratJalan = (pembelianId: string) => {
    const body = {
      status: "Diterima",
    };

    editPembelian(body, pembelianId)
      .then(() => {
        notificationApi.success({
          message: "Berhasil",
          description: "Berhasil konfirmasi pengiriman surat jalan",
          placement: "topRight",
        });
        refetch();
      })
      .catch((err) => {
        console.log(err);
        notificationApi.error({
          message: "Gagal",
          description: err?.response?.data?.message || "Gagal mengubah status pembelian",
          placement: "topRight",
        });
      });
  };

  const columns: ColumnsType<SuratJalanType> = [
    {
      title: "#",
      width: 50,
      align: "center",
      render: (_v, _, index) => index + 1,
    },
    {
      title: "Nomor Surat Jalan",
      dataIndex: "nomor_surat_jalan",
      key: "nomor_surat_jalan",
    },

    {
      title: "Status",
      key: "status",
      width: 150,
      render: (_v, item) => {
        const status: string = item.status;
        let color: string;

        switch (status) {
          case "CREATED":
            color = "green";
            break;
          case "CANCELED":
            color = "red";
            break;
          default:
            color = "blue";
        }

        return (
          <Tag color={color} className="flex gap-1 items-center w-fit">
            {status}
          </Tag>
        );
      },
    },
    {
      title: "Action",
      align: "center",
      render: (_, item) =>
        item.status !== "CANCELED" ? (
          <div className="flex justify-center items-center gap-2">
            <Tooltip title="Cetak Surat Jalan">
              <Button
                onClick={() => fetchDetailSuratJalan(item.id)}
                type="primary"
                className="flex p-1 justify-center items-center"
              >
                <FaPrint size={18} />
              </Button>
            </Tooltip>
            <Popconfirm
              title="Verifikasi pengiriman barang?"
              description="Pastikan barang sudah dikirimkan ke pelanggan"
              onConfirm={() => confirmSuratJalan(item.pembelian_id)}
              okText="Ya"
              cancelText="Batal"
              placement="bottom"
            >
              <Tooltip title="Konfirmasi pengiriman">
                <Button type="primary" className="flex p-1 justify-center bg-success items-center">
                  <CheckOutlined size={18} />
                </Button>
              </Tooltip>
            </Popconfirm>
            <Tooltip title="Batalkan">
              <Button
                onClick={() => setSuratJalanId(item.id)}
                type="primary"
                loading={loadingCancel}
                danger
                className="flex p-1 justify-center items-center"
              >
                <StopOutlined size={18} />
              </Button>
            </Tooltip>
          </div>
        ) : null,
    },
  ];

  const fetchDetailSuratJalan = async (id: string) => {
    notificationApi.info({
      message: "Loading",
      icon: <LoadingOutlined />,
      description: "Sedang mengambil data surat jalan",
      placement: "topRight",
    });
    try {
      const jwt = Cookies.get("jwt");
      const res = await fetcher.get<{ data: SuratJalanType }>(`/api/admin/surat-jalan/${id}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      const data = res.data.data as SuratJalanType;

      setSuratJalanDetail(data);
    } catch (error: any) {
      console.log(error);
      notificationApi.error({
        message: "Gagal",
        description: error?.response?.data?.message || "Gagal mengambil data surat jalan",
        placement: "topRight",
      });
    } finally {
      notificationApi.destroy();
    }
  };

  const handleBulkDelete = async () => {
    try {
      const promises = selectedRow.map((item) => deleteSuratJalan(undefined, item.id));
      const resolved = await Promise.all(promises);

      if (resolved.every((item) => item.status === 200)) {
        notificationApi.success({
          message: "Berhasil",
          description: "Berhasil menghapus surat jalan",
          placement: "topRight",
        });
      }

      setSelectedRow([]);
      refetch();
    } catch (error: any) {
      console.log(error);
      notificationApi.error({
        message: "Gagal",
        description: error?.response?.data?.message || "Gagal menghapus surat jalan",
        placement: "topRight",
      });
    }
  };

  useEffect(() => {
    if (router.query?.ref) {
      fetchDetailSuratJalan(router.query.ref as string);
    }
  }, [router.query]);

  return (
    <>
      <Modal
        open={!!suratJalanDetail}
        onOk={handlePrint}
        onCancel={() => {
          setSuratJalanDetail(null);
          router.push("/dashboard/surat-jalan", undefined, { shallow: true });
        }}
        okText="Cetak"
        cancelText="Batal"
        centered
        title="Cetak Surat Jalan"
        width={1000}
      >
        <div className="w-full flex justify-center">
          <PrintSR data={suratJalanDetail} ref={printRef} />
        </div>
      </Modal>
      <Modal
        open={!!suratJalanId}
        onOk={batalSuratJalan}
        onCancel={() => {
          setSuratJalanId(null);
          setCancelMsg("");
        }}
        title="Batalkan Surat Jalan"
        okText="Ya"
        cancelText="Batal"
        okButtonProps={{ danger: true, loading: loadingCancel }}
      >
        <p>
          Harap masukkan alasan pembatalan surat jalan. Pembatalan surat jalan akan mengubah status PO menjadi
          &apos;Dipesan&apos;
        </p>
        <Input.TextArea className="mt-4" rows={4} value={cancelMsg} onChange={(e) => setCancelMsg(e.target.value)} />
      </Modal>
      <DashboardLayout
        title="Surat Jalan"
        header={
          <div className="w-full flex justify-between items-center">
            <div className="flex gap-2">
              <Input.Search onChange={(e) => setSearchVal(e.target.value)} placeholder="Cari nama pelanggan" />
              <Button className="px-2 flex items-center border border-gray-400 rounded-md bg-white cursor-pointer">
                <GiSettingsKnobs size={18} />
              </Button>
            </div>
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
