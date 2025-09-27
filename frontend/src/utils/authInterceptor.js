const AUTH_ERROR_CODES = new Set([401, 403, 419, 440]);
let isRedirecting = false;
let isLoggingOut = false;
let interceptorInstalled = false;

export const setupAuthInterceptor = () => {
  if (interceptorInstalled || typeof window === "undefined") {
    return;
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (...args) => {
    const [input] = args;
    const requestUrl =
      typeof input === "string"
        ? input
        : typeof input === "object" && input !== null
        ? input.url
        : "";

    const response = await originalFetch(...args);

    if (
      !isRedirecting &&
      response &&
      AUTH_ERROR_CODES.has(response.status) &&
      !/\/auth\/(login|register)/.test(requestUrl || response.url)
    ) {
      isRedirecting = true;

      if (!isLoggingOut) {
        isLoggingOut = true;
        try {
          await originalFetch("/auth/logout", {
            method: "POST",
            credentials: "include",
          });
        } catch (error) {
          console.warn("Logout request failed during auth interception:", error);
        } finally {
          isLoggingOut = false;
        }
      }

      window.location.href = "/";
    }

    return response;
  };

  interceptorInstalled = true;
};
