import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/userAPI";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await registerUser(formData);
      // Registration successful
      console.log("Registration successful:", data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center mb-12">
        <h2 className="text-2xl font-medium mt-16">
          Don&apos;t have an account?
        </h2>
        <h1 className="text-4xl font-bold mt-2">Sign Up Here</h1>
      </div>

      {error && (
        <div className="w-[80%] max-w-md mb-4 p-2 bg-red-100 text-red-700 text-center rounded absolute">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <div className="flex flex-col items-center">
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleChange}
            className="w-[80%] h-12 px-4 py-2 text-lg border border-customNavyBlue rounded-md mt-48 placeholder-gray-500 shadow-sm focus:ring-2 focus:ring-customNavyBlue transition"
            style={{ backgroundColor: "rgba(248, 250, 252, 0.8)" }}
            required
          />

          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            className="w-[80%] h-12 px-4 py-2 text-lg border border-customNavyBlue rounded-md mt-4 placeholder-gray-500 shadow-sm focus:ring-2 focus:ring-customNavyBlue transition"
            style={{ backgroundColor: "rgba(248, 250, 252, 0.8)" }}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-[80%] h-12 px-4 py-2 text-lg border border-customNavyBlue rounded-md mt-4 placeholder-gray-500 shadow-sm focus:ring-2 focus:ring-customNavyBlue transition"
            style={{ backgroundColor: "rgba(248, 250, 252, 0.8)" }}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-[80%] h-12 px-4 py-2 text-lg border border-customNavyBlue rounded-md mt-4 placeholder-gray-500 shadow-sm focus:ring-2 focus:ring-customNavyBlue transition"
            style={{ backgroundColor: "rgba(248, 250, 252, 0.8)" }}
            required
            minLength="6"
          />

          <button
            type="submit"
            className="bg-customNavyBlue mt-10 text-white font-bold text-2xl w-[80%] h-16 rounded-lg shadow-md hover:bg-[#1e3a8a] active:bg-[#162d6a] transition"
            disabled={loading}
          >
            {loading ? "Registering..." : "Sign Up"}
          </button>
        </div>
      </form>

      <hr className="my-4 border-t-2 border-customNavyBlue w-full" />
      <p className="font-md text-lg">
        Already have an account?{" "}
        <span
          className="font-bold text-lg text-[#D97706] hover:underline cursor-pointer"
          onClick={() => navigate("/")}
        >
          Log in
        </span>
      </p>
    </div>
  );
};

export default RegisterPage;
