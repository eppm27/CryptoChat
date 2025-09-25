import React, { useEffect, useState } from "react";
import { fetchCryptoGraphData } from "../services/cryptoAPI";
import { message } from "antd";
import Chart from "react-apexcharts";
import PropTypes from "prop-types";

import { styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup, {
  toggleButtonGroupClasses,
} from "@mui/material/ToggleButtonGroup";

import { ChartCandlestick } from "lucide-react";
import { ChartLine } from "lucide-react";

const periods = [
  { label: "24h", value: "1" },
  { label: "7d", value: "7" },
  { label: "30d", value: "30" },
  { label: "90d", value: "90" },
  { label: "Max", value: "365" },
];

const CryptoGraph = ({ cryptoId }) => {
  const [selectedPeriod, setSelectedPeriod] = useState("7");
  const [graphDataCache, setGraphDataCache] = useState({});
  const [currentData, setCurrentData] = useState(null);
  const [graphData, setGraphData] = useState("price");
  const [graphType, setGraphType] = useState("line");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGraphData = async () => {
      // Use cached data if available
      if (graphDataCache[selectedPeriod]) {
        setCurrentData(graphDataCache[selectedPeriod]);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log(
          `🔄 Fetching graph data for ${cryptoId} (${selectedPeriod} days)`
        );
        const graphData = await fetchCryptoGraphData(cryptoId, selectedPeriod);

        if (!graphData || (!graphData.priceData && !graphData.ohlcData)) {
          throw new Error(`No graph data available for ${cryptoId}`);
        }

        setGraphDataCache((prev) => ({
          ...prev,
          [selectedPeriod]: graphData,
        }));
        setCurrentData(graphData);
        console.log(`✅ Successfully loaded graph data for ${cryptoId}`);
      } catch (error) {
        console.error(`❌ Error fetching graph data for ${cryptoId}:`, error);
        setError(error.message || "Failed to fetch crypto graph data");
        message.error(
          `Failed to load ${cryptoId} graph data: ${error.message}`
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchGraphData();
  }, [cryptoId, graphDataCache, selectedPeriod]);

  useEffect(() => {
    if (graphData === "marketCap") {
      setGraphType("line");
    }
  }, [graphData]);

  const getGraphOptions = () => {
    const dataMap = {
      price: currentData.priceData,
      candlestick: currentData.ohlcData,
      marketCap: currentData.marketCapData,
    };

    let selectedData = [];

    if (graphData === "price") {
      selectedData =
        graphType === "candlestick" ? dataMap["candlestick"] : dataMap["price"];

      if (graphType === "candlestick") {
        selectedData = selectedData.map(
          ([timestamp, open, high, low, close]) => ({
            x: new Date(timestamp),
            y: [open, high, low, close],
          })
        );
      }
    } else if (graphData === "marketCap") {
      selectedData = dataMap["marketCap"];
    }

    return {
      series: [
        {
          name: graphData,
          data: selectedData,
        },
      ],
      chart: {
        stacked: false,
        zoom: {
          type: "x",
          enabled: true,
          autoScaleYaxis: true,
        },
        toolbar: {
          autoSelected: "zoom",
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
          },
        },
      },
      stroke: {
        width: 1.5,
        curve: "smooth",
      },
      dataLabels: {
        enabled: false,
      },
      markers: {
        size: 0,
      },
      title: {
        text: `${graphData === "price" ? "Price" : "Market Cap"} Chart`,
        align: "left",
        style: {
          fontSize: "14px",
          fontWeight: "bold",
          color: "#263238",
        },
      },
      fill:
        graphType === "line"
          ? {
              type: "gradient",
              gradient: {
                type: "vertical",
                shadeIntensity: 1,
                inverseColors: false,
                opacityFrom: 0.5,
                opacityTo: 0,
                stops: [0, 90, 100],
              },
            }
          : { type: "solid" },
      yaxis: {
        labels: {
          formatter: function (val) {
            if (val >= 1000000) {
              return (val / 1000000).toFixed(1) + "M";
            }
            if (val >= 1000) {
              return (val / 1000).toFixed(1) + "K";
            }
            return val.toFixed(2);
          },
          style: {
            colors: "#6B7280",
            fontSize: "12px",
            fontFamily: "Arial, sans-serif",
          },
        },
        title: {
          text: graphData === "price" ? "Price (AUD)" : "Market Cap (AUD)",
          style: {
            color: "#6B7280",
            fontSize: "12px",
            fontFamily: "Arial, sans-serif",
          },
        },
        tooltip: {
          enabled: true,
        },
        axisBorder: {
          show: true,
          color: "#E5E7EB",
          width: 1,
          offsetX: 0,
          offsetY: 0,
        },
        axisTicks: {
          show: true,
          color: "#E5E7EB",
          width: 6,
          offsetX: 0,
          offsetY: 0,
        },
      },
      xaxis: {
        type: "datetime",
        labels: {
          style: {
            colors: "#6B7280",
            fontSize: "12px",
            fontFamily: "Arial, sans-serif",
          },
        },
        axisBorder: {
          show: true,
          color: "#E5E7EB",
          height: 1,
          width: "100%",
          offsetX: 0,
          offsetY: 0,
        },
        axisTicks: {
          show: true,
          color: "#E5E7EB",
          height: 6,
          offsetX: 0,
          offsetY: 0,
        },
      },
      tooltip: {
        shared: false,
        y: {
          formatter: (val) =>
            `$${val.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
        },
        style: {
          fontSize: "12px",
          fontFamily: "Arial, sans-serif",
        },
      },
      grid: {
        borderColor: "#E5E7EB",
        strokeDashArray: 4,
        yaxis: {
          lines: {
            show: true,
          },
        },
        xaxis: {
          lines: {
            show: true,
          },
        },
      },
    };
  };

  const handlegraphData = (event, newDataType) => {
    setGraphData(newDataType);
  };

  const handlePeriodSelection = (event, newPeriod) => {
    setSelectedPeriod(newPeriod);
  };

  const handleGraphType = (event, newType) => {
    setGraphType(newType);
  };

  const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
    [`& .${toggleButtonGroupClasses.grouped}`]: {
      margin: theme.spacing(0.5),
      border: 0,
      borderRadius: theme.shape.borderRadius,
      [`&.${toggleButtonGroupClasses.disabled}`]: {
        border: 0,
      },
    },
    [`& .${toggleButtonGroupClasses.middleButton},& .${toggleButtonGroupClasses.lastButton}`]:
      {
        marginLeft: -1,
        borderLeft: "1px solid transparent",
      },
  }));

  return (
    <>
      <div className="flex flex-col gap-2" data-testid="crypto-graph">
        <div className="flex flex-row gap-4 justify-between">
          <div>
            <Paper
              elevation={0}
              sx={(theme) => ({
                display: "inline-flex",
                border: `1px solid ${theme.palette.divider}`,
                flexWrap: "wrap",
              })}
            >
              <StyledToggleButtonGroup
                size="small"
                value={graphData}
                exclusive
                onChange={handlegraphData}
                aria-label="Graph Data Type"
              >
                <ToggleButton value="price" aria-label="Price graph">
                  Price
                </ToggleButton>
                <ToggleButton value="marketCap" aria-label="Market Cap graph">
                  Market Cap
                </ToggleButton>
              </StyledToggleButtonGroup>
            </Paper>
          </div>

          <div>
            <Paper
              elevation={0}
              sx={(theme) => ({
                display: "inline-flex",
                border: `1px solid ${theme.palette.divider}`,
                flexWrap: "wrap",
              })}
            >
              <StyledToggleButtonGroup
                size="small"
                value={graphType}
                exclusive
                onChange={handleGraphType}
                aria-label="Graph Data Type"
              >
                <ToggleButton value="line" aria-label="line option">
                  <ChartLine />
                </ToggleButton>

                {graphData === "price" && (
                  <ToggleButton
                    value="candlestick"
                    aria-label="candlestick option"
                  >
                    <ChartCandlestick />
                  </ToggleButton>
                )}
              </StyledToggleButtonGroup>
            </Paper>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading {cryptoId} chart data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-96 bg-red-50 rounded-lg border border-red-200">
            <div className="text-center p-6">
              <div className="text-red-500 mb-2">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-red-800 mb-2">
                Chart Data Unavailable
              </h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : currentData ? (
          <Chart
            options={getGraphOptions()}
            series={getGraphOptions().series}
            type={graphType === "candlestick" ? "candlestick" : "area"}
            height={350}
          />
        ) : (
          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
            <p className="text-gray-600">
              No chart data available for {cryptoId}
            </p>
          </div>
        )}

        <div className="text-right">
          <Paper
            elevation={0}
            sx={(theme) => ({
              display: "inline-flex",
              border: `1px solid ${theme.palette.divider}`,
              flexWrap: "wrap",
            })}
          >
            <StyledToggleButtonGroup
              size="small"
              value={selectedPeriod}
              exclusive
              onChange={handlePeriodSelection}
              aria-label="Graph Data Type"
            >
              {periods.map(({ label, value }) => (
                <ToggleButton key={value} value={value} aria-label={label}>
                  {label}
                </ToggleButton>
              ))}
            </StyledToggleButtonGroup>
          </Paper>
        </div>
      </div>
    </>
  );
};

export default CryptoGraph;

CryptoGraph.propTypes = {
  cryptoId: PropTypes.string.isRequired,
};

// graph created with https://apexcharts.com/javascript-chart-demos/line-charts/zoomable-timeseries/
// buttons created with https://mui.com/material-ui/react-toggle-button/
