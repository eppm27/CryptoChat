import React, { useEffect, useState } from "react";
import { message, Select } from "antd";
import PropTypes from "prop-types";
import "@ant-design/v5-patch-for-react-19";
import {
  addCryptoToWallet,
  addCryptoToWatchlist,
  addPromptToSaved,
} from "../services/userAPI";

const AddModal = ({ closeModal, onSuccess, modalType }) => {
  const [cryptos, setCryptos] = useState([]);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [savePrompt, setSavePrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [cryptoLoading, setCryptoLoading] = useState(false);
  const [userData, setUserData] = useState();
  const [errorExist, setErrorExist] = useState(false);
  const [errorType, setErrorType] = useState(null);

  const handleSave = async () => {
    if (modalType === "wallet") {
      if (!selectedCrypto || !cryptoAmount) {
        message.error("Please fill in all wallet fields.");
        return;
      }

      setLoading(true);

      if (
        !userData.wallet.find((term) => term.cryptoId === selectedCrypto.id)
      ) {
        try {
          const msg = await addCryptoToWallet(selectedCrypto, cryptoAmount);
          message.success(msg);
          onSuccess?.();
          closeModal();
        } catch (error) {
          console.error("Wallet error:", error);
          message.error(error.message || "Failed to add to wallet");
        }
      } else {
        setErrorExist(true);
        setErrorType("Crypto already exists in wallet");
      }

      setLoading(false);
    } else if (modalType === "watchlist") {
      if (!selectedCrypto) {
        message.error("Please select a crypto.");
        return;
      }

      setLoading(true);

      if (
        !userData.watchlist.find((term) => term.cryptoId === selectedCrypto.id)
      ) {
        try {
          const msg = await addCryptoToWatchlist(selectedCrypto);
          message.success(msg);
          onSuccess?.();
          closeModal();
        } catch (error) {
          console.error("Watchlist error:", error);
          message.error(error.message || "Failed to add to watchlist");
        }
      } else {
        setErrorExist(true);
        setErrorType("Crypto already exists in watchlist");
      }

      setLoading(false);
    } else if (modalType === "savedPrompts") {
      if (!savePrompt) {
        message.error("Please enter a prompt.");
        return;
      }

      setLoading(true);

      if (
        !userData.savedPrompts.find(
          (term) => term.prompt.toLowerCase() === savePrompt.toLowerCase()
        )
      ) {
        try {
          const msg = await addPromptToSaved(savePrompt);
          message.success(msg);
          onSuccess?.();
          closeModal();
        } catch (error) {
          console.error("Saved Prompt error:", error);
          message.error(error.message || "Failed to save prompt");
        }
      } else {
        setErrorExist(true);
        setErrorType("Prompt already exists in saved");
      }

      setLoading(false);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch("/user/user-data", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const data = await response.json();
        setUserData(data.user);
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };

    loadUserData();

    if (modalType === "wallet" || modalType === "watchlist") {
      setCryptoLoading(true);
      const loadCryptos = async () => {
        try {
          const res = await fetch("/api/crypto/cryptos");
          const data = await res.json();
          data.sort((a, b) => a.name.localeCompare(b.name));
          setCryptos(data);
        } catch (err) {
          console.error("Failed to fetch cryptos:", err);
        } finally {
          setCryptoLoading(false);
        }
      };
      loadCryptos();
    }
  }, [modalType]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50 px-4">
      <div
        className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl space-y-6 border border-gray-200"
        data-testid="add-modal"
      >
        <h2 className="text-2xl font-semibold text-center">
          {modalType === "wallet"
            ? "Add Crypto to Wallet"
            : modalType === "watchlist"
            ? "Add Crypto to Watchlist"
            : "Save a Prompt"}
        </h2>

        <div className="space-y-4">
          {(modalType === "wallet" || modalType === "watchlist") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Coin:
              </label>
              <Select
                showSearch
                placeholder="Choose a crypto"
                optionFilterProp="children"
                className="w-full"
                onChange={(value) => {
                  const selected = cryptos.find((c) => c.id === value);
                  setSelectedCrypto(selected);

                  // check if the selected one exists
                  if (modalType === "wallet") {
                    const cryptoExists = userData?.wallet?.some(
                      (term) => term.cryptoId === selected.id
                    );
                    if (!cryptoExists) {
                      setErrorExist(false);
                      setErrorType(null);
                    }
                  } else if (modalType === "watchlist") {
                    const cryptoExists = userData?.watchlist?.some(
                      (term) => term.cryptoId === selected.id
                    );
                    if (!cryptoExists) {
                      setErrorExist(false);
                      setErrorType(null);
                    }
                  }
                }}
                loading={cryptoLoading}
                notFoundContent={
                  cryptoLoading ? "Loading..." : "No crypto found"
                }
                disabled={loading}
              >
                {cryptos.map((crypto) => (
                  <Select.Option key={crypto.id} value={crypto.id}>
                    {crypto.name}
                  </Select.Option>
                ))}
              </Select>

              {errorExist && (
                <p className="text-red-600">
                  * {selectedCrypto.name} already exists in{" "}
                  {errorType === "Crypto already exists in wallet"
                    ? "wallet"
                    : "watchlist"}
                </p>
              )}
            </div>
          )}

          {modalType === "wallet" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount:
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 2.5"
                  value={cryptoAmount}
                  onChange={(e) => setCryptoAmount(e.target.value)}
                  disabled={loading}
                />
              </div>
            </>
          )}

          {modalType === "savedPrompts" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prompt:
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Write your prompt here..."
                value={savePrompt}
                onChange={(e) => {
                  setSavePrompt(e.target.value);

                  const promptExists = userData?.savedPrompts?.some(
                    (term) => term === savePrompt
                  );
                  if (!promptExists) {
                    setErrorExist(false);
                    setErrorType(null);
                  }
                }}
                disabled={loading}
              />

              {errorExist && errorType === "Prompt already exists in saved" && (
                <p className="text-red-600">
                  * {savePrompt} already exists in saved
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between gap-4 pt-4">
          <button
            className="w-full py-2 px-4 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 transition"
            onClick={closeModal}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="w-full py-2 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddModal;

AddModal.propTypes = {
  closeModal: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  modalType: PropTypes.oneOf(["wallet", "watchlist", "savedPrompts"])
    .isRequired,
};
