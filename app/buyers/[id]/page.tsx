"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type BuyerForm = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  propertyType: string;
  bhk: string;
  timeline: string;
  purpose: string;
  budgetMin: number;
  budgetMax: number;
};

export default function BuyerDetailsPage() {
    const { id } = useParams();
    const [buyer, setBuyer] = useState<any>(null);
    const [form, setForm] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchBuyer() {
        setError(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
            setError("You must be logged in to view details.");
            return;
            }

            const res = await fetch(`/api/buyers/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            });

            if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Failed to fetch buyer details.");
            }

            const data = await res.json();
            setBuyer(data);
            setForm(data);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
        }
        fetchBuyer();
    }, [id]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value } = e.target;
        
        if (e.target instanceof HTMLInputElement) {
        if (name === "budgetMin" || name === "budgetMax") {
            const numberValue = value === "" ? 0 : parseFloat(value);
            setForm({ ...form, [name]: numberValue });
        } else {
            setForm({ ...form, [name]: value });
        }
        } else {
        setForm({ ...form, [name]: value });
        }
    }

    async function handleSave() {
        try {
            setError(null);
            const token = localStorage.getItem("token");
            if (!token) throw new Error("You must be logged in to save.");

            const res = await fetch(`/api/buyers/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(form),
            });

            if (!res.ok) {
            const errorData = await res.json();
            if (Array.isArray(errorData) && errorData.length > 0) {
                const formattedErrors = errorData.map((err: any) => {
                const field = err.path && err.path.length > 0 ? err.path[0] : "An unknown field";
                return `${field}: ${err.message}`;
                }).join("; ");
                throw new Error(formattedErrors);
            } else {
                throw new Error(errorData.error || "Update failed.");
            }
            }
            
            const updated = await res.json();
            setBuyer(updated);
            setEditing(false);
            
            // Success message for the user
            alert("Buyer details updated successfully!"); 
            
        } catch (error: any) {
            setError(error.message);
        }
        }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this buyer?")) return;
    try {
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("You must be logged in to delete.");

      const res = await fetch(`/api/buyers/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Delete failed.");
      }

      alert("Buyer deleted successfully");
      window.location.href = "/buyers";
    } catch (error: any) {
      setError(error.message);
    }
  }

  if (loading) return <p className="text-center mt-10 text-xl font-semibold">Loading...</p>;
  if (!buyer) return <p className="text-center mt-10 text-gray-500">Buyer not found</p>;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
          Buyer Details
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-6">
            <span className="block sm:inline">{error}</span>
            <span
              className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer"
              onClick={() => setError(null)}
            >
              <svg
                className="fill-current h-6 w-6 text-red-500"
                role="button"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <title>Close</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
              </svg>
            </span>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="fullName"
              value={form.fullName || ""}
              onChange={handleChange}
              disabled={!editing}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition-colors text-black"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={form.email || ""}
              onChange={handleChange}
              disabled={!editing}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition-colors text-black"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              name="phone"
              value={form.phone || ""}
              onChange={handleChange}
              disabled={!editing}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition-colors text-black"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700">Purpose</label>
            <select
              name="purpose"
              value={form.purpose || ""}
              onChange={handleChange}
              disabled={!editing}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition-colors bg-white text-black"
            >
              <option value="">Select purpose</option>
              <option value="Buy">Buy</option>
              <option value="Rent">Rent</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-700">Property Type</label>
            <select
              name="propertyType"
              value={form.propertyType || ""}
              onChange={handleChange}
              disabled={!editing}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition-colors bg-white text-black"
            >
              <option value="">Select type</option>
              <option value="Apartment">Apartment</option>
              <option value="House">House</option>
              <option value="Villa">Villa</option>
              <option value="Plot">Plot</option>
              <option value="Commercial">Commercial</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-700">BHK</label>
            <input
              type="text"
              name="bhk"
              value={form.bhk || ""}
              onChange={handleChange}
              disabled={!editing}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition-colors text-black"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700">Timeline</label>
            <select
                name="timeline"
                value={form.timeline || ""}
                onChange={handleChange}
                disabled={!editing}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition-colors bg-white text-black"
            >
                <option value="">Select timeline</option>
                <option value="_0_3m">0-3m</option>
                <option value="_3_6m">3-6m</option>
                <option value="_6m_plus">&gt;6m</option>
                <option value="Exploring">Exploring</option>
            </select>
            </div>

          <div>
            <label className="block font-medium text-gray-700">Budget</label>
            <div className="flex space-x-2">
              <input
                type="number"
                name="budgetMin"
                placeholder="Min"
                value={form.budgetMin || ""}
                onChange={handleChange}
                disabled={!editing}
                className="w-1/2 p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition-colors text-black"
              />
              <input
                type="number"
                name="budgetMax"
                placeholder="Max"
                value={form.budgetMax || ""}
                onChange={handleChange}
                disabled={!editing}
                className="w-1/2 p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition-colors text-black"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-8 space-x-4">
          {!editing ? (
            <>
              <button
                onClick={() => setEditing(true)}
                className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setForm(buyer);
                  setEditing(false);
                }}
                className="flex-1 px-4 py-3 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}