export const fetchUserData = async () => {
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
    return data.user;
  } catch (err) {
    console.error("Error fetching user data:", err);
    throw err;
  }
};

// also move login and logout here
export const logoutUser = async () => {
  try {
    const response = await fetch("/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Logout failed");
    }

    return response;
  } catch (err) {
    throw new Error("Logout failed: " + err.message);
  }
};

export const updateUserInfo = async ({ firstName, lastName, pfp }) => {
  try {
    const response = await fetch("/user/update-user-info", {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName,
        lastName,
        pfp,
      }),
    });

    if (!response.ok) {
      throw new Error("udpate user failed");
    }

    return "User details changed successfully";
  } catch (err) {
    throw new Error("update user failed: " + err.message);
  }
};

export const addCryptoToWallet = async (selectedCrypto, cryptoAmount) => {
  try {
    const response = await fetch("/user/add-crypto", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        cryptoName: selectedCrypto.name,
        cryptoSymbol: selectedCrypto.symbol,
        cryptoId: selectedCrypto.id,
        amount: parseFloat(cryptoAmount),
      }),
    });

    if (!response.ok) throw new Error(await response.text());

    // also add the crypto to watchlist
    try {
      await addCryptoToWatchlist(selectedCrypto);
    } catch (watchlistError) {
      console.warn("Could not add to watchlist:", watchlistError.message);
    }

    return "Crypto added successfully to wallet";
  } catch (error) {
    throw new Error(error.message || "Failed to add crypto to wallet");
  }
};

export const addCryptoToWatchlist = async (selectedCrypto) => {
  try {
    const response = await fetch("/user/add-to-watchlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        cryptoName: selectedCrypto.name,
        cryptoSymbol: selectedCrypto.symbol,
        cryptoId: selectedCrypto.id,
      }),
    });

    if (!response.ok) throw new Error(await response.text());
    return "Crypto added successfully to watchlist";
  } catch (error) {
    throw new Error(error.message || "Failed to add crypto to watchlist");
  }
};

export const addPromptToSaved = async (savePrompt) => {
  try {
    const response = await fetch("/user/add-saved-prompt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        savePrompt,
      }),
    });

    if (!response.ok) throw new Error(await response.text());
    return "Crypto added successfully to savedPrompts";
  } catch (error) {
    throw new Error(error.message || "Failed to add crypto to savedPrompts");
  }
};

export const deleteCryptoFromWallet = async (rowData) => {
  try {
    const response = await fetch("/user/remove-from-wallet", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        rowData: rowData,
      }),
    });

    if (!response.ok) throw new Error(await response.text());
    return "Crypto removed from wallet";
  } catch (error) {
    throw new Error(error.message || "Failed to delete crypto from wallet");
  }
};

export const deleteCryptoFromWatchlist = async (rowData) => {
  try {
    const response = await fetch("/user/remove-from-watchlist", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        rowData: rowData,
      }),
    });

    if (!response.ok) throw new Error(await response.text());
    return "Crypto removed from watchlist";
  } catch (error) {
    throw new Error(error.message || "Failed to delete crypto from watchlist");
  }
};

export const deletePromptFromSaved = async (rowData) => {
  try {
    const response = await fetch("/user/remove-from-saved", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        rowData: rowData,
      }),
    });

    if (!response.ok) throw new Error(await response.text());
    return "Prompt removed from saved";
  } catch (error) {
    throw new Error(error.message || "Failed to delete prompt from saved");
  }
};

export const updateCryptoAmount = async (rowData, amount) => {
  try {
    const response = await fetch("/user/update-crypto-amount", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        rowData: rowData,
        newAmount: amount,
      }),
    });

    if (!response.ok) throw new Error(await response.text());
    return "Crypto updated from wallet";
  } catch (error) {
    throw new Error(error.message || "Failed to update crypto from wallet");
  }
};

export const createChat = async (initialContent = "") => {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ content: initialContent }),
  });

  if (!response.ok) throw new Error("Failed to create chat");
  return response.json();
};

export const getAllChats = async () => {
  const response = await fetch("/api/chat", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!response.ok) throw new Error("Failed to fetch chats");
  return response.json();
};

export const getChatMessages = async (chatId) => {
  const response = await fetch(`/api/chat/${chatId}/messages`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!response.ok) throw new Error("Failed to fetch chat messages");
  return response.json();
};

export const sendMessageToChat = async (chatId, content) => {
  const response = await fetch(`/api/chat/${chatId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to send message");
  }

  return response.json();
};

export const deleteChat = async (chatId) => {
  const response = await fetch(`/api/chat/${chatId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!response.ok) throw new Error("Failed to delete chat");
};

export const loginUser = async ({ email, password }) => {
  try {
    const response = await fetch("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Login failed");
    }

    return response.json();
  } catch (err) {
    throw new Error("Login failed: " + err.message);
  }
};

export const registerUser = async ({
  firstName,
  lastName,
  email,
  password,
}) => {
  try {
    const response = await fetch("/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ firstName, lastName, email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Registration failed");
    }

    return response.json();
  } catch (err) {
    throw new Error("Registration failed: " + err.message);
  }
};
