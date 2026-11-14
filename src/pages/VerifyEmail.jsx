
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../api/apiConfig";

const API_URL = `${API_BASE_URL}/api`;

function VerifyEmail() {

    const [searchParams] = useSearchParams();

    const [status, setStatus] = useState("loading");

    const [message, setMessage] = useState(
        "Please wait while we verify your email..."
    );

    // Prevent duplicate requests in React StrictMode
    const requestStarted = useRef(false);

    useEffect(() => {

        if (requestStarted.current) {
            return;
        }

        requestStarted.current = true;

        const token = searchParams.get("token");

        if (!token) {
            setStatus("error");
            setMessage("Verification token is missing.");
            return;
        }

        const verifyEmail = async () => {

            try {

                const response = await axios.get(
                    `${API_URL}/auth/verify-email`,
                    {
                        params: { token }
                    }
                );

                setStatus("success");

                setMessage(
                    response.data.message ||
                    "Your email has been verified successfully."
                );

            } catch (error) {

                setStatus("error");

                setMessage(
                    error.response?.data?.message ||
                    "Email verification failed. Please try again."
                );
            }
        };

        verifyEmail();

    }, [searchParams]);

    return (

        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">

            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg text-center">

                {/* Loading */}
                {status === "loading" && (
                    <>
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-5"></div>

                        <h2 className="text-2xl font-bold text-gray-800">
                            Verifying Your Email
                        </h2>
                    </>
                )}

                {/* Success */}
                {status === "success" && (
                    <>
                        <div className="text-5xl mb-4">
                            ✅
                        </div>

                        <h2 className="text-2xl font-bold text-green-600 mb-3">
                            Email Verified!
                        </h2>
                    </>
                )}

                {/* Error */}
                {status === "error" && (
                    <>
                        <div className="text-5xl mb-4">
                            ❌
                        </div>

                        <h2 className="text-2xl font-bold text-red-600 mb-3">
                            Verification Failed
                        </h2>
                    </>
                )}

                {/* Message */}
                <p className="text-gray-600 mt-3 mb-6">
                    {message}
                </p>

                {/* Login button */}
                {status === "success" && (
                    <Link
                        to="/login"
                        className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                    >
                        Continue to Login
                    </Link>
                )}

                {/* Registration button */}
                {status === "error" && (
                    <Link
                        to="/register"
                        className="inline-block bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold transition"
                    >
                        Back to Registration
                    </Link>
                )}

            </div>

        </div>
    );
}

export default VerifyEmail;
