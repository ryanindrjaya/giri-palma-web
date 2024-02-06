import ProdukSearch from "@/components/ProdukSearch";
import SkeletonTable from "@/components/SkeletonTable";
import useMutation from "@/hooks/useMutation";
import useQuery from "@/hooks/useQuery";
import DashboardLayout from "@/layout/dashboard.layout";
import fetcher from "@/lib/axios";
import { parseHarga } from "@/lib/helpers/parseNumber";
import { parseToOption } from "@/lib/helpers/parseToOption";
import { Pelanggan } from "@/types/pelanggan.type";
import { Pesanan } from "@/types/pesanan.type";
import { Produk, ProdukDetail } from "@/types/produk.type";
import { ExportOutlined } from "@ant-design/icons";
import { Button, DatePicker, Form, Input, InputNumber, Modal, Select, Table, Tooltip } from "antd";
import { NotificationInstance } from "antd/es/notification/interface";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { BiTrash } from "react-icons/bi";

export async function getServerSideProps(ctx: any) {
  const id = ctx.params.id;
export async function getServerSideProps(ctx: any) {
  const id = ctx.params.id;

  return {
    props: {
      id,
    },
  };
}
  return {
    props: {
      id,
    },
  };
}

type Props = {
  notificationApi: NotificationInstance;
  id: string
  id: string
};

interface ProductData extends Produk {
  detail_id?: string;
  quantity: number;
  subtotal: number;
  detail: ProdukDetail;
}

