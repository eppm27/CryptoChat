import React, { useEffect, useState } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { TableVirtuoso } from "react-virtuoso";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import savedPromptColumn from "../placeholderData/savedPromptColumn.json";
import walletColumns from "../placeholderData/walletList.json";
import DeleteModal from "./DeleteModal.jsx";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { fetchCryptoDetailsDatabase } from "../services/cryptoAPI";
import { ArrowDropUp, ArrowDropDown } from "@mui/icons-material";
import { message } from "antd";
import { Wallet } from "lucide-react";
import GraphColour from "./GraphColour";

const watchlistPageColumns = [
  { label: "Name", dataKey: "name", width: 150 },
  { label: "Price", dataKey: "price", width: 120 },
  { label: "1h", dataKey: "change1h", width: 100 },
  { label: "24h", dataKey: "change24h", width: 100 },
  { label: "7d", dataKey: "change7d", width: 100 },
  { label: "Market Cap", dataKey: "marketCap", width: 180 },
  { label: "Last 7 Days", dataKey: "graphInfo", width: 140 },
];

const watchlistColumns = [
  { label: "Name", dataKey: "name", width: 120 },
  { label: "Price", dataKey: "price", width: 120 },
  { label: "24h Change", dataKey: "change24h", width: 100 },
  { label: "Market Cap", dataKey: "marketCap", width: 180 },
  { label: "Last 7 Days", dataKey: "graphInfo", width: 140 },
];

const VirtuosoTableComponents = {
  Scroller: React.forwardRef((props, ref) => (
    <TableContainer
      component={Paper}
      {...props}
      ref={ref}
      sx={{
        overflowX: "auto", // horizontal scroll
        width: "100%",
      }}
    />
  )),
  Table: (props) => (
    <Table
      {...props}
      sx={{
        borderCollapse: "separate",
        tableLayout: "fixed", // Ensures that columns have a fixed width
      }}
    />
  ),
  TableHead: React.forwardRef((props, ref) => (
    <TableHead
      {...props}
      ref={ref}
      sx={{
        position: "sticky",
        top: 0,
        backgroundColor: "#fff", // Ensures the header stays visible over content
        zIndex: 1,
      }}
    />
  )),
  TableRow,
  TableBody: React.forwardRef((props, ref) => (
    <TableBody {...props} ref={ref} />
  )),
};

VirtuosoTableComponents.Scroller.displayName = "VirtuosoScroller";
VirtuosoTableComponents.TableHead.displayName = "VirtuosoTableHead";
VirtuosoTableComponents.TableBody.displayName = "VirtuosoTableBody";

function fixedHeaderContent(inputTableType) {
  let tableColumn = [];

  if (inputTableType === "watchlistPage") {
    tableColumn = watchlistPageColumns;
  } else if (inputTableType === "watchlist") {
    tableColumn = watchlistColumns;
  } else if (
    inputTableType === "savedPrompt" ||
    inputTableType === "savedPage"
  ) {
    tableColumn = savedPromptColumn;
  } else if (
    inputTableType === "walletPage" ||
    inputTableType === "wallet" ||
    inputTableType === "walletProfile"
  ) {
    tableColumn = walletColumns;
  }

  return (
    <TableRow>
      {tableColumn.map((column, index) => (
        <TableCell
          key={column.dataKey}
          variant="head"
          align={column.numeric ? "right" : "left"}
          style={{
            width: column.width,
            position:
              (inputTableType === "watchlistPage" ||
                inputTableType === "watchlist") &&
              index === 0
                ? "sticky"
                : "static", // Ensure only first column is sticky
            left:
              (inputTableType === "watchlistPage" ||
                inputTableType === "watchlist") &&
              index === 0
                ? 0
                : "auto",
            borderRight: index > 0 ? "1px solid rgba(0, 0, 0, 0.1)" : "none",
            boxShadow:
              (inputTableType === "watchlistPage" ||
                inputTableType === "watchlist") &&
              index === 0
                ? "4px 0 6px rgba(0, 0, 0, 0.2)"
                : "none",
            zIndex: 1,
          }}
          className={
            inputTableType === "walletProfile"
              ? "bg-gray-300"
              : "bg-customTableBlue"
          }
          sx={{
            padding: "6px 18px",
            fontWeight: "bold",
          }}
        >
          {column.label}
        </TableCell>
      ))}
    </TableRow>
  );
}

const handleCellClick = async (column, row, navigate) => {
  let prompt;
  if (row.name) {
    prompt = `Tell me about ${row.name}`;
  } else {
    prompt = row.prompt?.trim();
  }

  if (!prompt) return;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ content: prompt }),
    });

    if (!response.ok) {
      throw new Error("Failed to create new chat");
    }

    const data = await response.json();

    navigate(`/chat/${data.chat._id}`, {
      state: { initialPrompt: prompt, isNewChat: true },
    });
  } catch (err) {
    console.error("Error:", err);
    navigate("/chat");
  }
};

