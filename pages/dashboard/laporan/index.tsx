import useQuery from "@/hooks/useQuery";
import DashboardLayout from "@/layout/dashboard.layout";
import { parseHarga } from "@/lib/helpers/parseNumber";
import { Laporan } from "@/types/report.type";
import { Button, DatePicker, Table } from "antd";
import { ColumnType } from "antd/es/table";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useState } from "react";
import { SiMicrosoftexcel } from "react-icons/si";
import * as ExcelJS from "exceljs";
import { NotificationInstance } from "antd/es/notification/interface";

type Props = {
  notificationApi: NotificationInstance;
};

export default function LaporanIndex({ notificationApi }: Props) {
  const { data, loading, refetch } = useQuery<Laporan[]>("/api/admin/laporan");
  const [date, setDate] = useState<[string, string] | null>(null);

  const columns: ColumnType<Laporan>[] = [
    {
      title: "#",
      render: (_, __, i) => i + 1,
    },
    {
      title: "Nama Pelanggan",
      dataIndex: "nama_pelanggan",
    },
    {
      title: "Sales",
      dataIndex: "nama_sales",
    },
    {
      title: "Tanggal Pesanan",
      render: (_, __, i) => dayjs(_.tanggal_pesanan).format("DD/MM/YYYY"),
    },
    {
      title: "No. Pesanan",
      dataIndex: "nomor_pesanan",
    },
    {
      title: "Total Pesanan",
      render: (item) => `Rp ${parseHarga(item.total_pesanan)}`,
    },
    {
      title: "Tanggal PO",
      render: (_, __, i) => dayjs(_.tanggal_po).format("DD/MM/YYYY"),
    },
    {
      title: "No. PO",
      dataIndex: "nomor_po",
    },
    {
      title: "Total PO",
      render: (item) => `Rp ${parseHarga(item.total_nilai_po)}`,
    },
  ];

  const downloadExcel = useCallback(async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Laporan");

    if (data) {
      const firstData = data[0];

      worksheet.columns = Object.keys(firstData).map((item) => ({
        header: item
          .split("_")
          .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
          .join(" "),
        key: item,
        width: item.split("_").join(" ").length + 5,
      }));

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.border = {
        top: { style: "thin", color: { argb: "000000" } },
        left: { style: "thin", color: { argb: "000000" } },
        bottom: { style: "thin", color: { argb: "000000" } },
        right: { style: "thin", color: { argb: "000000" } },
      };

      data.forEach((item) => {
        const dataRow = worksheet.addRow(item);

        [8, 16, 17, 18, 19, 20].forEach((item) => {
          dataRow.getCell(item).numFmt = "#,##0;[Red]-#,##0";
        });

        dataRow.border = {
          top: { style: "thin", color: { argb: "000000" } },
          left: { style: "thin", color: { argb: "000000" } },
          bottom: { style: "thin", color: { argb: "000000" } },
          right: { style: "thin", color: { argb: "000000" } },
        };
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = `Laporan.xlsx`;

      a.click();
    } else {
      notificationApi.error({
        message: "Gagal mengunduh laporan",
        description: "Data laporan tidak ditemukan",
        placement: "topRight",
      });
    }
  }, [data]);

  useEffect(() => {
    if (date) {
      refetch({ start_date: date[0], end_date: date[1] });
    } else {
      refetch();
    }
  }, [date]);

  return (
    <DashboardLayout
      title="Laporan"
      isLoading={loading}
      header={
        <div className="w-full flex justify-between items-center">
          <div>
            <DatePicker.RangePicker
              value={date ? [dayjs(date[0]), dayjs(date[1])] : undefined}
              onChange={(date) => {
                if (date) {
                  const start = dayjs(date[0]).format("YYYY-MM-DD");
                  const end = dayjs(date[1]).format("YYYY-MM-DD");
                  setDate([start, end]);
                } else {
                  setDate(null);
                }
              }}
            />
          </div>

          <Button onClick={downloadExcel} type="primary" className="flex gap-2 items-center">
            <div className="flex items-center gap-2">
              <SiMicrosoftexcel size={18} />
              <span>Download Excel</span>
            </div>
          </Button>
        </div>
      }
    >
      <Table bordered size="small" columns={columns} dataSource={data || []} />
    </DashboardLayout>
  );
}
