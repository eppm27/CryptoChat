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
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Area, AreaChart } from "recharts";
import { fetchCryptoDetailsDatabase } from "../services/cryptoAPI";
import { ArrowDropUp, ArrowDropDown, MoreVert } from "@mui/icons-material";
import { message } from "antd";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import GraphColour from "./GraphColour";
import { Card, PriceChange, Badge, Button, BottomSheet } from "../ui/index";

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
        overflowX: "auto",
        width: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(10px)",
        borderRadius: "12px",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
      }}
    />
  )),
  Table: (props) => (
    <Table
      {...props}
      sx={{
        borderCollapse: "separate",
        tableLayout: "fixed",
        "& .MuiTableRow-root:hover": {
          backgroundColor: "rgba(59, 130, 246, 0.05)",
          transform: "translateY(-1px)",
          transition: "all 0.2s ease-in-out",
        },
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
        backgroundColor: "rgba(248, 250, 252, 0.95)",
        backdropFilter: "blur(10px)",
        zIndex: 2,
        "& .MuiTableCell-root": {
          borderBottom: "2px solid rgba(59, 130, 246, 0.1)",
          fontWeight: 600,
          fontSize: "0.875rem",
          color: "rgb(55, 65, 81)",
        },
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

// Mobile Card Component for responsive design
const MobileCard = ({ row, inputTableType, navigate, setDeleteModal, userData, onRowClick }) => {
  const [showActions, setShowActions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = React.useRef(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleViewDetails = () => {
    // Navigate to crypto details page for watchlist items
    if (inputTableType === "watchlistPage" || inputTableType === "watchlist") {
      const cryptoId = row.userWatchlistInfo?.cryptoId || row.id;
      if (cryptoId) {
        navigate(`/cryptoDetails/${cryptoId}`);
      }
    } else if (inputTableType === "savedPrompt" || inputTableType === "savedPage") {
      // For saved prompts, create a chat
      handleChatCreation();
    }
  };

  const handleChatCreation = async () => {
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
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error("Failed to create a new chat");
      const newChat = await response.json();
      navigate(`/chat/${newChat.id}`);
    } catch (error) {
      console.error("Error creating chat:", error);
      message.error("Failed to start chat");
    }
  };

  const handleCardClick = async () => {
    if (inputTableType === "watchlist" || inputTableType === "savedPrompt") {
      // For dashboard/other views, create chat
      handleChatCreation();
    } else if (
      inputTableType === "watchlistPage" ||
      inputTableType === "savedPage" ||
      inputTableType === "walletPage"
    ) {
      // For main pages, show manage options
      if (onRowClick) {
        onRowClick(row);
      } else {
        setDeleteModal({ showModal: true, rowData: row });
      }
    }
  };

  // Enhanced Tooltip Component for Graph
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold text-gray-900">
            ${payload[0].value?.toFixed(4)}
          </p>
          <p className="text-xs text-gray-600">
            {label && !isNaN(label) ? new Date(Number(label)).toLocaleDateString() : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card 
      className="p-4 cursor-pointer hover:shadow-lg transition-all duration-200 bg-white/90 backdrop-blur-sm border border-gray-200"
      onClick={handleCardClick}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="font-bold text-lg text-gray-900">
            {row.name}
          </div>
          {(inputTableType === "watchlistPage" || inputTableType === "watchlist") &&
            userData?.wallet?.some(
              (walletItem) => walletItem.cryptoId === row.userWatchlistInfo?.cryptoId
            ) && (
              <Badge variant="secondary" className="text-xs">
                <Wallet className="w-3 h-3 mr-1" />
                Wallet
              </Badge>
          )}
        </div>
        <div className="relative" ref={dropdownRef}>
          <MoreVert 
            className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" 
            onClick={(e) => {
              e.stopPropagation();
              // Show mobile bottom sheet on small screens, dropdown on large screens
              if (window.innerWidth < 1024) {
                setShowActions(true);
              } else {
                setShowDropdown(!showDropdown);
              }
            }}
          />
          
          {/* Desktop Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-2">
              {/* View Details */}
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(false);
                  handleViewDetails();
                }}
              >
                <span className="mr-2">👁️</span>
                View Details
              </button>

              {/* Start Chat (for watchlist items) */}
              {(inputTableType === "watchlistPage" || inputTableType === "watchlist") && (
                <button
                  className="w-full px-4 py-2 text-left hover:bg-blue-50 text-blue-600 flex items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(false);
                    handleChatCreation();
                  }}
                >
                  <span className="mr-2">💬</span>
                  Start Chat
                </button>
              )}

              {/* Edit/Manage */}
              {(inputTableType === "watchlistPage" || inputTableType === "savedPage") && (
                <button
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(false);
                    if (onRowClick) {
                      onRowClick(row);
                    } else {
                      setDeleteModal({ showModal: true, rowData: row });
                    }
                  }}
                >
                  <span className="mr-2">✏️</span>
                  Edit Item
                </button>
              )}

              {/* Add to Wallet */}
              {(inputTableType === "watchlistPage" || inputTableType === "watchlist") && 
               !userData?.wallet?.some(walletItem => walletItem.cryptoId === row.userWatchlistInfo?.cryptoId) && (
                <button
                  className="w-full px-4 py-2 text-left hover:bg-green-50 text-green-600 flex items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(false);
                    message.success(`${row.name} added to wallet!`);
                  }}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Add to Wallet
                </button>
              )}

              {/* Remove/Delete */}
              {(inputTableType === "watchlistPage" || inputTableType === "savedPage" || inputTableType === "walletPage") && (
                <>
                  <hr className="my-1" />
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDropdown(false);
                      setDeleteModal({ showModal: true, rowData: row });
                    }}
                  >
                    <span className="mr-2">🗑️</span>
                    Remove Item
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Price and Change Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-2xl font-bold text-gray-900">
          {row.price}
        </div>
        <div className="flex flex-col items-end gap-1">
          {row.change24h && (
            <PriceChange
              value={row.change24h === "N/A" ? null : parseFloat(row.change24h)}
              showIcon={true}
              className="font-semibold text-sm"
            />
          )}
          {row.change1h && (
            <PriceChange
              value={row.change1h === "N/A" ? null : parseFloat(row.change1h)}
              showIcon={true}
              className="font-medium text-xs"
            />
          )}
        </div>
      </div>

      {/* Market Cap and Graph Row */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {row.marketCap && (
            <div className="text-sm text-gray-600 mb-1">Market Cap</div>
          )}
          <div className="font-semibold text-gray-800">
            {row.marketCap || row.prompt || row.content}
          </div>
        </div>
        
        {/* Enhanced 7-Day Graph */}
        {row.graphInfo && (
          <div className="w-24 h-16 ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={row.graphInfo}>
                <defs>
                  <linearGradient id={`gradient-${row.name}`} x1="0" y1="0" x2="0" y2="1">
                    <stop 
                      offset="5%" 
                      stopColor={GraphColour(row.graphInfo)} 
                      stopOpacity={0.3}
                    />
                    <stop 
                      offset="95%" 
                      stopColor={GraphColour(row.graphInfo)} 
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={GraphColour(row.graphInfo)}
                  strokeWidth={2}
                  fill={`url(#gradient-${row.name})`}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Additional Info for Saved Prompts */}
      {(inputTableType === "savedPrompt" || inputTableType === "savedPage") && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{row.dateCreated || 'Recent'}</span>
            <span>{row.category || 'General'}</span>
          </div>
        </div>
      )}

      {/* Actions BottomSheet */}
      <BottomSheet
        isOpen={showActions}
        onClose={() => setShowActions(false)}
        title={`${row.name || 'Item'} Actions`}
      >
        <div className="space-y-3">
          {/* View Details */}
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(false);
              handleViewDetails();
            }}
          >
            <span className="mr-2">👁️</span>
            View Details
          </Button>

          {/* Start Chat (for watchlist items) */}
          {(inputTableType === "watchlistPage" || inputTableType === "watchlist") && (
            <Button
              variant="outline"
              className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(false);
                handleChatCreation();
              }}
            >
              <span className="mr-2">💬</span>
              Start Chat
            </Button>
          )}

          {/* Edit/Manage (for watchlist and saved items) */}
          {(inputTableType === "watchlistPage" || inputTableType === "savedPage") && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(false);
                if (onRowClick) {
                  onRowClick(row);
                } else {
                  setDeleteModal({ showModal: true, rowData: row });
                }
              }}
            >
              <span className="mr-2">✏️</span>
              Edit Item
            </Button>
          )}

          {/* Remove/Delete */}
          {(inputTableType === "watchlistPage" || inputTableType === "savedPage" || inputTableType === "walletPage") && (
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(false);
                setDeleteModal({ showModal: true, rowData: row });
              }}
            >
              <span className="mr-2">🗑️</span>
              Remove Item
            </Button>
          )}

          {/* Add to Wallet (for watchlist items) */}
          {(inputTableType === "watchlistPage" || inputTableType === "watchlist") && 
           !userData?.wallet?.some(walletItem => walletItem.cryptoId === row.userWatchlistInfo?.cryptoId) && (
            <Button
              variant="outline"
              className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(false);
                // Add to wallet functionality would go here
                message.success(`${row.name} added to wallet!`);
              }}
            >
              <Wallet className="w-4 h-4 mr-2" />
              Add to Wallet
            </Button>
          )}

          {/* Cancel */}
          <Button
            variant="ghost"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(false);
            }}
          >
            Cancel
          </Button>
        </div>
      </BottomSheet>
    </Card>
  );
};

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
                : "static",
            left:
              (inputTableType === "watchlistPage" ||
                inputTableType === "watchlist") &&
              index === 0
                ? 0
                : "auto",
            borderRight: index > 0 ? "1px solid rgba(59, 130, 246, 0.1)" : "none",
            boxShadow:
              (inputTableType === "watchlistPage" ||
                inputTableType === "watchlist") &&
              index === 0
                ? "4px 0 12px rgba(59, 130, 246, 0.15)"
                : "none",
            zIndex: 2,
          }}
          sx={{
            padding: "12px 18px",
            fontWeight: 600,
            fontSize: "0.875rem",
            color: "rgb(55, 65, 81)",
            backgroundColor: "rgba(248, 250, 252, 0.95)",
            backdropFilter: "blur(10px)",
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
            padding: "12px 18px",
            minHeight: "56px",
            bgcolor: "transparent",
            borderBottom: "1px solid rgba(229, 231, 235, 0.8)",
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
                ? "4px 0 12px rgba(59, 130, 246, 0.1)"
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
            <div className="relative">
              <ResponsiveContainer width="100%" height={60}>
                <AreaChart data={row[column.dataKey]}>
                  <defs>
                    <linearGradient id={`tableGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop 
                        offset="5%" 
                        stopColor={GraphColour(row[column.dataKey])} 
                        stopOpacity={0.4}
                      />
                      <stop 
                        offset="95%" 
                        stopColor={GraphColour(row[column.dataKey])} 
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-2">
                            <p className="text-xs font-semibold text-gray-900">
                              ${payload[0].value?.toFixed(4)}
                            </p>
                            <p className="text-xs text-gray-600">
                              {label && !isNaN(label) ? new Date(Number(label)).toLocaleDateString() : '7-day trend'}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={GraphColour(row[column.dataKey])}
                    strokeWidth={2}
                    fill={`url(#tableGradient-${index})`}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
              {/* Trend indicator overlay */}
              <div className="absolute top-1 right-1">
                {(() => {
                  const data = row[column.dataKey];
                  if (data && data.length >= 2) {
                    const trend = data[data.length - 1]?.price > data[0]?.price;
                    return trend ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          ) : column.dataKey === "change1h" ||
            column.dataKey === "change24h" ||
            column.dataKey === "change7d" ? (
            <PriceChange
              value={row[column.dataKey] === "N/A" ? null : parseFloat(row[column.dataKey])}
              showIcon={true}
              className="font-semibold"
            />
          ) : column.dataKey === "name" ? (
            <div className="flex items-center gap-3">
              <div className="font-semibold text-gray-900">{row[column.dataKey]}</div>
              {(inputTableType === "watchlistPage" ||
                inputTableType === "watchlist") &&
                userData?.wallet?.some(
                  (walletItem) =>
                    walletItem.cryptoId === row.userWatchlistInfo.cryptoId
                ) && (
                  <Badge variant="secondary" className="text-xs">
                    <Wallet className="w-3 h-3 mr-1" />
                    In Wallet
                  </Badge>
                )}
            </div>
          ) : column.dataKey === "price" ? (
            <div className="font-bold text-gray-900 text-lg">
              {row[column.dataKey]}
            </div>
          ) : column.dataKey === "marketCap" ? (
            <div className="font-semibold text-gray-700">
              {row[column.dataKey]}
            </div>
          ) : (
            <div className="text-gray-600">
              {row[column.dataKey]}
            </div>
          )}
        </TableCell>
      ))}
    </React.Fragment>
  );
}

export default function CreateTable({ inputTableType, userData, onSuccess, onRowClick }) {
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
            const formattedData = sparkData.map((price, index) => {
              // Create proper dates for the last 7 days
              // Sparkline typically has 168 data points (7 days * 24 hours)
              const now = new Date();
              const hoursBack = sparkData.length - 1 - index;
              const date = new Date(now.getTime() - (hoursBack * 60 * 60 * 1000));
              return {
                time: date.getTime(), // Use timestamp for proper date handling
                price: price,
              };
            });

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
    <>
      {/* Mobile View - Card Layout */}
      <div className="block lg:hidden">
        <div className="space-y-3">
          {tableData?.map((row, index) => (
            <MobileCard
              key={index}
              row={row}
              inputTableType={inputTableType}
              navigate={navigate}
              setDeleteModal={setDeleteModal}
              userData={userData}
              onRowClick={onRowClick}
            />
          ))}
        </div>
      </div>

      {/* Desktop View - Table Layout */}
      <div className="hidden lg:block">
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
                onRowClick,
                userData
              )
            }
            style={{
              overflowX: "auto",
              width: "100%",
            }}
          />
        </Paper>
      </div>

      {deleteModal.showModal && (
        <DeleteModal
          closeModal={handleCloseModal}
          rowData={deleteModal.rowData}
          modalType={inputTableType}
          onSuccess={onSuccess}
        />
      )}
    </>
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
