
import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../api/apiConfig";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  role: "",
};

function Register() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "phone") {
      const phoneValue = value.replace(/\D/g, "").slice(0, 10);

      setForm((previous) => ({
        ...previous,
        phone: phoneValue,
      }));
    } else {
      setForm((previous) => ({
        ...previous,
        [name]: value,
      }));
    }

    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const email = form.email.trim().toLowerCase();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const phonePattern = /^[6-9]\d{9}$/;

    if (form.fullName.trim().length < 2) {
      setError("Please enter a valid full name.");
      return;
    }

    if (!emailPattern.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!phonePattern.test(form.phone)) {
      setError(
        "Enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9."
      );
      return;
    }

    if (!["USER", "VOLUNTEER", "NGO"].includes(form.role)) {
      setError("Please select a valid role.");
      return;
    }

    if (form.password.length < 8 || form.password.length > 72) {
      setError("Password must contain between 8 and 72 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${API_BASE_URL}/api/auth/register`,
        {
          fullName: form.fullName.trim(),
          email,
          phone: form.phone,
          password: form.password,
          role: form.role,
        }
      );

      // Store the email for the verification confirmation screen.
      setRegisteredEmail(email);

      // Clear registration form data.
      setForm(initialForm);

    } catch (err) {
      console.error("Registration error:", err);

      if (err.response?.status === 400) {
        setError(
          err.response?.data?.message ||
          "Registration failed. This email may already be registered."
        );
      } else {
        setError(
          err.response?.data?.message ||
          "Unable to register. Please check your backend server."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // Show this screen after successful registration.
  if (registeredEmail) {
    return (
      <section className="flex min-h-[80vh] items-center justify-center bg-green-50 px-4 py-12">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-lg">

          <div className="mb-5 text-6xl">📩</div>

          <h1 className="text-3xl font-bold text-green-800">
            Check Your Email!
          </h1>

          <p className="mt-4 text-gray-600">
            Your NeedNetwork account has been created successfully.
            We have sent a verification link to:
          </p>

          <p className="mt-3 break-all font-semibold text-green-700">
            {registeredEmail}
          </p>

          <div className="mt-6 rounded-lg bg-green-50 p-4 text-left text-sm text-gray-700">
            <p className="font-semibold">What should you do next?</p>

            <ol className="mt-2 list-decimal space-y-2 pl-5">
              <li>Open your email inbox.</li>
              <li>Find the email from NeedNetwork.</li>
              <li>Click the verification link.</li>
              <li>Return to NeedNetwork and log in.</li>
            </ol>
          </div>

          <p className="mt-5 text-sm text-gray-500">
            The verification link expires after 30 minutes.
            Check your spam folder if you cannot find the email.
          </p>

          <Link
            to="/login"
            className="mt-7 inline-block w-full rounded-lg bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800"
          >
            Go to Login
          </Link>

        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-[80vh] items-center justify-center bg-green-50 px-4 py-12">

      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg">

        {/* Heading */}
        <div className="mb-8 text-center">
          <div className="mb-3 text-4xl">🌱</div>

          <h1 className="text-3xl font-bold text-green-800">
            Join NeedNetwork
          </h1>

          <p className="mt-2 text-gray-600">
            Create an account and become part of a caring community.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="mb-1 block font-medium">
              Full Name
            </label>

            <input
              id="fullName"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              autoComplete="name"
              required
              className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-1 block font-medium">
              Email Address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="mb-1 block font-medium">
              Phone Number
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              value={form.phone}
              onChange={handleChange}
              placeholder="10-digit mobile number"
              maxLength={10}
              autoComplete="tel-national"
              required
              className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            <p className="mt-1 text-xs text-gray-500">
              Enter a 10-digit Indian mobile number starting with 6–9.
            </p>
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="mb-1 block font-medium">
              I want to join as
            </label>

            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Choose your role</option>
              <option value="USER">Person in Need</option>
              <option value="VOLUNTEER">Volunteer</option>
              <option value="NGO">NGO Representative</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="mb-1 block font-medium">
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                minLength={8}
                maxLength={72}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                required
                className="w-full rounded-lg border border-gray-300 p-3 pr-12 focus:outline-none focus:ring-2 focus:ring-green-500"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block font-medium"
            >
              Confirm Password
            </label>

            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={handleChange}
                minLength={8}
                maxLength={72}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                required
                className="w-full rounded-lg border border-gray-300 p-3 pr-12 focus:outline-none focus:ring-2 focus:ring-green-500"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showConfirmPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

        </form>

        <p className="mt-6 text-center text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-green-700 hover:underline"
          >
            Login
          </Link>
        </p>

      </div>
    </section>
  );
}

export default Register;
