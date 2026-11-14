
import { useState, useEffect } from "react";
import {
  useNavigate,
  Link,
  useLocation,
} from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../api/apiConfig";
import { getMyResources } from "../api/resourceApi";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // New registration email takes priority.
  const initialEmail =
    location.state?.email ||
    sessionStorage.getItem("newlyRegisteredEmail") ||
    localStorage.getItem("rememberedEmail") ||
    "";

  const isNewRegistration = Boolean(
    location.state?.email ||
    sessionStorage.getItem("newlyRegisteredEmail")
  );

  const [formData, setFormData] = useState({
    email: initialEmail,
    password: "",
  });

  const [rememberMe, setRememberMe] = useState(
    !isNewRegistration &&
    Boolean(localStorage.getItem("rememberedEmail"))
  );

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Clear temporary registration data after using it.
  useEffect(() => {
    if (
      location.state?.email ||
      sessionStorage.getItem("newlyRegisteredEmail")
    ) {
      sessionStorage.removeItem("newlyRegisteredEmail");

      navigate("/login", {
        replace: true,
        state: null,
      });
    }
  }, []);

  function handleChange(event) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });

    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const email = formData.email.trim().toLowerCase();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!emailPattern.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!formData.password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      // Authenticate user
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        {
          email,
          password: formData.password,
        }
      );

      const { token, ...user } = response.data;

      // Remember email only, never password.
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      // Store authentication details.
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("user", JSON.stringify(user));

      // Notify Navbar about login.
      window.dispatchEvent(new Event("authChange"));

      // Navigate according to role and ownership.
      if (user.role?.toUpperCase() === "ADMIN") {
        navigate("/admin", { replace: true });
        return;
      }

      try {
        // Fetch resources belonging to logged-in user.
        const resourceResponse = await getMyResources();

        const myResources = resourceResponse.data || [];

        if (myResources.length > 0) {
          // User has offered resources.
          navigate("/owner-dashboard", { replace: true });
        } else {
          // User has not offered resources.
          navigate("/dashboard", { replace: true });
        }

      } catch (resourceError) {
        console.error(
          "Owner resource check failed:",
          resourceError
        );

        // Keep login working if resource check fails.
        navigate("/dashboard", { replace: true });
      }

    } catch (err) {
      console.error("Login error:", err);

      if (err.response?.status === 401) {
        setError(
          "Invalid email or password. Please try again."
        );
      } else {
        setError(
          err.response?.data?.message ||
          "Unable to login. Please check your connection and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">

      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">

        <h1 className="text-3xl font-bold text-center text-green-700 mb-2">
          Welcome Back
        </h1>

        <p className="text-gray-500 text-center mb-8">
          Login to your NeedNetwork account
        </p>

        {/* Registration success message */}
        {location.state?.registrationSuccess && (
          <div className="bg-green-50 text-green-800 p-3 rounded-lg mb-5 text-sm">
            Account created successfully! Please log in.
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-5 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>

            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              autoComplete="username"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-green-500"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Remember Me and Forgot Password */}
          <div className="flex items-center justify-between gap-3">

            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) =>
                  setRememberMe(event.target.checked)
                }
                className="w-4 h-4 accent-green-600"
              />
              Remember me
            </label>

            <Link
              to="/forgot-password"
              className="text-sm text-green-600 font-semibold hover:underline"
            >
              Forgot Password?
            </Link>

          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        <p className="text-center text-gray-600 mt-6">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-green-600 font-semibold hover:underline"
          >
            Register here
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Login;
