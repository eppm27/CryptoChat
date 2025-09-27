import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/userAPI";
import { Button, Input, GlassCard } from "../components/ui/index";

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

  useEffect(() => {
    document.title = "Register - CryptoChat";
  }, []);

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
      console.log("Registration successful:", data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Icons
  const UserIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const EmailIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
    </svg>
  );

  const LockIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-primary-50 to-secondary-100 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-secondary-400/20 to-primary-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-primary-400/20 to-secondary-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-secondary-500 to-primary-500 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2">
            Join CryptoChat
          </h1>
          <p className="text-neutral-600 text-lg">
            Start your crypto journey today
          </p>
        </div>

        {/* Registration Form */}
        <GlassCard className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-danger-50 border border-danger-200 text-danger-700 rounded-xl text-sm animate-slide-down">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="text"
                name="firstName"
                label="First Name"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                icon={<UserIcon />}
                required
              />
              
              <Input
                type="text"
                name="lastName"
                label="Last Name"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                icon={<UserIcon />}
                required
              />
            </div>

            <Input
              type="email"
              name="email"
              label="Email Address"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
              icon={<EmailIcon />}
              required
            />

            <Input
              type="password"
              name="password"
              label="Password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              icon={<LockIcon />}
              required
            />

            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="terms"
                className="w-4 h-4 text-primary-600 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500 focus:ring-2 mt-1"
                required
              />
              <label htmlFor="terms" className="text-sm text-neutral-600">
                I agree to the{' '}
                <a href="#" className="text-primary-600 hover:underline font-medium">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary-600 hover:underline font-medium">
                  Privacy Policy
                </a>
              </label>
            </div>

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full"
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-neutral-600">
              Already have an account?{' '}
              <Link 
                to="/" 
                className="text-primary-600 hover:text-primary-700 font-semibold"
              >
                Sign in
              </Link>
            </p>
          </div>
        </GlassCard>

        {/* Benefits */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mx-auto">
              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-sm text-neutral-600 font-medium">Real-time Analysis</p>
          </div>
          
          <div className="space-y-2">
            <div className="w-8 h-8 bg-secondary-100 rounded-lg flex items-center justify-center mx-auto">
              <svg className="w-4 h-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-sm text-neutral-600 font-medium">Secure & Private</p>
          </div>
          
          <div className="space-y-2">
            <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center mx-auto">
              <svg className="w-4 h-4 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-sm text-neutral-600 font-medium">Smart Insights</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;