import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorExist, setErrorExist] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      setMessage("Please enter your email");
      setErrorExist(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post("/auth/password/reset", { email });
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || "Error sending reset email");
      setErrorExist(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center mb-12">
        <h2 className="text-2xl font-medium mt-32">Forgot Your Password?</h2>
        <h1 className="text-4xl font-bold mt-2">Reset It Here</h1>
      </div>

      <div className="w-full max-w-md flex flex-col items-center">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setMessage(""); // clear message on change
            setErrorExist(false); // clear error on change
          }}
          placeholder="Enter your email"
          required
          className="w-[80%] h-12 mt-40 px-4 py-2 text-lg rounded-md border border-customNavyBlue placeholder-gray-500 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-customNavyBlue transition"
          style={{ backgroundColor: "rgba(248, 250, 252, 0.8)" }}
        />
      </div>

      {message && (
        <p
          className={`mt-4 text-center absolute ${
            errorExist ? "text-red-500" : "text-green-500"
          }`}
        >
          {message}
        </p>
      )}

      <button
        onClick={handleResetPassword}
        disabled={isLoading}
        className="bg-customNavyBlue mt-48 text-white font-bold text-2xl w-[80%] h-16 rounded-lg shadow-md hover:bg-[#1e3a8a] active:bg-[#162d6a] transition"
      >
        Reset Password
      </button>

      <hr className="my-4 border-t-2 border-customNavyBlue w-full mt-4" />
      <p className="text-lg font-md text-center">
        Remembered your password?{" "}
        <span
          className="text-[#D97706] font-bold hover:underline cursor-pointer"
          onClick={() => navigate("/")}
        >
          Log in
        </span>
      </p>
    </div>
  );
};

export default ForgotPasswordPage;
