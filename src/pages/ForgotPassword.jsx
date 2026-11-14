
import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../api/apiConfig";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }

        try {
            setLoading(true);

            const response = await axios.post(
                `${API_BASE_URL}/api/auth/forgot-password`,
                {
                    email: email.trim()
                }
            );

            setMessage(response.data.message);

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to process your request. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">

            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">

                <div className="text-center mb-6">

                    <div className="text-4xl mb-3">
                        🔐
                    </div>

                    <h1 className="text-2xl font-bold text-gray-800">
                        Forgot Password?
                    </h1>

                    <p className="text-gray-500 mt-2 text-sm">
                        Enter your registered email address.
                        We'll send you a password reset link.
                    </p>

                </div>

                {message && (
                    <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-sm">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                    </label>

                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 mb-5"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
                    >
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>

                </form>

                <div className="text-center mt-6">

                    <Link
                        to="/login"
                        className="text-blue-600 hover:underline text-sm font-medium"
                    >
                        ← Back to Login
                    </Link>

                </div>

            </div>

        </div>
    );
}

export default ForgotPassword;
