
import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../api/apiConfig";

function ResendVerification() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        setMessage("");
        setError("");

        const normalizedEmail = email.trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail)) {
            setError("Please enter a valid email address.");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/auth/resend-verification`,
                {
                    email: normalizedEmail
                }
            );

            setMessage(
                response.data.message ||
                "A new verification email has been sent."
            );

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to send verification email. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="flex min-h-[80vh] items-center justify-center bg-green-50 px-4 py-12">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

                <div className="mb-6 text-center">
                    <div className="mb-3 text-5xl">📩</div>

                    <h1 className="text-3xl font-bold text-green-800">
                        Resend Verification
                    </h1>

                    <p className="mt-3 text-gray-600">
                        Didn't receive your verification email?
                        Enter your registered email address below.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                    <div>
                        <label
                            htmlFor="email"
                            className="mb-1 block font-medium"
                        >
                            Email Address
                        </label>

                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) => {
                                setEmail(event.target.value);
                                setError("");
                                setMessage("");
                            }}
                            placeholder="you@example.com"
                            autoComplete="email"
                            required
                            className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    {message && (
                        <div
                            role="status"
                            className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
                        >
                            {message}
                        </div>
                    )}

                    {error && (
                        <div
                            role="alert"
                            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                        >
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Sending..." : "Resend Verification Email"}
                    </button>

                </form>

                <p className="mt-6 text-center text-gray-600">
                    Already verified?{" "}
                    <Link
                        to="/login"
                        className="font-semibold text-green-700 hover:underline"
                    >
                        Login
                    </Link>
                </p>

                <p className="mt-3 text-center text-gray-600">
                    Don't have an account?{" "}
                    <Link
                        to="/register"
                        className="font-semibold text-green-700 hover:underline"
                    >
                        Register
                    </Link>
                </p>

            </div>
        </section>
    );
}

export default ResendVerification;
