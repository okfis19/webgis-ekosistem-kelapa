import React, { useState } from "react";

/* =========================================================
   GEOSERVER WMS
   ========================================================= */

const GEOSERVER_WMS_URL =
  "/geoserver/wms";

/* =========================================================
   LEGEND PANEL
   ========================================================= */

const LegendPanel = ({
  activeLayers,
  layerConfigs,
}) => {

  const [isMinimized, setIsMinimized] =
    useState(false);

  /* =======================================================
     CEK LAYER AKTIF
     ======================================================= */

  const activeLayerConfigs =
    (layerConfigs || []).filter(
      (layer) =>
        activeLayers &&
        activeLayers[layer.id]
    );

  /* =======================================================
     JIKA TIDAK ADA LAYER AKTIF
     ======================================================= */

  if (
    activeLayerConfigs.length === 0
  ) {
    return null;
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div
      className={
        isMinimized
          ? "bg-white rounded-xl shadow-2xl w-80 flex flex-col max-h-[60px]"
          : "bg-white rounded-xl shadow-2xl w-80 flex flex-col max-h-[30vh]"
      }
    >

      {/* =================================================
          HEADER
          ================================================= */}

      <div
        className="
          flex
          justify-between
          items-center
          px-5
          py-3
          cursor-pointer
          hover:bg-gray-50
          rounded-t-xl
          border-b
          border-gray-100
          shrink-0
        "
        onClick={() =>
          setIsMinimized(
            !isMinimized
          )
        }
      >

        <h3
          className="
            font-bold
            text-base
            text-gray-800
          "
        >
          Legenda
        </h3>

        {/* ICON PANAH */}

        <svg
          className={
            isMinimized
              ? "w-5 h-5 text-gray-500 rotate-180"
              : "w-5 h-5 text-gray-500"
          }
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >

          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />

        </svg>

      </div>

      {/* =================================================
          ISI LEGENDA
          ================================================= */}

      {!isMinimized && (

        <div
          className="
            flex
            flex-col
            gap-4
            px-5
            py-4
            overflow-y-auto
          "
        >

          {activeLayerConfigs.map(
            (layer) => {

              /* -----------------------------------------
                 PARAMETER GET LEGEND GRAPHIC
                 ----------------------------------------- */

              const params =
                new URLSearchParams();

              params.set(
                "REQUEST",
                "GetLegendGraphic"
              );

              params.set(
                "VERSION",
                "1.0.0"
              );

              params.set(
                "FORMAT",
                "image/png"
              );

              params.set(
                "WIDTH",
                "20"
              );

              params.set(
                "HEIGHT",
                "20"
              );

              params.set(
                "LEGEND_OPTIONS",
                "forceLabels:on;fontSize:12"
              );

              params.set(
                "LAYER",
                layer.wsName
              );

              /* -----------------------------------------
                 URL LEGENDA
                 ----------------------------------------- */

              const legendUrl =
                GEOSERVER_WMS_URL +
                "?" +
                params.toString();

              return (

                <div
                  key={layer.id}
                  className="
                    border-b
                    border-gray-100
                    pb-3
                    last:border-0
                  "
                >

                  {/* NAMA LAYER */}

                  <h4
                    className="
                      text-sm
                      font-semibold
                      text-[#1268A8]
                      mb-2
                    "
                  >
                    {layer.name}
                  </h4>

                  {/* GAMBAR LEGENDA */}

                  <div
                    className="
                      overflow-x-auto
                      w-full
                      pb-1
                    "
                  >

                    <img
                      src={legendUrl}
                      alt={
                        "Legenda " +
                        layer.name
                      }
                      className="
                        max-w-none
                        max-h-[180px]
                        object-contain
                        object-left
                      "

                      onError={(
                        event
                      ) => {

                        console.error(
                          "Legenda GeoServer gagal dimuat:",
                          layer.wsName
                        );

                        event.currentTarget.style.display =
                          "none";
                      }}
                    />

                  </div>

                </div>

              );
            }
          )}

        </div>

      )}

    </div>
  );
};

export default LegendPanel;