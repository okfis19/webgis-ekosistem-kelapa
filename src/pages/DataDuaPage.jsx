import React, { useEffect, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

const GEOSERVER_WFS_URL = "/geoserver/webgis/ows";

const DataDuaPage = () => {
  // ============================================================
  // TAB
  // ============================================================

  const [activeTab, setActiveTab] = useState("kebun");

  // ============================================================
  // DATA
  // ============================================================

  const [dataKebun, setDataKebun] = useState([]);
  const [dataParit, setDataParit] = useState([]);

  const [loadingKebun, setLoadingKebun] = useState(false);
  const [loadingParit, setLoadingParit] = useState(false);

  const [errorKebun, setErrorKebun] = useState("");
  const [errorParit, setErrorParit] = useState("");

  // ============================================================
  // TABLE STATE
  // ============================================================

  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");

  /*
   * PENTING:
   *
   * pageIndex dimulai dari 0.
   *
   * pageIndex 0 = data 1 - 10
   * pageIndex 1 = data 11 - 20
   * pageIndex 2 = data 21 - 30
   * dst.
   */
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // ============================================================
  // FETCH DATA KEBUN
  // ============================================================

  useEffect(() => {
    const fetchDataKebun = async () => {
      setLoadingKebun(true);
      setErrorKebun("");

      try {
        const params = new URLSearchParams();

        params.set("service", "WFS");
        params.set("version", "1.0.0");
        params.set("request", "GetFeature");
        params.set("typeName", "webgis:Infrastruktur_Data_Spasial");
        params.set("outputFormat", "application/json");
        params.set("srsName", "EPSG:4326");
        params.set("maxFeatures", "10000");

        const url = GEOSERVER_WFS_URL + "?" + params.toString();

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            "Gagal mengambil data kebun. Status HTTP: " +
              response.status
          );
        }

        const result = await response.json();

        if (!result.features) {
          setDataKebun([]);
          return;
        }

        const rows = result.features.map((feature, index) => {
          const properties = feature.properties || {};

          return {
            id:
              feature.id ||
              "kebun-" +
                String(index + 1),

            Kecamatan:
              properties["Kecamatan"] || "",

            Desa:
              properties["Desa"] || "",

            "Nama Pemilik":
              properties["Nama Pemilik"] || "",

            "Luas Lahan (Ha)":
              properties["Luas Lahan (Ha)"] || "",

            "Jumlah Pohon":
              properties["Jumlah Pohon"] || "",

            "Pola Budidaya":
              properties["Pola Budidaya"] || "",
          };
        });

        setDataKebun(rows);

        // Kembali ke halaman pertama setelah data berhasil dimuat
        setPagination({
          pageIndex: 0,
          pageSize: 10,
        });
      } catch (error) {
        console.error("Error data kebun:", error);

        setErrorKebun(
          error.message || "Terjadi kesalahan saat mengambil data kebun."
        );

        setDataKebun([]);
      } finally {
        setLoadingKebun(false);
      }
    };

    fetchDataKebun();
  }, []);

  // ============================================================
  // FETCH DATA PARIT / TANGGUL
  // ============================================================

  useEffect(() => {
    const fetchDataParit = async () => {
      setLoadingParit(true);
      setErrorParit("");

      try {
        const params = new URLSearchParams();

        params.set("service", "WFS");
        params.set("version", "1.0.0");
        params.set("request", "GetFeature");
        params.set("typeName", "webgis:Parit_Tanggul");
        params.set("outputFormat", "application/json");
        params.set("srsName", "EPSG:4326");
        params.set("maxFeatures", "10000");

        const url = GEOSERVER_WFS_URL + "?" + params.toString();

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            "Gagal mengambil data parit/tanggul. Status HTTP: " +
              response.status
          );
        }

        const result = await response.json();

        if (!result.features) {
          setDataParit([]);
          return;
        }

        const rows = result.features.map((feature, index) => {
          const properties = feature.properties || {};

          return {
            id:
              feature.id ||
              "parit-" +
                String(index + 1),

            Wilayah:
              properties["Wilayah"] || "",

            "Status Parit":
              properties["Status Parit"] || "",

            Nama:
              properties["Nama"] || "",

            Desa:
              properties["Desa"] || "",

            Kecamatan:
              properties["Kecamatan"] || "",

            "Panjang Parit/Tanggul (km)":
              properties["Panjang Parit/Tanggul (km)"] || "",

            "Lebar Parit/Tanggul (m)":
              properties["Lebar Parit/Tanggul (m)"] || "",

            Permasalahan:
              properties["Permasalahan"] || "",

            Realisasi:
              properties["Realisasi"] || "",

            "Tahun Perbaikan":
              properties["Tahun Perbaikan"] || "",

            Pendanaan:
              properties["Pendanaan"] || "",
          };
        });

        setDataParit(rows);

        // Kembali ke halaman pertama setelah data berhasil dimuat
        setPagination({
          pageIndex: 0,
          pageSize: 10,
        });
      } catch (error) {
        console.error("Error data parit:", error);

        setErrorParit(
          error.message ||
            "Terjadi kesalahan saat mengambil data parit/tanggul."
        );

        setDataParit([]);
      } finally {
        setLoadingParit(false);
      }
    };

    fetchDataParit();
  }, []);

  // ============================================================
  // KOLOM TABEL KEBUN
  // ============================================================

  const columnsKebun = useMemo(
    () => [
      {
        header: "No",
        id: "nomor",
        cell: (info) => {
          /*
           * info.row.index adalah posisi baris setelah proses
           * pagination.
           *
           * Karena tabel sudah melakukan pagination,
           * halaman:
           *
           * 1 -> 0 sampai 9
           * 2 -> 0 sampai 9
           * 3 -> 0 sampai 9
           *
           * Maka kita tambahkan offset halaman.
           */
          return (
            info.row.index +
            1 +
            pagination.pageIndex * pagination.pageSize
          );
        },
      },

      {
        header: "Kecamatan",
        accessorKey: "Kecamatan",
      },

      {
        header: "Desa",
        accessorKey: "Desa",
      },

      {
        header: "Nama Pemilik",
        accessorKey: "Nama Pemilik",
      },

      {
        header: "Luas Lahan (Ha)",
        accessorKey: "Luas Lahan (Ha)",
      },

      {
        header: "Jumlah Pohon",
        accessorKey: "Jumlah Pohon",
      },

      {
        header: "Pola Budidaya",
        accessorKey: "Pola Budidaya",
      },
    ],
    [pagination.pageIndex, pagination.pageSize]
  );

  // ============================================================
  // KOLOM TABEL PARIT / TANGGUL
  // ============================================================

  const columnsParit = useMemo(
    () => [
      {
        header: "No",
        id: "nomor",
        cell: (info) => {
          return (
            info.row.index +
            1 +
            pagination.pageIndex * pagination.pageSize
          );
        },
      },

      {
        header: "Wilayah",
        accessorKey: "Wilayah",
      },

      {
        header: "Status Parit",
        accessorKey: "Status Parit",
      },

      {
        header: "Nama Parit/Tanggul",
        accessorKey: "Nama",
      },

      {
        header: "Desa",
        accessorKey: "Desa",
      },

      {
        header: "Kecamatan",
        accessorKey: "Kecamatan",
      },

      {
        header: "Panjang (km)",
        accessorKey: "Panjang Parit/Tanggul (km)",
      },

      {
        header: "Lebar (m)",
        accessorKey: "Lebar Parit/Tanggul (m)",
      },

      {
        header: "Permasalahan",
        accessorKey: "Permasalahan",
      },

      {
        header: "Realisasi",
        accessorKey: "Realisasi",
      },

      {
        header: "Tahun Perbaikan",
        accessorKey: "Tahun Perbaikan",
      },

      {
        header: "Pendanaan",
        accessorKey: "Pendanaan",
      },
    ],
    [pagination.pageIndex, pagination.pageSize]
  );

  // ============================================================
  // DATA YANG AKTIF
  // ============================================================

  const activeData =
    activeTab === "kebun"
      ? dataKebun
      : dataParit;

  const activeColumns =
    activeTab === "kebun"
      ? columnsKebun
      : columnsParit;

  // ============================================================
  // TABLE INSTANCE
  // ============================================================

  const table = useReactTable({
    data: activeData,
    columns: activeColumns,

    state: {
      sorting: sorting,
      globalFilter: globalFilter,
      pagination: pagination,
    },

    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    /*
     * Jangan biarkan React Table mengubah pageIndex
     * secara otomatis ketika data berubah.
     */
    autoResetPageIndex: false,

    /*
     * Jumlah baris per halaman.
     */
    manualPagination: false,
  });

  // ============================================================
  // RESET HALAMAN KETIKA BERPINDAH TAB
  // ============================================================

  useEffect(() => {
    setPagination({
      pageIndex: 0,
      pageSize: 10,
    });

    setGlobalFilter("");
    setSorting([]);
  }, [activeTab]);

  // ============================================================
  // JUMLAH DATA
  // ============================================================

  const totalData = activeData.length;

  const totalPages = table.getPageCount();

  const currentPage = pagination.pageIndex + 1;

  const startData =
    totalData === 0
      ? 0
      : pagination.pageIndex * pagination.pageSize + 1;

  const endData = Math.min(
    (pagination.pageIndex + 1) * pagination.pageSize,
    totalData
  );

  // ============================================================
  // LOADING
  // ============================================================

  const isLoading =
    activeTab === "kebun"
      ? loadingKebun
      : loadingParit;

  // ============================================================
  // ERROR
  // ============================================================

  const error =
    activeTab === "kebun"
      ? errorKebun
      : errorParit;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="w-full h-full bg-gray-100 p-4">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="bg-white rounded-xl shadow-md p-5 mb-4">

        <h1 className="text-2xl font-bold text-gray-800">
          Tabel Data
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Data kebun petani dan parit/tanggul
        </p>

      </div>

      {/* ======================================================
          TAB
      ====================================================== */}

      <div className="bg-white rounded-xl shadow-md mb-4">

        <div className="flex border-b">

          <button
            type="button"
            onClick={() => setActiveTab("kebun")}
            className={
              activeTab === "kebun"
                ? "px-6 py-3 font-semibold text-green-700 border-b-2 border-green-600"
                : "px-6 py-3 font-semibold text-gray-500 hover:text-green-600"
            }
          >
            Data Kebun Petani
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("parit")}
            className={
              activeTab === "parit"
                ? "px-6 py-3 font-semibold text-green-700 border-b-2 border-green-600"
                : "px-6 py-3 font-semibold text-gray-500 hover:text-green-600"
            }
          >
            Parit dan Tanggul
          </button>

        </div>

      </div>

      {/* ======================================================
          TABLE CONTAINER
      ====================================================== */}

      <div className="bg-white rounded-xl shadow-md p-4">

        {/* SEARCH */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">

          <div>

            <h2 className="text-lg font-semibold text-gray-800">
              {activeTab === "kebun"
                ? "Data Kebun Petani"
                : "Data Parit dan Tanggul"}
            </h2>

            <p className="text-sm text-gray-500">
              Menampilkan data {startData} - {endData} dari {totalData}
            </p>

          </div>

          <div>

            <input
              type="text"
              value={globalFilter}
              onChange={(event) =>
                setGlobalFilter(event.target.value)
              }
              placeholder="Cari data..."
              className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-green-500"
            />

          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* LOADING */}

        {isLoading ? (
          <div className="py-10 text-center text-gray-500">
            Memuat data...
          </div>
        ) : (

          <>

            {/* =================================================
                TABLE
            ================================================== */}

            <div className="overflow-x-auto">

              <table className="min-w-full border-collapse">

                <thead>

                  {table.getHeaderGroups().map(
                    (headerGroup) => (
                      <tr
                        key={headerGroup.id}
                        className="bg-gray-100"
                      >

                        {headerGroup.headers.map(
                          (header) => (
                            <th
                              key={header.id}
                              className="border border-gray-300 px-3 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap"
                            >

                              {header.isPlaceholder
                                ? null
                                : (
                                  <button
                                    type="button"
                                    onClick={header.column.getToggleSortingHandler()}
                                    className="font-semibold"
                                  >

                                    {flexRender(
                                      header.column.columnDef
                                        .header,
                                      header.getContext()
                                    )}

                                    {header.column.getIsSorted() ===
                                    "asc"
                                      ? " ↑"
                                      : header.column.getIsSorted() ===
                                        "desc"
                                      ? " ↓"
                                      : ""}

                                  </button>
                                )}

                            </th>
                          )
                        )}

                      </tr>
                    )
                  )}

                </thead>

                <tbody>

                  {table.getRowModel().rows.length === 0 ? (

                    <tr>

                      <td
                        colSpan={activeColumns.length}
                        className="border border-gray-300 px-4 py-8 text-center text-gray-500"
                      >
                        Tidak ada data.
                      </td>

                    </tr>

                  ) : (

                    table.getRowModel().rows.map(
                      (row) => (

                        <tr
                          key={row.id}
                          className="hover:bg-gray-50"
                        >

                          {row.getVisibleCells().map(
                            (cell) => (

                              <td
                                key={cell.id}
                                className="border border-gray-300 px-3 py-2 text-sm text-gray-700 whitespace-nowrap"
                              >

                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}

                              </td>

                            )
                          )}

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

            {/* =================================================
                PAGINATION
            ================================================== */}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-4">

              {/* INFO */}

              <div className="text-sm text-gray-600">

                Halaman{" "}
                <span className="font-semibold">
                  {currentPage}
                </span>{" "}
                dari{" "}
                <span className="font-semibold">
                  {totalPages}
                </span>

              </div>

              {/* BUTTON */}

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  className="px-3 py-2 border rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  «
                </button>

                <button
                  type="button"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="px-3 py-2 border rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Sebelumnya
                </button>

                <button
                  type="button"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="px-3 py-2 border rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Berikutnya
                </button>

                <button
                  type="button"
                  onClick={() =>
                    table.setPageIndex(
                      Math.max(
                        table.getPageCount() - 1,
                        0
                      )
                    )
                  }
                  disabled={!table.getCanNextPage()}
                  className="px-3 py-2 border rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  »
                </button>

              </div>

              {/* PAGE SIZE */}

              <div className="flex items-center gap-2">

                <span className="text-sm text-gray-600">
                  Tampilkan
                </span>

                <select
                  value={pagination.pageSize}
                  onChange={(event) => {
                    setPagination({
                      pageIndex: 0,
                      pageSize: Number(event.target.value),
                    });
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >

                  <option value={10}>
                    10
                  </option>

                  <option value={20}>
                    20
                  </option>

                  <option value={50}>
                    50
                  </option>

                  <option value={100}>
                    100
                  </option>

                </select>

                <span className="text-sm text-gray-600">
                  data
                </span>

              </div>

            </div>

          </>

        )}

      </div>

    </div>
  );
};

export default DataDuaPage;