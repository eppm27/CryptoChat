import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { message } from "antd";
import {
  updateCryptoAmount,
  deleteCryptoFromWallet,
  deleteCryptoFromWatchlist,
  deletePromptFromSaved,
} from "../services/userAPI";
import { useNavigate } from "react-router-dom";
import { Button, Card, Input, PriceChange, Badge } from "./ui";
import { Trash2, Sparkles, Info, X } from "lucide-react";

const DeleteModal = ({ closeModal, rowData, modalType, onSuccess }) => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState(
    Number.parseFloat(rowData?.amount ?? rowData?.quantity ?? 0) || 0
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChatting, setIsChatting] = useState(false);

  const isWatchlist = modalType === "watchlistPage";
  const isWallet = modalType === "walletPage";
  const isSaved = modalType === "savedPage";

  useEffect(() => {
    setAmount(Number.parseFloat(rowData?.amount ?? rowData?.quantity ?? 0) || 0);
  }, [rowData]);

  const changeMetrics = useMemo(() => {
    if (!isWatchlist) return [];

    const metrics = [
      { key: "change1h", label: "1h" },
      { key: "change24h", label: "24h" },
      { key: "change7d", label: "7d" },
    ];

    return metrics
      .map(({ key, label }) => {
        const raw = rowData?.[key];
        if (!raw) return null;
        const numeric = Number.parseFloat(String(raw).replace("%", ""));
        if (!Number.isFinite(numeric)) return null;
        return { label, raw, numeric };
      })
      .filter(Boolean);
  }, [rowData, isWatchlist]);

  const displayName = rowData?.name || rowData?.prompt || "Selected entry";

  const handleAmountChange = (event) => {
    setAmount(Number.parseFloat(event.target.value) || 0);
  };

  const deleteItem = async () => {
    try {
      setIsDeleting(true);
      if (isWatchlist) {
        await deleteCryptoFromWatchlist(rowData.userWatchlistInfo);
      } else if (isSaved) {
        await deletePromptFromSaved(rowData);
      } else if (isWallet) {
        await deleteCryptoFromWallet(rowData);
      }
      message.success("Entry removed successfully");
      onSuccess?.();
      closeModal();
    } catch (error) {
      console.error("Error deleting entry:", error);
      message.error(error.message || "Failed to remove entry");
    } finally {
      setIsDeleting(false);
    }
  };

  const updateItem = async () => {
    if (!isWallet) return;

    try {
      setIsUpdating(true);
      await updateCryptoAmount(rowData, amount);
      message.success("Holding updated");
      onSuccess?.();
      closeModal();
    } catch (error) {
      console.error("Error updating holding:", error);
      message.error(error.message || "Failed to update holding");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCryptoDetails = () => {
    const cryptoId = isWatchlist
      ? rowData?.userWatchlistInfo?.cryptoId
      : rowData?.cryptoId;

    if (cryptoId) {
      navigate(`/cryptoDetails/${cryptoId}`);
      closeModal();
    }
  };

  const handleChat = async () => {
    let inputPrompt;

    if (isWatchlist) {
      inputPrompt = `Tell me about watchlist crypto ${rowData.name}`;
    } else if (isWallet) {
      inputPrompt = `Tell me about wallet crypto ${rowData.name}`;
    } else if (isSaved) {
      inputPrompt = rowData.prompt;
    }

    if (!inputPrompt) return;

    try {
      setIsChatting(true);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ content: inputPrompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to create a new chat");
      }

      const data = await response.json();
      if (!data.chat?._id) {
        throw new Error("Unexpected response from chat service");
      }

      navigate(`/chat/${data.chat._id}`, {
        state: {
          initialPrompt: inputPrompt,
          isNewChat: true,
          existingMessages: [
            {
              text: inputPrompt,
              sender: "user",
              isError: false,
            },
            {
              text: data.llmMessage?.content || "No response received.",
              sender: "chatBot",
              isError: data.llmMessage?.isError || false,
            },
          ],
        },
      });
      closeModal();
    } catch (error) {
      console.error("Error starting insights chat:", error);
      message.error(error.message || "Failed to start AI insights");
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-neutral-900/60 backdrop-blur-sm">
      <Card className="w-full max-w-2xl p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Badge variant="danger" className="uppercase text-xs">
              Manage Entry
            </Badge>
            <h2 className="text-2xl font-semibold text-neutral-900">
              {displayName}
            </h2>
            <p className="text-sm text-neutral-500">
              {isWallet
                ? "Update the quantity in your wallet or remove this asset entirely."
                : isWatchlist
                ? "Review the latest performance before removing it from your watchlist."
                : "Remove this saved prompt or explore it with AI insights."}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeModal}
            className="h-9 w-9 p-0 text-neutral-500"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {isWatchlist && (
          <div className="rounded-2xl border border-neutral-100 bg-white/70 p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div>
                <p className="text-xs uppercase text-neutral-500">Spot Price</p>
                <p className="text-lg font-semibold text-neutral-900">
                  {rowData.price || "—"}
                </p>
              </div>
              {changeMetrics.length > 0 && (
                <div className="flex gap-4">
                  {changeMetrics.map((metric) => (
                    <div key={metric.label} className="text-center">
                      <span className="text-[11px] uppercase text-neutral-400">
                        {metric.label}
                      </span>
                      <div className="mt-1">
                        <PriceChange value={metric.numeric} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm text-neutral-600">
              <div>
                <p className="text-xs uppercase text-neutral-400">Symbol</p>
                <p className="font-semibold text-neutral-900">
                  {rowData.userWatchlistInfo?.cryptoSymbol?.toUpperCase() || "—"}
                </p>
              </div>
              {rowData.marketCap && (
                <div>
                  <p className="text-xs uppercase text-neutral-400">Market Cap</p>
                  <p className="font-semibold text-neutral-900">
                    {rowData.marketCap}
                  </p>
                </div>
              )}
            </div>

            <p className="text-xs text-neutral-500">
              Keep this asset on your watchlist to monitor price swings and
              market momentum.
            </p>
          </div>
        )}

        {isWallet && (
          <div className="rounded-2xl border border-primary-100 bg-primary-50/60 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase text-primary-600">Current Amount</p>
                <p className="text-lg font-semibold text-neutral-900">
                  {rowData.amount}
                </p>
              </div>
              <div className="w-32">
                <Input
                  type="number"
                  label="New amount"
                  value={amount}
                  onChange={handleAmountChange}
                  min={0}
                />
              </div>
            </div>
            <p className="text-xs text-neutral-600">
              Updating the amount will adjust your wallet holdings but keep the asset.
            </p>
          </div>
        )}

        {isSaved && (
          <div className="rounded-2xl border border-neutral-100 bg-white/70 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="uppercase text-[11px]">
                Saved Insight
              </Badge>
              <span className="text-xs text-neutral-400">
                Keep a note of ideas worth revisiting.
              </span>
            </div>
            <p className="text-sm text-neutral-700 leading-relaxed">
              {rowData.prompt}
            </p>
            <p className="text-xs text-neutral-500">
              Launch AI Insights to explore this idea again or remove it to keep
              your workspace tidy.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleChat}
              loading={isChatting}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" /> AI Insights
            </Button>
            {!isSaved && (
              <Button
                variant="outline"
                onClick={handleCryptoDetails}
                className="flex items-center gap-2"
              >
                <Info className="h-4 w-4" /> View Details
              </Button>
            )}
          </div>

          <div className="flex gap-2 sm:justify-end">
            {isWallet && (
              <Button
                onClick={updateItem}
                loading={isUpdating}
                className="flex items-center gap-2"
              >
                Update Holding
              </Button>
            )}
            <Button
              variant="danger"
              onClick={deleteItem}
              loading={isDeleting}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" /> Remove
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

DeleteModal.propTypes = {
  closeModal: PropTypes.func.isRequired,
  rowData: PropTypes.object.isRequired,
  modalType: PropTypes.string.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default DeleteModal;
