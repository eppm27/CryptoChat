import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/userAPI";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await loginUser({ email, password });

      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    document.title = "Login Page";
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center mb-12">
        <h2 className="text-2xl font-medium mt-32">Welcome Back To</h2>
        <h1 className="text-4xl font-bold mt-2">CryptoChat</h1>
      </div>

      {error && (
        <div className="absolute mb-4 p-3 bg-red-100 text-red-700 rounded-md text-center">
          {error}
        </div>
      )}

      <div className="w-full max-w-md">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-[80%] h-12 px-4 py-2 text-lg border border-customNavyBlue rounded-md mt-48 placeholder-gray-500 bg-white shadow-sm focus:ring-2 focus:ring-customNavyBlue focus:outline-none transition"
          placeholder="Email"
          style={{ backgroundColor: "rgba(248, 250, 252, 0.8)" }}
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-[80%] h-12 px-4 py-2 text-lg border border-customNavyBlue rounded-md mt-4 placeholder-gray-500 bg-white shadow-sm focus:ring-2 focus:ring-customNavyBlue focus:outline-none transition"
          placeholder="Password"
          style={{ backgroundColor: "rgba(248, 250, 252, 0.8)" }}
          required
        />
      </div>

      <button
        className="bg-customNavyBlue mt-16 text-white font-bold text-2xl w-[80%] h-16 rounded-xl shadow-md hover:bg-[#1e3a8a] active:bg-[#162d6a] transition"
        onClick={handleLogin}
      >
        Login
      </button>

      <p
        className="font-bold text-lg mt-4 text-[#D97706] hover:underline cursor-pointer"
        onClick={() => navigate("/forgot")}
      >
        Forgot password?
      </p>

      <hr className="my-4 border-t-2 border-customNavyBlue w-full" />
      <p>
        <span className="font-md text-lg">Don&apos;t have an account? </span>
        <span
          className="font-md text-lg font-bold text-[#D97706] hover:underline cursor-pointer"
          onClick={() => navigate("/register")}
        >
          Get started
        </span>
      </p>
    </div>
  );
};

export default LoginPage;
