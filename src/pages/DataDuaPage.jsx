import React, {
  useState,
  useEffect,
  useMemo,
} from "react";

import Navbar from "../components/Navbar";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";

/* =========================================================
   GEOSERVER WFS
   ========================================================= */

const GEOSERVER_WFS_URL =
  "/geoserver/risetids/ows";

/* =========================================================
   DATA DUA PAGE
   ========================================================= */

const DataDuaPage = () => {

  /* =======================================================
     STATE
     ======================================================= */

  const [activeTab, setActiveTab] =
    useState("kebun");

  const [data, setData] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [sorting, setSorting] =
    useState([]);

  const [globalFilter, setGlobalFilter] =
    useState("");

  const [pagination, setPagination] =
    useState({
      pageIndex: 0,
      pageSize: 10,
    });

  /* =======================================================
     KOLOM DATA KEBUN
     ======================================================= */

const columnsKebun = useMemo(() => {
  return [
    {
      header: "No",
      id: "index",
      cell: (info) => 
        info.row.index + 
        1 +
        pagination.pageIndex * pagination.pageSize,
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
  ];
}, []);

  /* =======================================================
     KOLOM DATA PARIT / TANGGUL
     ======================================================= */

const columnsParit = useMemo(() => {
  return [
    {
      header: "No",
      id: "index",
      cell: (info) => info.row.index + 1,
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
  ];
}, []);

/* =======================================================
   KOLOM AKTIF
   ======================================================= */

const currentColumns =
  activeTab === "kebun"
    ? columnsKebun
    : columnsParit;

/* =======================================================
   REACT TABLE
   ======================================================= */

const table = useReactTable({
  data: data,
  columns: currentColumns,

  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),

  state: {
    sorting: sorting,
    globalFilter: globalFilter,
    pagination: pagination,
  },

  onSortingChange: setSorting,
  onGlobalFilterChange: setGlobalFilter,
  onPaginationChange: setPagination,

  autoResetPageIndex: false,
});

  /* =======================================================
     AMBIL DATA DARI GEOSERVER
     ======================================================= */

  useEffect(() => {

    const controller =
      new AbortController();

    const fetchData = async () => {

      setIsLoading(true);

      setErrorMessage("");

      try {

        /* -----------------------------------------------
           Menentukan layer WFS
           ----------------------------------------------- */

        let layerName = "";

        if (activeTab === "kebun") {

          layerName =
            "risetids:Infrastruktur_Data_Spasial";

        } else {

          layerName =
            "risetids:Parit_Tanggul";
        }

        /* -----------------------------------------------
           Membuat parameter WFS
           ----------------------------------------------- */

        const params =
          new URLSearchParams();

        params.set(
          "service",
          "WFS"
        );

        params.set(
          "version",
          "1.0.0"
        );

        params.set(
          "request",
          "GetFeature"
        );

        params.set(
          "typeName",
          layerName
        );

        params.set(
          "outputFormat",
          "application/json"
        );

        params.set(
          "srsName",
          "EPSG:4326"
        );

        params.set(
          "maxFeatures",
          "10000"
        );

        /* -----------------------------------------------
           URL WFS
           ----------------------------------------------- */

        const url =
          GEOSERVER_WFS_URL +
          "?" +
          params.toString();

        console.log(
          "Mengambil WFS:",
          url
        );

        /* -----------------------------------------------
           FETCH
           ----------------------------------------------- */

        const response =
          await fetch(url, {
            method: "GET",

            signal:
              controller.signal,

            cache: "no-store",
          });

        /* -----------------------------------------------
           CEK HTTP
           ----------------------------------------------- */

        if (!response.ok) {

          throw new Error(
            "GeoServer mengembalikan HTTP " +
            response.status
          );
        }

        /* -----------------------------------------------
           BACA RESPONSE
           ----------------------------------------------- */

        const responseText =
          await response.text();

        if (!responseText) {

          throw new Error(
            "GeoServer mengembalikan data kosong."
          );
        }

        /* -----------------------------------------------
           PARSE JSON
           ----------------------------------------------- */

        let result;

        try {

          result =
            JSON.parse(responseText);

        } catch (jsonError) {

          console.error(
            "Response GeoServer:",
            responseText
          );

          throw new Error(
            "Response GeoServer bukan JSON. Periksa URL WFS, GeoServer, atau konfigurasi proxy."
          );
        }

        /* -----------------------------------------------
           CEK FEATURE
           ----------------------------------------------- */

        if (
          !result ||
          !Array.isArray(
            result.features
          )
        ) {

          console.error(
            "Response WFS:",
            result
          );

          throw new Error(
            "Response WFS tidak memiliki data features."
          );
        }

        /* -----------------------------------------------
           UBAH GEOJSON MENJADI DATA TABEL
           ----------------------------------------------- */

        const formattedData =
          result.features.map(
            (feature) => {

              return (
                feature.properties || {}
              );

            }
          );

        console.log(
          "Jumlah data:",
          formattedData.length
        );

        console.log(
          "Data:",
          formattedData
        );

        /* -----------------------------------------------
           SIMPAN DATA
           ----------------------------------------------- */

        setData(
          formattedData
        );

        /* -----------------------------------------------
           RESET TABEL
           ----------------------------------------------- */

        setPagination({
          pageIndex: 0,
          pageSize: 10,
        });

        setGlobalFilter("");

        setSorting([]);

      } catch (error) {

        if (
          error.name ===
          "AbortError"
        ) {
          return;
        }

        console.error(
          "Gagal mengambil data dari GeoServer:",
          error
        );

        setData([]);

        setErrorMessage(
          error.message ||
          "Gagal mengambil data dari GeoServer."
        );

      } finally {

        setIsLoading(false);

      }
    };

    fetchData();

    return () => {
      controller.abort();
    };

  }, [activeTab]);

  /* =======================================================
     GANTI TAB
     ======================================================= */

  const handleTabChange =
    (tab) => {

      setActiveTab(tab);

      setData([]);

      setErrorMessage("");

      setGlobalFilter("");

      setSorting([]);

      setPagination({
        pageIndex: 0,
        pageSize: 10,
      });
    };

  /* =======================================================
     RENDER
     ======================================================= */

  return (

    <div
      className="
        min-h-screen
        bg-[#f0f2f5]
        pt-28
        px-8
        pb-8
        font-sans
      "
    >

      <Navbar />

      <div
        className="
          bg-white
          rounded-2xl
          shadow-sm
          border
          border-gray-100
          p-6
          h-[85vh]
          flex
          flex-col
        "
      >

        {/* =================================================
            HEADER
            ================================================= */}

        <div
          className="
            flex
            justify-between
            items-center
            border-b
            border-gray-200
            mb-4
            pb-3
          "
        >

          {/* TAB */}

          <div
            className="
              flex
              gap-8
            "
          >

            <button
              type="button"
              onClick={() =>
                handleTabChange(
                  "kebun"
                )
              }
              className={
                activeTab === "kebun"
                  ? "font-bold text-[#1268A8] border-b-2 border-[#1268A8] pb-2"
                  : "font-medium text-gray-500 pb-2"
              }
            >
              Data Kebun Petani
            </button>

            <button
              type="button"
              onClick={() =>
                handleTabChange(
                  "parit"
                )
              }
              className={
                activeTab === "parit"
                  ? "font-bold text-[#1268A8] border-b-2 border-[#1268A8] pb-2"
                  : "font-medium text-gray-500 pb-2"
              }
            >
              Parit dan Tanggul
            </button>

          </div>

          {/* SEARCH */}

          <div
            className="
              relative
              mb-2
            "
          >

            <input
              type="text"
              value={globalFilter}
              onChange={(event) =>
                setGlobalFilter(
                  event.target.value
                )
              }
              placeholder="Cari data..."
              className="
                w-64
                border
                border-gray-300
                rounded-lg
                px-4
                py-2
                text-sm
                focus:outline-none
                focus:ring-2
                focus:ring-blue-300
              "
            />

          </div>

        </div>

        {/* =================================================
            PESAN ERROR
            ================================================= */}

        {errorMessage ? (

          <div
            className="
              mb-4
              rounded-lg
              border
              border-red-200
              bg-red-50
              px-4
              py-3
              text-sm
              text-red-700
            "
          >

            <strong>
              Data tidak dapat dimuat.
            </strong>

            <div className="mt-1">
              {errorMessage}
            </div>

            <div className="mt-2 text-xs">
              Periksa koneksi ke GeoServer
              dan konfigurasi proxy.
            </div>

          </div>

        ) : null}

        {/* =================================================
            TABEL
            ================================================= */}

        <div
          className="
            flex-1
            mt-2
            overflow-auto
            min-h-0
          "
        >

          {isLoading ? (

            <div
              className="
                flex
                h-full
                items-center
                justify-center
                text-gray-500
              "
            >

              Memuat data
              GeoServer...

            </div>

          ) : data.length === 0 ? (

            <div
              className="
                flex
                h-full
                items-center
                justify-center
                text-gray-500
              "
            >

              Tidak ada data
              yang ditemukan.

            </div>

          ) : (

            <table
              className="
                min-w-full
                border-collapse
                text-sm
              "
            >

              {/* =================================================
                  HEADER TABEL
                  ================================================= */}

              <thead
                className="
                  sticky
                  top-0
                  z-10
                  bg-[#1268A8]
                  text-white
                "
              >

                {table
                  .getHeaderGroups()
                  .map(
                    (headerGroup) => (

                      <tr
                        key={
                          headerGroup.id
                        }
                      >

                        {headerGroup.headers.map(
                          (header) => (

                            <th
                              key={
                                header.id
                              }
                              className="
                                border
                                border-blue-300
                                px-4
                                py-3
                                text-left
                                whitespace-nowrap
                                font-semibold
                              "
                            >

                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}

                            </th>

                          )
                        )}

                      </tr>

                    )
                  )}

              </thead>

              {/* =================================================
                  BODY TABEL
                  ================================================= */}

              <tbody>

                {table
                  .getRowModel()
                  .rows
                  .map(
                    (row) => (

                      <tr
                        key={
                          row.id
                        }
                        className="
                          hover:bg-gray-50
                        "
                      >

                        {row
                          .getVisibleCells()
                          .map(
                            (cell) => (

                              <td
                                key={
                                  cell.id
                                }
                                className="
                                  border
                                  border-gray-200
                                  px-4
                                  py-3
                                  whitespace-nowrap
                                "
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
                  )}

              </tbody>

            </table>

          )}

        </div>

        {/* =================================================
            PAGINATION
            ================================================= */}

        {!isLoading &&
        data.length > 0 ? (

          <div
            className="
              flex
              items-center
              justify-between
              border-t
              border-gray-200
              pt-4
              mt-4
            "
          >

            {/* INFORMASI */}

            <div
              className="
                text-sm
                text-gray-500
              "
            >

              Halaman{" "}
              {pagination.pageIndex + 1}
              {" "}dari{" "}
              {table.getPageCount()}

            </div>

            {/* BUTTON */}

            <div
              className="
                flex
                items-center
                gap-2
              "
            >

              <button
                type="button"
                onClick={() =>
                  table.previousPage()
                }
                disabled={
                  !table.getCanPreviousPage()
                }
                className="
                  px-3
                  py-2
                  border
                  rounded-lg
                  text-sm
                  disabled:opacity-40
                  disabled:cursor-not-allowed
                  hover:bg-gray-50
                "
              >
                Sebelumnya
              </button>

              <button
                type="button"
                onClick={() =>
                  table.nextPage()
                }
                disabled={
                  !table.getCanNextPage()
                }
                className="
                  px-3
                  py-2
                  border
                  rounded-lg
                  text-sm
                  disabled:opacity-40
                  disabled:cursor-not-allowed
                  hover:bg-gray-50
                "
              >
                Berikutnya
              </button>

              {/* JUMLAH DATA */}

              <span
                className="
                  ml-2
                  text-sm
                  text-gray-500
                "
              >
                Total:
                {" "}
                {table.getFilteredRowModel().rows.length}
                {" "}data
              </span>

            </div>

          </div>

        ) : null}

      </div>

    </div>

  );
};

export default DataDuaPage;