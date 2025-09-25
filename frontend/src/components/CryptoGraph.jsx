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

  useEffect(() => {
    const fetchGraphData = async () => {
      if (graphDataCache[selectedPeriod]) {
        setCurrentData(graphDataCache[selectedPeriod]);
      }

      try {
        const graphData = await fetchCryptoGraphData(cryptoId, selectedPeriod);
        setGraphDataCache((prev) => ({
          ...prev,
          [selectedPeriod]: graphData,
        }));
        setCurrentData(graphData);
      } catch (error) {
        console.error("Error:", error);
        message.error(error.message || "Failed to fetch crypto graph data");
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

        {currentData && (
          <Chart
            options={getGraphOptions()}
            series={getGraphOptions().series}
            type={graphType === "candlestick" ? "candlestick" : "area"}
            height={350}
          />
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
