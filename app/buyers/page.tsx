"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Buyer = {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  city: string;
  propertyType: string;
  budgetMin?: number;
  budgetMax?: number;
  timeline: string;
  status: string;
  updatedAt: string;
  ownerId: string;
};

const timelineDisplay: Record<string, string> = {
  ZERO_TO_THREE: "0-3m",
  THREE_TO_SIX: "3-6m",
  MORE_THAN_SIX: ">6m",
  EXPLORING: "Exploring",
};

const statusDisplay: Record<string, string> = {
  New: "New",
  Qualified: "Qualified",
  Contacted: "Contacted",
  Visited: "Visited",
  Negotiation: "Negotiation",
  Converted: "Converted",
  Dropped: "Dropped",
};

export default function BuyersPage() {
  const router = useRouter();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  const [filters, setFilters] = useState({
    city: "",
    propertyType: "",
    status: "",
    timeline: "",
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [sortBy, setSortBy] = useState<keyof Buyer>("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");


  useEffect(() => {
    const fetchUser = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) return;
      setCurrentUserId(userId);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 5000);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchBuyers = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You must be logged in to view buyers.");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("pageSize", "10");
      params.append("sortBy", sortBy);
      params.append("sortDir", sortDir);
      if (debouncedSearch) params.append("search", debouncedSearch);
      Object.keys(filters).forEach((key) => {
        if ((filters as any)[key]) params.append(key, (filters as any)[key]);
      });

      const res = await fetch(`/api/buyers?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch buyers.");
      }

      const data = await res.json();
      setBuyers(data.buyers || []);
      setTotalPages(Math.ceil((data.total || 0) / 10));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyers();
  }, [debouncedSearch, filters, page, sortBy, sortDir]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  const handleSort = (column: keyof Buyer) => {
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
  };

  const renderSortArrow = (column: keyof Buyer) => {
    if (sortBy !== column) return null;
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this buyer?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/buyers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete buyer.");
      }
      fetchBuyers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading)
    return <p className="text-center mt-10 text-gray-700">Loading buyers...</p>;
  if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;

  return (
    <div className="min-h-screen bg-white text-black p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Buyer Leads</h1>
        <button
          onClick={() => router.push("/buyers/new")}
          className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition"
        >
          Add Buyer
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name, phone, or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 border border-gray-300 rounded-md outline-none flex-1 min-w-[200px]"
        />
        <select
          value={filters.city}
          onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          className="p-2 border border-gray-300 rounded-md outline-none"
        >
          <option value="">All Cities</option>
          <option value="Chandigarh">Chandigarh</option>
          <option value="Mohali">Mohali</option>
          <option value="Zirakpur">Zirakpur</option>
          <option value="Panchkula">Panchkula</option>
          <option value="Other">Other</option>
        </select>
        <select
          value={filters.propertyType}
          onChange={(e) =>
            setFilters({ ...filters, propertyType: e.target.value })
          }
          className="p-2 border border-gray-300 rounded-md outline-none"
        >
          <option value="">All Properties</option>
          <option value="Apartment">Apartment</option>
          <option value="Villa">Villa</option>
          <option value="Plot">Plot</option>
          <option value="Office">Office</option>
          <option value="Retail">Retail</option>
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="p-2 border border-gray-300 rounded-md outline-none"
        >
          <option value="">All Status</option>
          <option value="New">New</option>
          <option value="Qualified">Qualified</option>
          <option value="Contacted">Contacted</option>
          <option value="Visited">Visited</option>
          <option value="Negotiation">Negotiation</option>
          <option value="Converted">Converted</option>
          <option value="Dropped">Dropped</option>
        </select>
        <select
          value={filters.timeline}
          onChange={(e) => setFilters({ ...filters, timeline: e.target.value })}
          className="p-2 border border-gray-300 rounded-md outline-none"
        >
          <option value="">All Timelines</option>
          <option value="ZERO_TO_THREE">0-3m</option>
          <option value="THREE_TO_SIX">3-6m</option>
          <option value="MORE_THAN_SIX">&gt;6m</option>
          <option value="EXPLORING">Exploring</option>
        </select>
      </div>

      {buyers.length === 0 ? (
        <p className="text-gray-700 mt-10 text-center">No buyers found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 shadow-sm rounded-lg">
            <thead className="bg-black text-white">
              <tr>
                <th
                  className="p-3 border cursor-pointer"
                  onClick={() => handleSort("fullName")}
                >
                  Name{renderSortArrow("fullName")}
                </th>
                <th
                  className="p-3 border cursor-pointer"
                  onClick={() => handleSort("phone")}
                >
                  Phone{renderSortArrow("phone")}
                </th>
                <th className="p-3 border">Email</th>
                <th className="p-3 border">City</th>
                <th className="p-3 border">Property</th>
                <th className="p-3 border">Budget</th>
                <th
                  className="p-3 border cursor-pointer"
                  onClick={() => handleSort("timeline")}
                >
                  Timeline{renderSortArrow("timeline")}
                </th>
                <th
                  className="p-3 border cursor-pointer"
                  onClick={() => handleSort("status")}
                >
                  Status{renderSortArrow("status")}
                </th>
                <th
                  className="p-3 border cursor-pointer"
                  onClick={() => handleSort("updatedAt")}
                >
                  Updated{renderSortArrow("updatedAt")}
                </th>
                <th className="p-3 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {buyers.map((b) => (
                <tr key={b.id} className="hover:bg-gray-100 transition">
                  <td className="p-3 border">{b.fullName}</td>
                  <td className="p-3 border">{b.phone}</td>
                  <td className="p-3 border">{b.email || "-"}</td>
                  <td className="p-3 border">{b.city}</td>
                  <td className="p-3 border">{b.propertyType}</td>
                  <td className="p-3 border">
                    {b.budgetMin || "-"} - {b.budgetMax || "-"}
                  </td>
                  <td className="p-3 border">{timelineDisplay[b.timeline]}</td>
                  <td className="p-3 border">{statusDisplay[b.status]}</td>
                  <td className="p-3 border">
                    {new Date(b.updatedAt).toLocaleString()}
                  </td>
                  <td className="p-3 border text-center space-x-2">
                    {currentUserId === b.ownerId && (
                      <>
                        <Link
                          href={`/buyers/${b.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="text-red-600 hover:underline ml-2"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-4 mt-4">
            <button
              className="px-3 py-1 border rounded-md"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              className="px-3 py-1 border rounded-md"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
