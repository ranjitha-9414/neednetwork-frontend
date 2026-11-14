
import React, { useEffect, useState } from "react";
import {
  getOwnerRequests,
  getMyResources,
} from "../api/resourceApi";

function OwnerDashboard() {
  const [requests, setRequests] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");

  // Fetch resources and requests belonging to logged-in owner
  const fetchOwnerData = async () => {
    try {
      setLoading(true);
      setError("");

      const [requestResponse, resourceResponse] =
        await Promise.all([
          getOwnerRequests(),
          getMyResources(),
        ]);

      setRequests(requestResponse.data || []);
      setResources(resourceResponse.data || []);
    } catch (err) {
      console.error("Owner dashboard error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load owner dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnerData();
  }, []);

  // Request statistics
  const totalRequests = requests.length;

  const pendingRequests = requests.filter(
    (r) => r.status === "PENDING"
  ).length;

  const approvedRequests = requests.filter(
    (r) => r.status === "APPROVED"
  ).length;

  const returnedRequests = requests.filter(
    (r) => r.status === "RETURNED"
  ).length;

  const rejectedRequests = requests.filter(
    (r) => r.status === "REJECTED"
  ).length;

  // Resource statistics
  const totalResources = resources.length;

  const availableResources = resources.filter(
    (r) => r.available === true
  ).length;

  const borrowedResources = resources.filter(
    (r) => r.available === false
  ).length;

  // Number of requests received for each resource
  const getResourceRequestCount = (resourceId) =>
    requests.filter(
      (request) => request.resource?.id === resourceId
    ).length;

  // Status filters
  const filteredRequests =
    filter === "ALL"
      ? requests
      : requests.filter((r) => r.status === filter);

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-blue-100 text-blue-800";
      case "RETURNED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">
          Loading owner dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>

        <button
          onClick={fetchOwnerData}
          className="bg-green-700 text-white px-5 py-2 rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row
          md:items-center md:justify-between mb-8 gap-4">

          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Resource Owner Dashboard
            </h1>

            <p className="text-gray-500 mt-2">
              Manage your resources and monitor borrowing requests.
            </p>
          </div>

          <button
            onClick={fetchOwnerData}
            className="bg-green-700 hover:bg-green-800
              text-white px-5 py-2 rounded-lg"
          >
            Refresh Dashboard
          </button>
        </div>

        {/* Resource Inventory */}
        <section className="mb-10">

          <h2 className="text-2xl font-bold text-gray-800 mb-5">
            My Resource Inventory
          </h2>

          {/* Resource Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

            <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-green-600">
              <p className="text-gray-500 text-sm">
                Total Resources
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {totalResources}
              </h3>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-blue-500">
              <p className="text-gray-500 text-sm">
                Available Resources
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {availableResources}
              </h3>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-orange-500">
              <p className="text-gray-500 text-sm">
                Currently Borrowed
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {borrowedResources}
              </h3>
            </div>

          </div>

          {/* Resource Cards */}
          {resources.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <p className="text-gray-500">
                You haven't offered any resources yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

              {resources.map((resource) => {
                const requestCount =
                  getResourceRequestCount(resource.id);

                return (
                  <div
                    key={resource.id}
                    className="bg-white rounded-xl shadow-sm overflow-hidden"
                  >
                    <img
                      src={
                        resource.imageUrl ||
                        resource.imageUrls?.[0] ||
                        "https://placehold.co/400x250?text=Resource"
                      }
                      alt={resource.title}
                      className="w-full h-48 object-cover"
                    />

                    <div className="p-5">

                      <h3 className="text-lg font-bold text-gray-800">
                        {resource.title}
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        {resource.category}
                      </p>

                      <p className="text-sm text-gray-500 mt-2">
                        Condition: {resource.condition || "N/A"}
                      </p>

                      <p className="text-sm text-gray-500">
                        Location: {resource.location || "N/A"}
                      </p>

                      <div className="flex justify-between items-center mt-4 gap-2">

                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          resource.available
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}>
                          {resource.available
                            ? "Available"
                            : "Currently Borrowed"}
                        </span>

                        <span className="text-sm font-semibold text-gray-700">
                          {requestCount} {requestCount === 1 ? "Request" : "Requests"}
                        </span>

                      </div>

                      {requestCount === 0 && (
                        <p className="text-xs text-gray-400 mt-3">
                          No borrowing requests received yet.
                        </p>
                      )}

                    </div>
                  </div>
                );
              })}

            </div>
          )}
        </section>

        {/* Borrowing Request Statistics */}
        <section className="mb-8">

          <h2 className="text-2xl font-bold text-gray-800 mb-5">
            Borrowing Request Overview
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

            {[
              {
                label: "Total Requests",
                value: totalRequests,
                color: "border-gray-500",
                status: "ALL",
              },
              {
                label: "Pending",
                value: pendingRequests,
                color: "border-yellow-500",
                status: "PENDING",
              },
              {
                label: "Approved",
                value: approvedRequests,
                color: "border-blue-500",
                status: "APPROVED",
              },
              {
                label: "Returned",
                value: returnedRequests,
                color: "border-green-500",
                status: "RETURNED",
              },
              {
                label: "Rejected",
                value: rejectedRequests,
                color: "border-red-500",
                status: "REJECTED",
              },
            ].map((item) => (
              <button
                key={item.status}
                onClick={() => setFilter(item.status)}
                className={`bg-white p-5 rounded-xl shadow-sm
                  border-l-4 ${item.color} text-left
                  hover:shadow-md transition ${
                    filter === item.status
                      ? "ring-2 ring-green-600"
                      : ""
                  }`}
              >
                <p className="text-gray-500 text-sm">
                  {item.label}
                </p>

                <h3 className="text-3xl font-bold text-gray-800 mt-2">
                  {item.value}
                </h3>
              </button>
            ))}

          </div>
        </section>

        {/* Borrowing Requests */}
        <section className="bg-white rounded-xl shadow-sm p-5">

          <div className="flex flex-col sm:flex-row
            sm:justify-between sm:items-center gap-3 mb-5">

            <h2 className="text-xl font-bold text-gray-800">
              Borrowing Requests
            </h2>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="ALL">All Requests</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="RETURNED">Returned</option>
              <option value="REJECTED">Rejected</option>
            </select>

          </div>

          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No requests found for this filter.
              </p>
            </div>
          ) : (

            <div className="space-y-5">

              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-xl p-4 hover:shadow-sm transition"
                >

                  {/* Resource Information */}
                  <div className="flex flex-col md:flex-row
                    md:justify-between gap-4">

                    <div className="flex gap-4">

                      <img
                        src={
                          request.resource?.imageUrl ||
                          request.resource?.imageUrls?.[0] ||
                          "https://placehold.co/100x100?text=Resource"
                        }
                        alt={request.resource?.title || "Resource"}
                        className="w-24 h-24 object-cover rounded-lg"
                      />

                      <div>
                        <h3 className="font-bold text-lg text-gray-800">
                          {request.resource?.title || "Resource"}
                        </h3>

                        <p className="text-sm text-gray-500">
                          Category: {request.resource?.category || "N/A"}
                        </p>

                        <p className="text-sm text-gray-500">
                          Request ID: #{request.id}
                        </p>

                        <p className="text-sm text-gray-500">
                          Location: {request.resource?.location || "N/A"}
                        </p>
                      </div>

                    </div>

                    <div>
                      <span className={`px-3 py-1 rounded-full
                        text-sm font-semibold ${getStatusStyle(request.status)}`}>
                        {request.status}
                      </span>
                    </div>

                  </div>

                  {/* Requester and Borrowing Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2
                    gap-4 mt-5 bg-gray-50 rounded-lg p-4">

                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">
                        Requester Details
                      </h4>

                      <p className="text-sm text-gray-600">
                        Name: {request.requesterName}
                      </p>

                      <p className="text-sm text-gray-600">
                        Email: {request.requesterEmail}
                      </p>

                      <p className="text-sm text-gray-600">
                        Phone: {request.requesterPhone || "N/A"}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">
                        Borrowing Details
                      </h4>

                      <p className="text-sm text-gray-600">
                        Reason: {request.reason}
                      </p>

                      <p className="text-sm text-gray-600">
                        Duration: {request.duration || "N/A"}
                      </p>

                      <p className="text-sm text-gray-600">
                        Pickup Date: {formatDate(request.pickupDate)}
                      </p>

                      <p className="text-sm text-gray-600">
                        Requested On: {formatDate(request.createdAt)}
                      </p>

                      {request.returnedAt && (
                        <p className="text-sm text-green-700 font-medium">
                          Returned On: {formatDate(request.returnedAt)}
                        </p>
                      )}

                    </div>

                  </div>

                </div>
              ))}

            </div>

          )}

        </section>

      </div>
    </div>
  );
}

export default OwnerDashboard;
