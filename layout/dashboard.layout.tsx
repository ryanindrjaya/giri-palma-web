import { Avatar, Breadcrumb, Dropdown, Layout, Menu, Typography, theme } from "antd";
import type { MenuProps } from "antd";
import { Inria_Sans } from "next/font/google";
import Head from "next/head";
import { useRouter } from "next/router";
import React from "react";
import { MdOutlineDashboard } from "react-icons/md";
import { FiTruck, FiUsers } from "react-icons/fi";
import { BsBasket } from "react-icons/bs";
import { AiOutlineTag } from "react-icons/ai";
import { CiBoxes } from "react-icons/ci";
import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import Cookies from "js-cookie";
import SkeletonTable from "@/components/SkeletonTable";
import { capitalize } from "@/lib/helpers/capitalize";

type Props = {
  children: React.ReactNode;
  title: string;
  header?: React.ReactNode;
  isLoading?: boolean;
  overrideBreadcrumb?: string | null;
};

const { Content, Footer, Sider } = Layout;
export const inria = Inria_Sans({ subsets: ["latin"], weight: ["300", "400", "700"] });

export default function DashboardLayout({ children, title, header, isLoading, overrideBreadcrumb }: Props) {
  const router = useRouter();

  const items: MenuProps["items"] = [
    {
      key: "dashboard",
      icon: <MdOutlineDashboard />,
      label: "Dashboard",
      className: inria.className,
      onClick: () => router.push("/dashboard"),
    },
    {
      key: "pelanggan",
      icon: <FiUsers />,
      label: "Pelanggan",
      className: inria.className,
      onClick: () => router.push("/dashboard/pelanggan"),
    },
    {
      key: "produk-menu",
      icon: <BsBasket />,
      className: inria.className,
      label: "Produk",
      children: [
        {
          key: "produk",
          label: "Daftar Produk",
          onClick: () => router.push("/dashboard/produk"),
        },

        {
          key: "lokasi",
          label: "Lokasi Produk",
          onClick: () => router.push("/dashboard/lokasi"),
        },
        {
          key: "kategori-produk",
          label: "Kategori Produk",
          onClick: () => router.push("/dashboard/kategori-produk"),
        },
      ],
    },
    {
      key: "inventory",
      icon: <CiBoxes />,
      label: "Inventory",
      className: inria.className,
      onClick: () => router.push("/dashboard/inventory"),
    },
    {
      key: "pesanan",
      icon: <AiOutlineTag />,
      label: "Pesanan",
      className: inria.className,
      onClick: () => router.push("/dashboard/pesanan"),
    },
    {
      key: "purchase-order",
      icon: <FiTruck />,
      className: inria.className,
      label: "Purchase Order",
      onClick: () => router.push("/dashboard/purchase-order"),
    },
  ];

  const uri = router.asPath.split("/")?.[2]?.split("?")?.[0] || "dashboard";
  const breadcrumbs = router.asPath
    .split("/")
    .map((item, index, arr) => ({
      title:
        index === arr.length - 1 ? (
          <span className={`text-black ${inria.className}`}>
            {overrideBreadcrumb ? overrideBreadcrumb : capitalize(item?.split("?")?.[0]?.replace(/-/g, " ") || item)}
          </span>
        ) : (
          <a className={`text-blue-500 ${inria.className}`} href={arr.slice(0, index + 1).join("/")}>
            {item?.split("-").length > 3 ? overrideBreadcrumb : capitalize(item)}
          </a>
        ),
    }))
    .slice(1);

  const handleLogout = () => {
    Cookies.remove("jwt");
    router.replace("/");
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout hasSider>
        <Sider
          theme="light"
          style={{
            overflow: "auto",
            height: "100vh",
            position: "fixed",
            width: 200,
            left: 0,
            top: 0,
            bottom: 0,
          }}
        >
          <div className="flex justify-center" style={{ marginBottom: 20, marginTop: 20 }}>
            <img src="/images/logo.png" className="w-20 h-20" />
          </div>

          <Menu selectedKeys={[uri]} theme="light" mode="inline" className="mt-3" items={items} />
        </Sider>
        <Layout
          style={{ marginLeft: 200, display: "flex", flexDirection: "column", minHeight: "100vh", height: "100%" }}
        >
          <div className="bg-white flex justify-between items-center px-4 py-3">
            <div className="flex flex-col ">
              <span className={`${inria.className} font-bold text-lg`}>{title}</span>
              <Breadcrumb className={`${inria.className}`} items={breadcrumbs} />
            </div>
            <Dropdown
              trigger={["click"]}
              menu={{
                items: [
                  {
                    key: "logout",
                    label: (
                      <div onClick={handleLogout} className="text-error flex items-center gap-2">
                        <span>Logout</span>
                        <LogoutOutlined />
                      </div>
                    ),
                  },
                ],
              }}
              placement="bottomRight"
            >
              <Avatar className="cursor-pointer" size="large" icon={<UserOutlined />} />
            </Dropdown>
          </div>
          {header && <div className="px-4 mt-3">{header}</div>}
          <Content
            style={{
              borderRadius: 5,
              margin: "12px 16px 0px",
              overflow: "initial",
              flex: 1,
              background: "#FFFFFF",
              padding: "12px 16px 24px 16px",
            }}
          >
            <div className={inria.className}>{isLoading ? <SkeletonTable /> : children}</div>
          </Content>
          <Footer style={{ textAlign: "center", fontFamily: inria.style.fontFamily, fontWeight: 300 }}>
            GP ADMIN DASHBOARD VERSION 1.1.0
          </Footer>
        </Layout>
      </Layout>
    </>
  );
}
