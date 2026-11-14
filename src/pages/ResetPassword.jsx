
import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../api/apiConfig";

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get("token");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        if (!token) {
            setError("Invalid or missing password reset link.");
            return;
        }

        if (newPassword.length < 8 || newPassword.length > 72) {
            setError("Password must contain between 8 and 72 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);

            const response = await axios.post(
                `${API_BASE_URL}/api/auth/reset-password`,
                {
                    token: token,
                    newPassword: newPassword
                }
            );

            setMessage(response.data.message);

            setNewPassword("");
            setConfirmPassword("");

            // Redirect to login after successful reset
            setTimeout(() => {
                navigate("/login");
            }, 2500);

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to reset password. Please try again."
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
                        🔑
                    </div>

                    <h1 className="text-2xl font-bold text-gray-800">
                        Reset Your Password
                    </h1>

                    <p className="text-gray-500 mt-2 text-sm">
                        Create a new password for your NeedNetwork account.
                    </p>

                </div>

                {message && (
                    <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-sm">
                        {message}
                        <p className="mt-1">
                            Redirecting to login...
                        </p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                    </label>

                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        minLength={8}
                        maxLength={72}
                        required
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                    />

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                    </label>

                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        minLength={8}
                        maxLength={72}
                        required
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 mb-5"
                    />

                    <button
                        type="submit"
                        disabled={loading || !token || !!message}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
                    >
                        {loading ? "Updating..." : "Reset Password"}
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

export default ResetPassword;
