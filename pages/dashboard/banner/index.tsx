import ProdukSearch from "@/components/ProdukSearch";
import FileUpload from "@/components/Upload";
import useDebounce from "@/hooks/useDebounce";
import useMutation from "@/hooks/useMutation";
import useQuery from "@/hooks/useQuery";
import DashboardLayout from "@/layout/dashboard.layout";
import fetcher from "@/lib/axios";
import { BannerType } from "@/types/banner.type";
import { Button, Form, Image, Input, Modal, Popconfirm, Table } from "antd";
import { NotificationInstance } from "antd/es/notification/interface";
import { ColumnsType } from "antd/es/table";
import React, { useState, useEffect } from "react";
import { AiOutlineEdit, AiOutlinePlus } from "react-icons/ai";
import { BsFillTrashFill } from "react-icons/bs";
import { GiSettingsKnobs } from "react-icons/gi";
import Cookies from "js-cookie";
type Props = {
  notificationApi: NotificationInstance;
};

export default function Banner({ notificationApi }: Props) {
  const [form] = Form.useForm();
  const [searchVal, setSearchVal] = useState<string>("");
  const debouncedSearchVal = useDebounce(searchVal, 500);
  const [selectedRow, setSelectedRow] = useState<BannerType[]>([]);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedData, setSelectedData] = useState<BannerType | null>(null);

  const [image, setImage] = useState<any[] | null>(null);

  const [loadingCreate, setLoadingCreate] = useState<boolean>(false);

  const { data, loading, error, refetch } = useQuery<BannerType[]>("/api/admin/banner");
  const [editBanner, { loading: loadingEdit }] = useMutation("/api/admin/banner", "put", {
    onSuccess: () => {
      form.resetFields();
      setOpenModal(false);
      setSelectedData(null);
      notificationApi.success({
        message: "Berhasil",
        description: "Berhasil mengubah banner promo",
        placement: "topRight",
      });
      refetch();
    },
  });
  const [deleteBanner, { loading: loadingDelete }] = useMutation("/api/admin/banner", "delete");
  const [postBanner, { loading: loadingPost }] = useMutation("/api/admin/banner", "post", {
    onSuccess: () => {
      form.resetFields();
      setOpenModal(false);
      notificationApi.success({
        message: "Berhasil",
        description: "Berhasil menambahkan banner promo",
        placement: "topRight",
      });
      setLoadingCreate(false);
      refetch();
    },
  });

  const handleBulkDelete = async () => {
    try {
      const promises = selectedRow.map((item) => deleteBanner(undefined, item.id));
      const resolved = await Promise.all(promises);

      if (resolved.every((item) => item.status === 200)) {
        notificationApi.success({
          message: "Berhasil",
          description: "Berhasil menghapus banner promo",
          placement: "topRight",
        });
      }

      setSelectedRow([]);
      refetch();
    } catch (error: any) {
      console.log(error);
      notificationApi.error({
        message: "Gagal",
        description: error?.response?.data?.message || "Gagal menghapus banner promo",
        placement: "topRight",
      });
    }
  };

  const columns: ColumnsType<BannerType> = [
    {
      key: "num",
      title: "#",
      width: 50,
      align: "center",
      render: (_v, _, index) => index + 1,
    },
    {
      key: "title",
      title: "Judul",
      dataIndex: "title",
    },
    {
      key: "deskripsi",
      title: "Deskripsi",
      dataIndex: "deskripsi",
    },
    {
      key: "image",
      title: "Gambar",
      render: (_, item) => (
        <div className="flex justify-center items-center gap-2">
          <Image src={item.image_url} className="object-contain" width={100} height={100} />
        </div>
      ),
    },
    {
      key: "action",
      title: "Action",
      render: (_, item) => (
        <div className="flex justify-center items-center gap-2">
          <Button onClick={() => setSelectedData(item)} type="primary" className="flex p-1 justify-center items-center">
            <AiOutlineEdit size={18} />
          </Button>
        </div>
      ),
    },
  ];

  const postImage = async () => {
    try {
      const jwt = Cookies.get("jwt");
      const formData = new FormData();

      if (image) {
        for (let i = 0; i < image.length; i++) {
          formData.append("files", image[i]);
        }
      }

      const res = await fetcher.post("/api/admin/upload/banner", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${jwt}`,
        },
      });

      return res?.data?.data?.[0]?.path;
    } catch (error) {
      console.log(error);
    }
  };

  const handleCreate = async (values: any) => {
    setLoadingCreate(true);

    if (!image) {
      notificationApi.error({
        message: "Gagal menambahkan banner promo",
        description: "Gambar harus diisi",
        placement: "topRight",
      });
      setLoadingCreate(false);
      return;
    }

    const image_url = await postImage();

    if (!image_url) {
      notificationApi.error({
        message: "Gagal menambahkan banner promo",
        description: "Gambar harus diisi",
        placement: "topRight",
      });
      setLoadingCreate(false);
      return;
    }

    values.image_url = image_url;

    postBanner(values).catch((error) => {
      notificationApi.error({
        message: "Gagal menambahkan banner promo",
        description: error?.response?.data?.message || "Gagal menambahkan banner promo",
        placement: "topRight",
      });
      setLoadingCreate(false);
    });
  };

  const handleEdit = async (values: any) => {
    editBanner(values, selectedData?.id).catch((error) => {
      notificationApi.error({
        message: "Gagal mengubah banner promo",
        description: error?.response?.data?.message || "Gagal mengubah banner promo",
        placement: "topRight",
      });
    });
  };

  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: BannerType[]) => {
      setSelectedRow(selectedRows);
    },
  };

  useEffect(() => {
    if (selectedData) {
      // form.setFieldsValue({
      //   nama: selectedData.nama,
      //   kode: selectedData.kode,
      // });
      setOpenModal(true);
    }
  }, [selectedData]);

  return (
    <>
      <Modal
        title={selectedData ? "Ubah Banner Promo" : "Tambah Banner Promo"}
        okText={selectedData ? "Ubah" : "Tambah"}
        cancelText="Batal"
        open={openModal}
        onOk={() => {
          form.validateFields().then((values) => {
            if (selectedData) {
              handleEdit(values);
            } else {
              handleCreate(values);
            }
          });
        }}
        okButtonProps={{ loading: loadingCreate || loadingPost || loadingEdit }}
        onCancel={() => {
          form.resetFields();
          setOpenModal(false);
          setSelectedData(null);
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Judul" name="title" rules={[{ required: true, message: "Judul harus diisi" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Deskripsi" name="deskripsi" rules={[{ required: true, message: "Deskripsi harus diisi" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Produk" name="produk_id" rules={[{ required: true, message: "Harap pilih produk" }]}>
            <ProdukSearch
              defaultValue={{
                label: selectedData?.produk?.nama || "",
                value: selectedData?.produk?.id || "",
              }}
              clearOnSelect={false}
              onSelect={(item) => {
                form.setFieldsValue({
                  produk_id: item.id,
                });
              }}
            />
          </Form.Item>
          <FileUpload multiple={false} className="w-full" setFile={(file) => setImage(file)} />
        </Form>
      </Modal>
      <DashboardLayout
        title="Banner Promo"
        isLoading={loading}
        header={
          <div className="w-full flex justify-between items-center">
            <div className="flex gap-2">
              <Input.Search onChange={(e) => setSearchVal(e.target.value)} placeholder="Cari kategori" />
              <Button className="px-2 flex items-center border border-gray-400 rounded-md bg-white cursor-pointer">
                <GiSettingsKnobs size={18} />
              </Button>
              <Popconfirm
                okText="Hapus"
                cancelText="Batal"
                title="Hapus banner promo"
                okButtonProps={{ danger: true, loading: loadingDelete }}
                description="Apakah anda yakin ingin menghapus banner promo produk yang dipilih?"
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
                setOpenModal(true);
              }}
              type="primary"
              className="flex gap-2 items-center"
            >
              <div className="flex items-center gap-2">
                <AiOutlinePlus size={18} />
                <span>Tambah Banner Promo</span>
              </div>
            </Button>
          </div>
        }
      >
        <Table
          rowSelection={{
            type: "checkbox",
            ...rowSelection,
          }}
          rowKey={(record) => record.id}
          size="small"
          bordered
          columns={columns}
          dataSource={data || []}
        />
      </DashboardLayout>
    </>
  );
}
