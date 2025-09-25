import React, { useEffect, useState } from "react";
import { fetchCryptoDetailsDatabase } from "../services/cryptoAPI";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import { ArrowDropUp, ArrowDropDown } from "@mui/icons-material";
import CircularProgress from "@mui/material/CircularProgress";
import GraphColour from "./GraphColour";

const columns = [
  { field: "rank", headerName: "Rank", width: 90, align: "center" },
  {
    field: "coin",
    headerName: "Coin",
    width: 190,
    renderCell: (params) => {
      const coinName = params.row.coin;
      const coinImageUrl = params.row.imageUrl;

      return (
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src={coinImageUrl}
            alt={coinName}
            style={{ width: 20, height: 20, marginRight: 8 }}
          />
          <span>{coinName}</span>
        </div>
      );
    },
  },
  { field: "price", headerName: "Price", width: 130 },
  {
    field: "change1h",
    headerName: "1h",
    width: 100,
    renderCell: (params) => {
      const value = parseFloat(params.row.change1h);
      const textColor = value > 0 ? "green" : value < 0 ? "red" : "black";
      const arrow =
        value > 0 ? (
          <ArrowDropUp style={{ color: "green" }} />
        ) : value < 0 ? (
          <ArrowDropDown style={{ color: "red" }} />
        ) : null;
      return (
        <span style={{ color: textColor }}>
          {arrow}
          {`${value.toFixed(2)}%`}
        </span>
      );
    },
  },
  {
    field: "change24h",
    headerName: "24h",
    width: 100,
    renderCell: (params) => {
      const value = parseFloat(params.row.change24h);
      const textColor = value > 0 ? "green" : value < 0 ? "red" : "black";
      const arrow =
        value > 0 ? (
          <ArrowDropUp style={{ color: "green" }} />
        ) : value < 0 ? (
          <ArrowDropDown style={{ color: "red" }} />
        ) : null;
      return (
        <span style={{ color: textColor }}>
          {arrow}
          {`${value.toFixed(2)}%`}
        </span>
      );
    },
  },
  {
    field: "change7d",
    headerName: "7d",
    width: 100,
    renderCell: (params) => {
      const value = parseFloat(params.row.change7d);
      const textColor = value > 0 ? "green" : value < 0 ? "red" : "black";
      const arrow =
        value > 0 ? (
          <ArrowDropUp style={{ color: "green" }} />
        ) : value < 0 ? (
          <ArrowDropDown style={{ color: "red" }} />
        ) : null;
      return (
        <span style={{ color: textColor }}>
          {arrow}
          {`${value.toFixed(2)}%`}
        </span>
      );
    },
  },
  { field: "volumn24h", headerName: "24h Volume", width: 170 },
  { field: "marketcap", headerName: "Market Cap", width: 170 },
  {
    field: "graphinfo",
    headerName: "Last 7 days",
    width: 170,
    renderCell: (params) => {
      const data = params.row.graphinfo || [];
      const formattedData = data.map((value, index) => ({
        time: index,
        price: value,
      }));

      const trendColour = GraphColour(formattedData);

      return (
        <ResponsiveContainer width="100%" height={88}>
          <LineChart data={formattedData}>
            <Line
              type="monotone"
              dataKey="price"
              stroke={trendColour}
              strokeWidth={1}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    },
  },
];

const ExploreTable = () => {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [chunkedData, setChunkedData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  const chunkData = (data) => {
    const chunkedList = [];
    const size = 50;

    if (!data) return;

    for (let i = 0; i < data.length; i += size) {
      const chunk = data.slice(i, i + size);
      const chunkRows = chunk.map((crypto) => {
        const price = crypto.current_price || 0;
        const change1h = (
          crypto.price_change_percentage_1h_in_currency || 0
        ).toFixed(2);
        const change24h = (
          crypto.price_change_percentage_24h_in_currency || 0
        ).toFixed(2);
        const change7d = (
          crypto.price_change_percentage_7d_in_currency || 0
        ).toFixed(2);

        return {
          id: crypto.id || "",
          rank: crypto.market_cap_rank || 0,
          coin: crypto.name || "Unknown",
          imageUrl: crypto.image || "",
          price: new Intl.NumberFormat("en-AU", {
            style: "currency",
            currency: "AUD",
          }).format(price),
          change1h: `${change1h}%`,
          change24h: `${change24h}%`,
          change7d: `${change7d}%`,
          volumn24h: new Intl.NumberFormat("en-AU", {
            style: "currency",
            currency: "AUD",
          }).format(crypto.total_volume || 0),
          marketcap: new Intl.NumberFormat("en-AU", {
            style: "currency",
            currency: "AUD",
          }).format(crypto.market_cap || 0),
          graphinfo: crypto.sparkline_in_7d || [],
        };
      });
      chunkedList.push(chunkRows);
    }

    return chunkedList;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cryptoData = await fetchCryptoDetailsDatabase();
        const sortedData = cryptoData.sort(
          (a, b) => a.market_cap_rank - b.market_cap_rank
        );
        const chunked = chunkData(sortedData, pageSize);
        setChunkedData(chunked);
        setIsLoading(false);
      } catch (error) {
        console.log("Failed to fetch all data from cache, ", error);
        setIsLoading(false);
      }
    };
    setPageSize(50);
    fetchData();
  }, [pageSize]);

  const handlePageChange = (event, value) => {
    setPageNumber(value);
    window.scrollTo(0, 0);
  };

  const handleRowClick = (params) => {
    const cryptoId = params.row.id;
    navigate(`/cryptoDetails/${cryptoId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <CircularProgress size={60} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 items-center">
        <Paper sx={{ width: "100%" }}>
          <DataGrid
            rows={chunkedData[pageNumber - 1] || []}
            columns={columns}
            checkboxSelection={false}
            pageSize={pageSize}
            onRowClick={handleRowClick}
            sx={{
              border: 0,
              "& .MuiDataGrid-columnHeader": {
                backgroundColor: "#f0f0f0 !important",
                color: "#000 !important",
              },
              "& .MuiDataGrid-columnHeaderTitle": {
                fontWeight: "bold",
              },
            }}
            hideFooterPagination={true}
            hideFooter={true}
          />
        </Paper>

        <Stack spacing={2} className="mb-4">
          <Pagination
            count={chunkedData.length}
            color="primary"
            onChange={handlePageChange}
            sx={{
              ".MuiPaginationItem-root.Mui-selected": {
                backgroundColor: "#1E3A8A",
              },
            }}
          />
        </Stack>
      </div>
    </div>
  );
};

export default ExploreTable;

// table: https://mui.com/material-ui/react-table/?srsltid=AfmBOorCZGFRZ4s8pHgykGEVNiHTfYHKlfdKZIw50FWKDYpxFV321kdV
// pagination: https://mui.com/material-ui/react-pagination/
// datagrid: https://mui.com/x/react-data-grid/#pro-version
// rendercell + onRowClick and other datagrid commands: https://mui.com/x/react-data-grid/column-definition/