export default function EditPesanan({ notificationApi, id }: Props) {
export default function EditPesanan({ notificationApi, id }: Props) {
  const [form] = Form.useForm();
  const router = useRouter();

  const { data: pesanan } = useQuery<Pesanan>(`/api/admin/pesanan/${id}`);

  const { data: pelanggan } = useQuery<Pelanggan[]>("/api/admin/pelanggan");

  const [products, setProducts] = useState<ProductData[]>([]);
  const [metodeBayar, setMetodeBayar] = useState<string>("");
  const [pembayaranPerTermin, setPembayaranPerTermin] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [initialValues, setInitialValues] = useState<any>({});

  const [editPesanan, { loading: loadingEdit }] = useMutation(`/api/admin/pesanan/${pesanan?.id}`, "put", {
    onSuccess: () => {
      notificationApi.success({
        message: "Berhasil mengubah pesanan",
        description: `Pesanan dengan nomor ${pesanan?.nomor_pesanan} berhasil diubah`,
      });
      router.push("/dashboard/pesanan");
    },
  });

  const [cancelPesanan, { loading: loadingCancel }] = useMutation(`/api/admin/pesanan/cancel/${pesanan?.id}`, "post", {
    onSuccess: () => {
      notificationApi.success({
        message: "Berhasil membatalkan pesanan",
        description: `Pesanan dengan nomor ${pesanan?.nomor_pesanan} berhasil dibatalkan`,
      });
      router.push("/dashboard/pesanan");
    },
  });

  

  const filterOption = (input: string, option?: { label: string; value: string }) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  const columns: ColumnsType<Produk> = [
    {
      title: "Kode Produk",
      dataIndex: "kode",
      key: "kode",
    },
    {
      title: "Nama Produk",
      dataIndex: "nama",
      key: "nama",
    },
    {
      title: "Detail Produk",
      key: "tipe",
      render: (record) => {
        const options = record.produk_detail?.map((item: ProdukDetail) => ({
          label: `${item.tipe} (${item.ukuran})`,
          value: item.detail_id,
        }));
        return (
          <Select
            showSearch
            options={options}
            optionFilterProp="children"
            filterOption={filterOption}
            className="w-full"
            value={record?.detail?.detail_id}
            onChange={(value) => {
              const selectedDetail = record.produk_detail?.find((item: ProdukDetail) => item.detail_id === value);
              const newProducts = [...products];
              const index = newProducts.findIndex((item) => item.id === record.id);
              newProducts[index].detail = selectedDetail;
              newProducts[index].subtotal = selectedDetail?.harga || 0;
              setProducts(newProducts);
            }}
          />
        );
      },
    },
    {
      title: "Kuantitas",
      key: "kuantitas",
      width: 100,
      render: (record) => {
        return (
          <InputNumber
            min={1}
            suffix="UNIT"
            onFocus={(e) => e.target.select()}
            onChange={(value) => {
              const newProducts = [...products];
              const index = newProducts.findIndex((item) => item.id === record.id);
              newProducts[index].quantity = value;

              const detail = newProducts[index].detail;

              const harga = detail?.harga || 0;
              const diskon1 = detail?.diskon1 || 0;
              const diskon2 = detail?.diskon2 || 0;

              const subtotal = harga - (harga * diskon1) / 100 - (harga * diskon2) / 100;

              newProducts[index].subtotal = subtotal * value;

              setProducts(newProducts);
            }}
            value={record.quantity}
            className="w-full"
          />
        );
      },
    },
    {
      title: "Harga",
      key: "harga",
      render: (record) => {
        return <span>Rp {parseHarga(record?.detail?.harga || 0)}</span>;
      },
    },
    {
      title: "Diskon 1",
      key: "diskon1",
      width: 70,
      render: (record) => {
        return <span>{record?.detail?.diskon1 || 0}%</span>;
      },
    },
    {
      title: "Diskon 2",
      key: "diskon2",
      width: 70,
      render: (record) => {
        return <span>{record?.detail?.diskon2 || 0}%</span>;
      },
    },
    {
      title: "Subtotal",
      key: "subtotal",
      render: (record) => {
        return <span>Rp {parseHarga(record?.subtotal || 0)}</span>;
      },
    },
    {
      title: "Aksi",
      dataIndex: "id",
      key: "id",
      width: 100,
      align: "center",
      render: (id) => {
        return (
          <Tooltip title="Hapus produk">
            <Button
              danger
              type="primary"
              onClick={() => {
                const newProducts = [...products];
                const index = newProducts.findIndex((item) => item.id === id);
                newProducts.splice(index, 1);
                setProducts(newProducts);
              }}
            >
              <BiTrash size={18} />
            </Button>
          </Tooltip>
        );
      },
    },
  ];

  useEffect(() => {
    
    const getProduk = async (pesanan: Pesanan) => {
      try {
        console.log(pesanan)
        const tempProducts: ProductData[] = [];
        for (const detail of pesanan.pesanan_detail) {
          const jwt = Cookies.get("jwt");
          
          if (detail.produk_id) {
            const res = await fetcher.get(`/api/admin/produk/${detail.produk_id}`, {
              headers: {
                Authorization: `Bearer ${jwt}`,
              },
            });
  
            console.log('res get produk', res)
      
            const item = {
              ...res.data.data,
              detail_id: detail.detail_id,
              quantity: detail.quantity,
              subtotal: detail.subtotal || 0,
              detail: detail.produk_detail,
            };
      
            tempProducts.push(item)
          }
        }

        setProducts(tempProducts)

        setLoading(false)
      } catch (error) {
        console.error(error);
      }
    };

    if (pesanan) {
      getProduk(pesanan)

      setMetodeBayar(pesanan?.metode_bayar || "");

      setInitialValues({
        ...pesanan,

        uang_muka: (pesanan.uang_muka || 0),
        created_at: dayjs(pesanan.created_at),
        pelanggan_id: pesanan.pelanggan.id,
      });
    }
  }, [pesanan]);



  const onFinish = async (values: any) => {
    const body = {
      ...values,
      total: products.reduce((acc, item) => acc + item.subtotal, 0),
      uang_muka: values.uang_muka,
      uang_tukar_tambah: values.uang_tukar_tambah,
      metode_bayar: metodeBayar,
      pembayaran_per_minggu: pembayaranPerTermin,
      created_at: values.created_at?.toISOString(),
      pesanan_detail: products.map((item) => ({
        subtotal: item.subtotal,
        harga: item.detail?.harga,
        detail_id: item?.detail_id,
        produk_id: item.id,
        produk_detail_id: item.detail?.detail_id,
        quantity: item.quantity,
        diskon1: item.detail?.diskon1,
        diskon2: item.detail?.diskon2,
      })),
    };


    editPesanan(body).catch((err) => {
      notificationApi.error({
        message: "Gagal mengubah pesanan",
        description: err?.response?.data?.message || "Terjadi kesalahan saat mengubah pesanan",
        placement: "topRight",
      });
    });
  };

  const getPembayaranPerTermin = () => {
    const total = products.reduce((acc, item) => acc + item.subtotal, 0);
    const uangMuka = form.getFieldValue("uang_muka") || 0;
    const tukarTambah = form.getFieldValue("uang_tukar_tambah") || 0;
    const sisaPembayaran = total - uangMuka - tukarTambah;

    const terminPembayaran = form.getFieldValue("termin_pembayaran") || 0;
    const rentangWaktuPembayaran = form.getFieldValue("rentang_waktu_pembayaran") || 0;

    if (rentangWaktuPembayaran === 0 || terminPembayaran === 0) return;

    const pembayaranPerTermin = sisaPembayaran / Math.floor(rentangWaktuPembayaran / terminPembayaran);

    setPembayaranPerTermin(pembayaranPerTermin);
  };

  const Footer = () => {
    const total = products.reduce((acc, item) => acc + item.subtotal, 0);

    return (
      <Table.Summary>
        <Table.Summary.Row key="summary-0">
          <Table.Summary.Cell index={0} align="center" colSpan={4}></Table.Summary.Cell>
          <Table.Summary.Cell index={1} colSpan={3} className="font-bold bg-primary text-white rounded-md">
            Total Nilai Pesanan
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2} colSpan={3} className="font-bold">
            <p className="m-0 px-2">Rp {parseHarga(total)}</p>
          </Table.Summary.Cell>
        </Table.Summary.Row>

        <div className="h-1" />
        Uang Muka (DP)
        <Table.Summary.Row key="summary-1">
          <Table.Summary.Cell index={0} align="center" colSpan={4}></Table.Summary.Cell>
          <Table.Summary.Cell index={1} colSpan={3} className="font-bold bg-primary text-white rounded-t-md">
            <span>Uang Muka</span>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2} colSpan={3} className="font-bold">
            <Form.Item name="uang_muka" className="m-0" noStyle>
              <InputNumber
                className="w-full flex-1"
                min={0}
                prefix="Rp"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => parseFloat(`${value}`.replace(/\Rp\s?|(,*)/g, "")) as 0}
                onFocus={(e) => e.target.select()}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Table.Summary.Cell>
        </Table.Summary.Row>
        <Table.Summary.Row>
          <Table.Summary.Cell index={0} align="center" colSpan={4}></Table.Summary.Cell>
          <Table.Summary.Cell
            index={1}
            colSpan={3}
            className="font-bold bg-primary cursor-pointer hover:bg-primary/80 transition-all duration-150 text-white rounded-b-md"
          >
            <span>Tukar Tambah</span>
            <ExportOutlined className="ml-2" />
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2} colSpan={3} className="font-bold">
            <Form.Item name="uang_tukar_tambah" className="m-0" noStyle>
              <InputNumber
                style={{ width: "100%" }}
                className="w-full text-end"
                min={0}
                prefix="Rp"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => parseFloat(`${value}`.replace(/\Rp\s?|(,*)/g, "")) as 0}
                onFocus={(e) => e.target.select()}
              />
            </Form.Item>
          </Table.Summary.Cell>
        </Table.Summary.Row>

        <div className="h-1" />

        <Table.Summary.Row>
          <Table.Summary.Cell index={0} align="center" colSpan={4}></Table.Summary.Cell>
          <Table.Summary.Cell index={1} colSpan={3} className="font-bold bg-primary text-white rounded-md">
            Metode Pembayaran
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2} colSpan={3} className="font-bold">
            <Select
              className="w-full"
              value={metodeBayar}
              onChange={(value) => {
                if (value !== "tempo") {
                  form.setFieldsValue({
                    termin_pembayaran: null,
                    rentang_waktu_pembayaran: null,
                  });
                  setPembayaranPerTermin(0);
                }

                setMetodeBayar(value);
              }}
            >
              <Select.Option value="tunai">Tunai</Select.Option>
              <Select.Option value="tunai leasing">Tunai Leasing</Select.Option>
              <Select.Option value="tempo">Tempo</Select.Option>
            </Select>
          </Table.Summary.Cell>
        </Table.Summary.Row>
        {metodeBayar === "tunai leasing" ? (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} align="center" colSpan={5}></Table.Summary.Cell>
            <Table.Summary.Cell index={1} colSpan={2} className="font-bold border border-primary">
              Nama Leasing
            </Table.Summary.Cell>
            <Table.Summary.Cell index={2} colSpan={3} className="font-bold">
              <Form.Item name="nama_leasing" className="m-0" noStyle>
                <Input className="w-full" />
              </Form.Item>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        ) : null}

        {metodeBayar === "tempo" ? (
          <>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} align="center" colSpan={5}></Table.Summary.Cell>
              <Table.Summary.Cell index={1} colSpan={2} className="font-bold border border-primary">
                Termin Pembayaran
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} colSpan={3} className="font-bold">
                <Form.Item name="termin_pembayaran" className="m-0" noStyle>
                  <Select className="w-full">
                    <Select.Option value={14} key={14}>
                      2 Minggu
                    </Select.Option>
                    <Select.Option value={30} key={30}>
                      1 Bulan
                    </Select.Option>
                  </Select>
                </Form.Item>
              </Table.Summary.Cell>
            </Table.Summary.Row>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} align="center" colSpan={5}></Table.Summary.Cell>
              <Table.Summary.Cell index={1} colSpan={2} className="font-bold border border-primary">
                Jangka Waktu Pembayaran
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} colSpan={3} className="font-bold">
                <Form.Item name="rentang_waktu_pembayaran" className="m-0" noStyle>
                  <Select className="w-full">
                    <Select.Option value={30} key={30}>
                      1 Bulan
                    </Select.Option>
                    <Select.Option value={90} key={90}>
                      3 Bulan
                    </Select.Option>
                    <Select.Option value={180} key={180}>
                      6 Bulan
                    </Select.Option>
                  </Select>
                </Form.Item>
              </Table.Summary.Cell>
            </Table.Summary.Row>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} align="center" colSpan={5}></Table.Summary.Cell>
              <Table.Summary.Cell index={1} colSpan={2} className="font-bold border border-primary">
                Pembayaran Per Termin
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} colSpan={3} className="font-bold">
                <p className="m-0 px-2">Rp {parseHarga(pembayaranPerTermin)}</p>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </>
        ) : null}
      </Table.Summary>
    );
  };

  const requiredRules = [{ required: true, message: "Wajib diisi" }];

  const onValuesChange = (changedValues: any, allValues: any) => {
    const uangMuka = allValues.uang_muka || 0;
    const tukarTambah = allValues.uang_tukar_tambah || 0;
    const total = products.reduce((acc, item) => acc + item.subtotal, 0);

    const sisaPembayaran = total - uangMuka - tukarTambah;

    if (metodeBayar === "tempo") {
      getPembayaranPerTermin();
    }

    form.setFieldsValue({ sisa_pembayaran: sisaPembayaran });
  };

  useEffect(() => {
    const values = form.getFieldsValue();

    onValuesChange({}, values);
  }, [products]);

  const handleCancel = () => {
    cancelPesanan({ alasan: cancelReason }).catch((err) => {
      notificationApi.error({
        message: "Gagal membatalkan pesanan",
        description: err?.response?.data?.message || "Terjadi kesalahan saat membatalkan pesanan",
        placement: "topRight",
      });
    });
  };

  return (
    <DashboardLayout title="Edit Pesanan" overrideDetailId={pesanan?.nomor_pesanan}>
      {loading ? (
        <SkeletonTable />
      ) : (
        <>
          <Form
            form={form}
            onFinish={onFinish}
            onValuesChange={onValuesChange}
            layout="vertical"
            initialValues={initialValues}
          >
            <div className="mb-4">
              <p className="text-lg font-bold">Detail Pemesanan</p>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Form.Item name="created_at" label="Tanggal Pemesanan" rules={requiredRules}>
                  <DatePicker className="w-full" format={"DD/MM/YYYY"} />
                </Form.Item>
                <Form.Item name="nomor_pesanan" label="Nomor Pesanan" rules={requiredRules}>
                  <Input readOnly className="w-full" />
                </Form.Item>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Form.Item name="pelanggan_id" label="Pelanggan" rules={requiredRules}>
                  <Select className="w-full" options={parseToOption(pelanggan || [], "id", "nama_merchant")} />
                </Form.Item>
                <Form.Item name="catatan" label="Catatan" className="col-span-2">
                  <Input.TextArea rows={3} className="w-full" />
                </Form.Item>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-lg font-bold">Detail Produk</p>
              <ProdukSearch
                onSelect={(value) => {
                  const detail = value.produk_detail?.[0];

                  const harga = detail?.harga || 0;
                  const diskon1 = detail?.diskon1 || 0;
                  const diskon2 = detail?.diskon2 || 0;

                  const subtotal = harga - (harga * diskon1) / 100 - (harga * diskon2) / 100;
                  const item = {
                    ...value,
                    quantity: 1,
                    subtotal: subtotal,
                    detail: value.produk_detail?.[0],
                  };
                  setProducts([...products, item]);
                }}
              />

              <Table
                pagination={false}
                size="small"
                className="mt-6"
                columns={columns}
                bordered
                dataSource={products}
                summary={Footer}
              />
            </div>

            <div className="w-full gap-4 flex justify-center mt-7">
              <Button size="large" className="flex-[0.25]" type="primary" htmlType="submit" loading={loadingEdit}>
                Simpan
              </Button>

              <Button
                size="large"
                className="flex-[0.1] ml-4"
                danger
                type="text"
                loading={loadingCancel}
                onClick={() => setOpenModal(true)}
              >
                Batalkan Pesanan
              </Button>
            </div>
          </Form>
          <Modal
            title="Batalkan Pesanan"
            open={openModal}
            onOk={handleCancel}
            onCancel={() => setOpenModal(false)}
            footer={null}
            okButtonProps={{ loading: loadingCancel, danger: true, disabled: cancelReason === "" }}
          >
            <p>
              Harap masukkan alasan pembatalan pesanan. Alasan pembatalan akan ditampilkan pada halaman detail pesanan
            </p>
            <Input.TextArea
              className="mt-4"
              rows={4}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex justify-end gap-4 mt-4">
              <Button onClick={() => setOpenModal(false)}>Batal</Button>
              <Button danger onClick={handleCancel}>
                Batalkan
              </Button>
            </div>
          </Modal>
        </>
      )}
    </DashboardLayout>
  );
}
