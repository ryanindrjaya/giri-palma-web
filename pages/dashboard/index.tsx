import DashboardLayout, { inria } from "@/layout/dashboard.layout";
import { parseHarga } from "@/lib/helpers/parseNumber";
import { User } from "@/types/login.type";
import { Card, Select, Statistic, Table } from "antd";
import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { colors } from "@/lib/constant/colors";
import { Analytic, AnalyticRequest } from "@/types/analytic.type";
import useMutation from "@/hooks/useMutation";
import { parseToOption } from "@/lib/helpers/parseToOption";
import dayjs from "dayjs";
import { NotificationInstance } from "antd/es/notification/interface";
import { ColumnsType } from "antd/es/table";
import { Pelanggan } from "@/types/pelanggan.type";

type Props = {
  notificationApi: NotificationInstance;
};

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function Dashboard({ notificationApi }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [option, setOption] = useState<string>("daily");
  const [data, setData] = useState<Analytic | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [get] = useMutation<Analytic, AnalyticRequest>("/api/admin/analytics/dashboard", "post");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      setUser(JSON.parse(user || "{}"));
    }
  }, []);

  const pesananChartOption: ApexOptions | undefined = useMemo(() => {
    if (data) {
      const options: ApexOptions = {
        chart: {
          id: "pesanan-chart",
          fontFamily: inria.style.fontFamily,
        },
        xaxis: {
          categories: data.pesanan.chart_data.map((item) => item.time),
          labels: {
            rotateAlways: true,
          },
        },
        yaxis: {
          title: {
            text: "Total Pesanan",
          },
          labels: {
            formatter: (value) => {
              return `Rp ${parseHarga(value)}`;
            },
          },
        },
        dataLabels: {
          enabled: false,
        },
      };

      return options;
    }

    return undefined;
  }, [data]);

  const pembelianChartOption: ApexOptions | undefined = useMemo(() => {
    if (data) {
      const options: ApexOptions = {
        chart: {
          id: "pembelian-chart",
          fontFamily: inria.style.fontFamily,
        },
        xaxis: {
          categories: data.pembelian.chart_data.map((item) => item.time),
          labels: {
            rotateAlways: true,
          },
        },
        yaxis: {
          title: {
            text: "Total Pembelian",
          },
          labels: {
            formatter: (value) => {
              return `Rp ${parseHarga(value)}`;
            },
          },
        },
        dataLabels: {
          enabled: false,
        },
      };
      return options;
    }

    return undefined;
  }, [data]);

  const pelangganBaruChartOption: ApexOptions | undefined = useMemo(() => {
    if (data) {
      const options: ApexOptions = {
        chart: {
          id: "pengguna-baru-chart",
          fontFamily: inria.style.fontFamily,
        },
        stroke: {
          curve: "smooth",
        },
        xaxis: {
          categories: data.pelanggan.chart_data.map((item) => item.time),
          labels: {
            rotateAlways: true,
          },
        },
        yaxis: {
          labels: {
            formatter: (value) => {
              return `${value}`;
            },
          },
        },
      };

      return options;
    }
    return undefined;
  }, [data]);

  const pesananSeries: ApexAxisChartSeries | undefined = useMemo(() => {
    if (data) {
      const series: ApexAxisChartSeries = [
        {
          name: "Total Pesanan",
          data: data.pesanan.chart_data.map((item) => item.total_nominal),
          color: colors.primary,
        },
      ];

      return series;
    }

    return undefined;
  }, [data]);

  const pembelianSeries: ApexAxisChartSeries | undefined = useMemo(() => {
    if (data) {
      const series: ApexAxisChartSeries = [
        {
          name: "Total Pembelian",
          data: data.pembelian.chart_data.map((item) => item.total_nominal),
          color: colors.primary,
        },
      ];
      return series;
    }

    return undefined;
  }, [data]);

  const pelangganBaruSeries: ApexAxisChartSeries | undefined = useMemo(() => {
    if (data) {
      const series: ApexAxisChartSeries = [
        {
          name: "Total Pelanggan Baru",
          data: data.pelanggan.chart_data.map((item) => item.total_nominal),
          color: colors.primary,
        },
      ];
      return series;
    }

    return undefined;
  }, [data]);

  useEffect(() => {
    if (option) {
      setLoading(true);
      const startDate =
        option === "daily" ? dayjs().startOf("week").toISOString() : dayjs().startOf("month").toISOString();
      const endDate = option === "daily" ? dayjs().endOf("week").toISOString() : dayjs().endOf("month").toISOString();
      const body: AnalyticRequest = {
        option,
        started_time: startDate,
        ended_time: endDate,
      };

      get(body)
        .then((data) => {
          console.log(data);
          setData(data.data);
          setLoading(false);
        })
        .catch((error) => {
          notificationApi.error({
            message: "Error",
            description: error?.response?.data?.message || "Terjadi kesalahan",
            placement: "topRight",
          });
          setLoading(false);
        });
    }
  }, [option]);

  const pelangganBaruColumns: ColumnsType<Pelanggan> = useMemo(() => {
    const column: ColumnsType<Pelanggan> = [
      {
        title: "Kode Pelanggan",
        dataIndex: "kode",
      },
      {
        title: "Nama",
        dataIndex: "nama_merchant",
      },
      {
        title: "Sales",
        dataIndex: ["user", "nama"],
      },
    ];

    return column;
  }, [data]);

  return (
    <DashboardLayout title="Dashboard" isLoading={loading}>
      <div className="flex text-xl font-bold mb-4">
        <span>Selamat Datang</span>
        <span>, {user?.nama}</span>
      </div>

      <div className="flex gap-4 mb-4">
        <Select
          className="flex-1"
          value={option}
          options={parseToOption(["daily", "monthly"])}
          onChange={(v) => {
            setOption(v);
          }}
        />
      </div>

      <div className="bg-primary px-5 py-3 rounded-md flex justify-between flex-wrap gap-x-10 gap-y-2">
        <Card className="flex-1" bordered={false}>
          <Statistic title="Jumlah Pesanan" value={data?.pesanan.jumlah_pesanan || 0} />
        </Card>
        <Card className="flex-1" bordered={false}>
          <Statistic title="Jumlah Purchase Order" value={data?.pembelian.jumlah_pembelian || 0} />
        </Card>
        <Card className="flex-1" bordered={false}>
          <Statistic title="Nilai Pesanan" value={`Rp ${parseHarga(data?.pesanan.total_pesanan || 0)}`} />
        </Card>
        <Card className="flex-1" bordered={false}>
          <Statistic title="Nilai Purchase Order" value={`Rp ${parseHarga(data?.pembelian.total_pembelian || 0)}`} />
        </Card>
      </div>

      <div className="mt-4 flex gap-x-3 flex-wrap w-full">
        <div className="flex-1 py-3 px-5 rounded-md shadow-md">
          <Chart options={pesananChartOption} width="100%" series={pesananSeries} type="bar" height="300px" />
        </div>
        <div className="flex-1 py-3 px-5 rounded-md shadow-md">
          <Chart options={pembelianChartOption} width="100%" series={pembelianSeries} type="bar" height="300px" />
        </div>
      </div>

      <p className="text-xl mt-7 font-bold">Akuisisi Tambah Pelanggan Baru</p>
      <div className=" flex gap-x-3  flex-wrap w-full">
        <div className="flex-[0.6] py-3 px-5 rounded-md shadow-md">
          <Chart
            options={pelangganBaruChartOption}
            width="100%"
            series={pelangganBaruSeries}
            type="line"
            height="300px"
          />
        </div>
        <div className="flex-[0.4] overflow-y-scroll h-[350px]">
          <Table
            columns={pelangganBaruColumns}
            dataSource={data?.pelanggan.terbaru || []}
            size="small"
            bordered
            pagination={false}
            rowKey="id"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
