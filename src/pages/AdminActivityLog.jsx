
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAllAdminActivityHistory } from "../api/adminUserApi";

function formatDateTime(date) {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminActivityLog() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState("All");

  async function fetchActivities() {
    try {
      setLoading(true);
      setError("");

      const response = await getAllAdminActivityHistory();

      setActivities(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      console.error("Error loading activity history:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load account activity history. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchActivities();
  }, []);

  const totalActivities = activities.length;

  const activatedCount = activities.filter(
    activity => activity.action === "ACTIVATED"
  ).length;

  const deactivatedCount = activities.filter(
    activity => activity.action === "DEACTIVATED"
  ).length;

  const affectedUsers = new Set(
    activities.map(activity => activity.targetUserId)
  ).size;

  const filteredActivities = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return activities.filter(activity => {
      const matchesSearch =
        !term ||
        activity.targetUserName?.toLowerCase().includes(term) ||
        activity.targetUserEmail?.toLowerCase().includes(term) ||
        activity.adminEmail?.toLowerCase().includes(term) ||
        String(activity.targetUserId).includes(term);

      const matchesAction =
        selectedAction === "All" ||
        activity.action === selectedAction;

      return matchesSearch && matchesAction;
    });
  }, [activities, searchTerm, selectedAction]);

  function clearFilters() {
    setSearchTerm("");
    setSelectedAction("All");
  }

  return (
    <section className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-7xl">

        {/* Page Header */}
        <div className="mb-8 rounded-2xl bg-gray-900 p-8 text-white">
          <p className="mb-2 text-gray-300">
            NeedNetwork Administration
          </p>

          <h1 className="text-3xl font-bold">
            Admin Activity Log
          </h1>

          <p className="mt-3 text-gray-300">
            Monitor account activation and deactivation
            activities across NeedNetwork.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/admin"
              className="rounded-lg bg-white px-5 py-2 font-semibold text-gray-900 hover:bg-gray-200"
            >
              ← Admin Dashboard
            </Link>

            <Link
              to="/admin/users"
              className="rounded-lg border border-white px-5 py-2 font-semibold text-white hover:bg-gray-800"
            >
              User Management
            </Link>

            <button
              onClick={fetchActivities}
              disabled={loading}
              className="rounded-lg border border-white px-5 py-2 font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "↻ Refresh Log"}
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Activities
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalActivities}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Users Affected
            </p>
            <p className="mt-2 text-3xl font-bold text-blue-700">
              {affectedUsers}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Activations
            </p>
            <p className="mt-2 text-3xl font-bold text-green-700">
              {activatedCount}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Deactivations
            </p>
            <p className="mt-2 text-3xl font-bold text-red-600">
              {deactivatedCount}
            </p>
          </div>

        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <p>{error}</p>

            <button
              onClick={fetchActivities}
              className="mt-2 font-semibold underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Activity List */}
        <div className="rounded-xl bg-white p-6 shadow-sm">

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Account Activity
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Complete history of account status changes.
              </p>
            </div>

            <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
              {filteredActivities.length} of {totalActivities} activities
            </span>
          </div>

          {/* Search and Filter */}
          <div className="mb-5 grid gap-4 sm:grid-cols-2">

            <div>
              <label
                htmlFor="activitySearch"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Search activities
              </label>

              <input
                id="activitySearch"
                type="search"
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder="Search name, email or user ID..."
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label
                htmlFor="actionFilter"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Filter by action
              </label>

              <select
                id="actionFilter"
                value={selectedAction}
                onChange={event => setSelectedAction(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3"
              >
                <option value="All">All Activities</option>
                <option value="ACTIVATED">Activated</option>
                <option value="DEACTIVATED">Deactivated</option>
              </select>
            </div>

          </div>

          <div className="mb-6 flex justify-end">
            <button
              onClick={clearFilters}
              className="text-sm font-semibold text-red-600 hover:underline"
            >
              Clear filters
            </button>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="py-12 text-center text-gray-500">
              Loading account activity...
            </div>
          ) : error ? (
            <div className="py-8 text-center text-gray-500">
              Activity records could not be loaded.
            </div>
          ) : activities.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-4xl">📋</p>
              <h3 className="mt-3 font-semibold text-gray-700">
                No activity records yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Account status changes will appear here.
              </p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-lg font-semibold text-gray-700">
                No matching activities
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Try changing your search or filter.
              </p>
            </div>
          ) : (
            <div className="space-y-4">

              {filteredActivities.map(activity => (
                <article
                  key={activity.id}
                  className="rounded-xl border border-gray-200 p-5 transition hover:shadow-sm"
                >

                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">

                    <div className="flex items-start gap-3">

                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl ${
                          activity.action === "ACTIVATED"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {activity.action === "ACTIVATED" ? "✓" : "⊘"}
                      </span>

                      <div>
                        <h3 className="font-bold text-gray-900">
                          {activity.targetUserName}
                        </h3>

                        <p className="mt-1 break-all text-sm text-gray-600">
                          {activity.targetUserEmail}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          User ID: #{activity.targetUserId}
                          {" · "}
                          Activity ID: #{activity.id}
                        </p>
                      </div>

                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                        activity.action === "ACTIVATED"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {activity.action}
                    </span>

                  </div>

                  <div className="mt-5 grid gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">

                    <div>
                      <p className="text-xs text-gray-500">
                        Previous Status
                      </p>
                      <p className="mt-1 font-semibold text-gray-800">
                        {activity.previousStatus ? "Active" : "Inactive"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        New Status
                      </p>
                      <p className="mt-1 font-semibold text-gray-800">
                        {activity.newStatus ? "Active" : "Inactive"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Changed By
                      </p>
                      <p className="mt-1 break-all font-medium text-gray-800">
                        {activity.adminEmail || "Not available"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Date and Time
                      </p>
                      <p className="mt-1 font-medium text-gray-800">
                        {formatDateTime(activity.createdAt)}
                      </p>
                    </div>

                  </div>

                </article>
              ))}

            </div>
          )}

        </div>

      </div>
    </section>
  );
}

export default AdminActivityLog;