function rowContent(
  _index,
  row,
  inputTableType,
  navigate,
  setDeleteModal,
  onRowClick,
  userData
) {
  let tableColumn;

  if (inputTableType === "watchlistPage") {
    tableColumn = watchlistPageColumns;
  } else if (inputTableType === "watchlist") {
    tableColumn = watchlistColumns;
  } else if (
    inputTableType === "savedPrompt" ||
    inputTableType === "savedPage"
  ) {
    tableColumn = savedPromptColumn;
  } else if (
    inputTableType === "walletPage" ||
    inputTableType === "wallet" ||
    inputTableType === "walletProfile"
  ) {
    tableColumn = walletColumns;
  }

  return (
    <React.Fragment>
      {tableColumn.map((column, index) => (
        <TableCell
          key={column.dataKey}
          align={column.numeric || false ? "right" : "left"}
          sx={{
            padding: "0px 18px",
            height: "40px",
            bgcolor: "white",
            position:
              (inputTableType === "watchlistPage" ||
                inputTableType === "watchlist") &&
              index === 0
                ? "sticky"
                : "static",
            left:
              (inputTableType === "watchlistPage" ||
                inputTableType === "watchlist") &&
              index === 0
                ? 0
                : "auto",
            boxShadow:
              (inputTableType === "watchlistPage" ||
                inputTableType === "watchlist") &&
              index === 0
                ? "4px 0 6px rgba(0, 0, 0, 0.2)"
                : "none",
            borderRight: index > 0 ? "1px solid rgba(0, 0, 0, 0.1)" : "none",
            zIndex: 1,
          }}
          onClick={() => {
            if (
              inputTableType === "watchlist" ||
              inputTableType === "savedPrompt"
            ) {
              handleCellClick(column, row, navigate);
            } else if (
              inputTableType === "watchlistPage" ||
              inputTableType === "savedPage" ||
              inputTableType === "walletPage"
            ) {
              // Check if onRowClick prop is provided and call it, otherwise show delete modal
              if (onRowClick) {
                onRowClick(row);
              } else {
                setDeleteModal({ showModal: true, rowData: row });
              }
            }
          }}
        >
          {column.dataKey === "graphInfo" ? (
            <ResponsiveContainer width="100%" height={60}>
              <LineChart data={row[column.dataKey]}>
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={GraphColour(row[column.dataKey])}
                  dot={false}
                  strokeWidth={1}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : column.dataKey === "change1h" ||
            column.dataKey === "change24h" ||
            column.dataKey === "change7d" ? (
            <div className="flex flex-row">
              {/* arrow icons */}
              {row[column.dataKey] === "N/A" ? null : row[
                  column.dataKey
                ].startsWith("-") ? (
                <ArrowDropDown
                  style={{ color: "red", verticalAlign: "middle" }}
                />
              ) : (
                <ArrowDropUp
                  style={{ color: "green", verticalAlign: "middle" }}
                />
              )}

              {/* percentage value */}
              <div
                style={{
                  color: row[column.dataKey].startsWith("-")
                    ? "red"
                    : row[column.dataKey] !== "N/A"
                    ? "green"
                    : "gray",
                }}
              >
                {row[column.dataKey]}
              </div>
            </div>
          ) : column.dataKey === "name" ? (
            <div className="flex gap-2">
              <div>{row[column.dataKey]}</div>

              {(inputTableType === "watchlistPage" ||
                inputTableType === "watchlist") &&
                userData?.wallet?.some(
                  (walletItem) =>
                    walletItem.cryptoId === row.userWatchlistInfo.cryptoId
                ) && <Wallet className="w-8" />}
            </div>
          ) : (
            row[column.dataKey]
          )}
        </TableCell>
      ))}
    </React.Fragment>
  );
}

export default function CreateTable({ inputTableType, userData, onSuccess }) {
  const [deleteModal, setDeleteModal] = useState({
    showModal: false,
    rowData: null,
  });
  const [watchlistPageData, setWatchlistPageData] = useState();
  const [watchlistData, setWatchlistData] = useState();
  const [selectedData, setSelectedData] = useState();

  useEffect(() => {
    if (!userData) {
      setSelectedData(null);
      return;
    }
    
    if (inputTableType === "watchlistPage" || inputTableType === "watchlist") {
      setSelectedData(userData.watchlist || []);
    } else if (
      inputTableType === "walletPage" ||
      inputTableType === "walletProfile"
    ) {
      setSelectedData(userData.wallet || []);
    } else {
      setSelectedData(userData.savedPrompts || []);
    }
  }, [inputTableType, userData]);

  useEffect(() => {
    const fetchCryptoData = async () => {
      if (
        (inputTableType === "watchlistPage" ||
          inputTableType === "watchlist") &&
        selectedData &&
        selectedData.length > 0
      ) {
        let pageNewData = [];
        let dashNewData = [];
        try {
          const cryptos = await fetchCryptoDetailsDatabase(
            selectedData,
            "watchlist"
          );

          cryptos.map((crypto) => {
            const sparkData = crypto.sparkline_in_7d;
            const formattedData = sparkData.map((price, index) => ({
              time: index,
              price: price,
            }));

            const priceChange1h = crypto.price_change_percentage_1h_in_currency;
            const priceChange24h =
              crypto.price_change_percentage_24h_in_currency;
            const priceChange7d = crypto.price_change_percentage_7d_in_currency;
            const cryptoBasicfullMatch = selectedData.find(
              (term) => term.cryptoId === crypto.id
            );

            const cryptoInfoPage = {
              name: crypto.name,
              price: new Intl.NumberFormat("en-AU", {
                style: "currency",
                currency: "AUD",
              }).format(crypto.current_price),
              change1h:
                priceChange1h !== null && priceChange1h !== undefined
                  ? `${priceChange1h.toFixed(2)}%`
                  : "N/A",
              change24h:
                priceChange24h !== null && priceChange24h !== undefined
                  ? `${priceChange24h.toFixed(2)}%`
                  : "N/A",
              change7d:
                priceChange7d !== null && priceChange7d !== undefined
                  ? `${priceChange7d.toFixed(2)}%`
                  : "N/A",
              marketCap: new Intl.NumberFormat("en-AU", {
                style: "currency",
                currency: "AUD",
              }).format(crypto.market_cap),
              graphInfo: formattedData,
              action: "NA",
              userWatchlistInfo: cryptoBasicfullMatch,
            };

            const cryptoInfoDash = {
              name: cryptoInfoPage.name,
              price: cryptoInfoPage.price,
              change24h: cryptoInfoPage.change24h,
              marketCap: cryptoInfoPage.marketCap,
              graphInfo: cryptoInfoPage.graphInfo,
              userWatchlistInfo: cryptoInfoPage.userWatchlistInfo,
            };

            pageNewData.push(cryptoInfoPage);
            dashNewData.push(cryptoInfoDash);
          });
          setWatchlistPageData(pageNewData); // save the data
          setWatchlistData(dashNewData);
        } catch (error) {
          console.error("Error:", error);
          message.error(
            error.message || "Failed to fetch crypto data for watchlist"
          );
        }
      }
    };

    fetchCryptoData();
  }, [inputTableType, selectedData, userData]);

  const handleCloseModal = () => {
    setDeleteModal({ showModal: false, rowData: null });
  };

  const navigate = useNavigate();
  let tableData = selectedData;

  if (selectedData) {
    if (
      inputTableType === "walletPage" ||
      inputTableType === "wallet" ||
      inputTableType === "walletProfile"
    ) {
      tableData = selectedData.map(({ cryptoName, ...rest }) => ({
        name: cryptoName,
        ...rest,
      }));
    } else if (
      inputTableType === "savedPage" ||
      inputTableType === "savedPrompt"
    ) {
      tableData = selectedData.map((term) => ({
        prompt: term.prompt,
        ...term,
      }));
    } else if (inputTableType === "watchlistPage") {
      tableData = watchlistPageData;
    } else if (inputTableType === "watchlist") {
      tableData = watchlistData;
    }
  }

  const tableHeight =
    inputTableType === "watchlistPage"
      ? 650
      : inputTableType === "savedPage" || inputTableType === "walletPage"
      ? 600
      : inputTableType === "walletProfile"
      ? 250
      : 170;

  return (
    <Paper style={{ height: tableHeight, width: "100%" }}>
      <TableVirtuoso
        data={tableData}
        components={VirtuosoTableComponents}
        fixedHeaderContent={() => fixedHeaderContent(inputTableType)}
        itemContent={(index, row) =>
          rowContent(
            index,
            row,
            inputTableType,
            navigate,
            setDeleteModal,
            undefined,
            userData
          )
        }
        style={{
          overflowX: "auto", // Ensure horizontal scrolling
          width: "100%",
        }}
      />

      {deleteModal.showModal && (
        <DeleteModal
          closeModal={handleCloseModal}
          rowData={deleteModal.rowData}
          modalType={inputTableType}
          onSuccess={onSuccess}
        />
      )}
    </Paper>
  );
}

CreateTable.propTypes = {
  inputTableType: PropTypes.string.isRequired,
  editMode: PropTypes.bool,
  userData: PropTypes.object,
  onSuccess: PropTypes.func.isRequired,
  onRowClick: PropTypes.func,
};

// https://mui.com/material-ui/react-table/?srsltid=AfmBOorCZGFRZ4s8pHgykGEVNiHTfYHKlfdKZIw50FWKDYpxFV321kdV - created table based on this
