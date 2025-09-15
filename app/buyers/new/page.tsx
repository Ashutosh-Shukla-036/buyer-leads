"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function useForm<T extends Record<string, any>>(initialState: T) {
    const [form, setForm] = useState<T>(initialState);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prevForm) => ({ ...prevForm, [name]: value }));
    };

    const resetForm = () => setForm(initialState);
    return { form, handleChange, resetForm, setForm };
}

type FormState = {
    fullName: string;
    phone: string;
    email: string;
    city: string;
    propertyType: string;
    bhk: string;
    purpose: string;
    budgetMin: string;
    budgetMax: string;
    timeline: string;
    source: string;
    notes: string;
    tags: string;
};

export default function AddBuyerPage() {
    const router = useRouter();
    const { form, handleChange, resetForm } = useForm<FormState>({
        fullName: "",
        phone: "",
        email: "",
        city: "Chandigarh",
        propertyType: "Apartment",
        bhk: "One",
        purpose: "Buy",
        budgetMin: "",
        budgetMax: "",
        timeline: "0-3m",
        source: "Website",
        notes: "",
        tags: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const budgetMinNum = form.budgetMin ? Number(form.budgetMin) : undefined;
        const budgetMaxNum = form.budgetMax ? Number(form.budgetMax) : undefined;

        if (
            budgetMinNum !== undefined &&
            budgetMaxNum !== undefined &&
            budgetMaxNum < budgetMinNum
        ) {
            setError("Budget Max must be greater than or equal to Budget Min");
            setLoading(false);
            return;
        }

    try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("You must be logged in.");

        const timelineMap: Record<string, string> = {
            "0-3m": "ZERO_TO_THREE",
            "3-6m": "THREE_TO_SIX",
            ">6m": "MORE_THAN_SIX",
            "Exploring": "EXPLORING",
        };

        const bhkMap: Record<string, string> = {
            Studio: "Studio",
            One: "One",
            Two: "Two",
            Three: "Three",
            Four: "Four",
        };

        const purposeMap: Record<string, string> = {
            Buy: "Buy",
            Rent: "Rent",
        };

        const sourceMap: Record<string, string> = {
            Website: "Website",
            Referral: "Referral",
            Walk_in: "Walk_in",
            Call: "Call",
            Other: "Other",
        };

      const body = {
        fullName: form.fullName,
        phone: form.phone,
        email: form.email || undefined,
        city: form.city,
        propertyType: form.propertyType,
        bhk:
          form.propertyType === "Apartment" || form.propertyType === "Villa"
            ? bhkMap[form.bhk]
            : undefined,
        purpose: purposeMap[form.purpose],
        budgetMin: budgetMinNum,
        budgetMax: budgetMaxNum,
        timeline: timelineMap[form.timeline],
        source: sourceMap[form.source],
        notes: form.notes || undefined,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
      };

      const res = await fetch("/api/buyers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create buyer.");
      }

      resetForm();
      router.push("/buyers");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black p-4">
      <div className="w-full max-w-md p-8 border border-black rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Add Buyer</h1>
        {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            name="fullName"
            placeholder="Full Name"
            value={form.fullName}
            onChange={handleChange}
            className="p-3 border border-gray-300 focus:border-black rounded-md outline-none"
            required
          />
          <input
            name="phone"
            type="tel"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
            className="p-3 border border-gray-300 focus:border-black rounded-md outline-none"
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="p-3 border border-gray-300 focus:border-black rounded-md outline-none"
          />
          <select
            name="city"
            value={form.city}
            onChange={handleChange}
            className="p-3 border border-gray-300 focus:border-black rounded-md outline-none"
            required
          >
            <option value="Chandigarh">Chandigarh</option>
            <option value="Mohali">Mohali</option>
            <option value="Zirakpur">Zirakpur</option>
            <option value="Panchkula">Panchkula</option>
            <option value="Other">Other</option>
          </select>
          <select
            name="propertyType"
            value={form.propertyType}
            onChange={handleChange}
            className="p-3 border border-gray-300 focus:border-black rounded-md outline-none"
            required
          >
            <option value="Apartment">Apartment</option>
            <option value="Villa">Villa</option>
            <option value="Plot">Plot</option>
            <option value="Office">Office</option>
            <option value="Retail">Retail</option>
          </select>

          {(form.propertyType === "Apartment" || form.propertyType === "Villa") && (
            <select
              name="bhk"
              value={form.bhk}
              onChange={handleChange}
              className="p-3 border border-gray-300 focus:border-black rounded-md outline-none"
              required
            >
              <option value="Studio">Studio</option>
              <option value="One">1 BHK</option>
              <option value="Two">2 BHK</option>
              <option value="Three">3 BHK</option>
              <option value="Four">4 BHK</option>
            </select>
          )}

          <select
            name="purpose"
            value={form.purpose}
            onChange={handleChange}
            className="p-3 border border-gray-300 focus:border-black rounded-md outline-none"
            required
          >
            <option value="Buy">Buy</option>
            <option value="Rent">Rent</option>
          </select>

          <input
            name="budgetMin"
            type="number"
            placeholder="Budget Min"
            value={form.budgetMin}
            onChange={handleChange}
            className="p-3 border border-gray-300 focus:border-black rounded-md outline-none"
          />
          <input
            name="budgetMax"
            type="number"
            placeholder="Budget Max"
            value={form.budgetMax}
            onChange={handleChange}
            className="p-3 border border-gray-300 focus:border-black rounded-md outline-none"
          />

          <select
            name="timeline"
            value={form.timeline}
            onChange={handleChange}
            className="p-3 border border-gray-300 focus:border-black rounded-md outline-none"
            required
          >
            <option value="0-3m">0-3 months</option>
            <option value="3-6m">3-6 months</option>
            <option value=">6m">&gt;6 months</option>
            <option value="Exploring">Exploring</option>
          </select>

          <select
            name="source"
            value={form.source}
            onChange={handleChange}
            className="p-3 border border-gray-300 focus:border-black rounded-md outline-none"
            required
          >
            <option value="Website">Website</option>
            <option value="Referral">Referral</option>
            <option value="Walk_in">Walk-in</option>
            <option value="Call">Call</option>
            <option value="Other">Other</option>
          </select>

          <input
            name="notes"
            placeholder="Notes"
            value={form.notes}
            onChange={handleChange}
            className="p-3 border border-gray-300 focus:border-black rounded-md outline-none"
          />

          <input
            name="tags"
            placeholder="Tags (comma separated)"
            value={form.tags}
            onChange={handleChange}
            className="p-3 border border-gray-300 focus:border-black rounded-md outline-none"
          />

          <button
            type="submit"
            className="bg-black text-white p-3 mt-4 rounded-md font-semibold hover:bg-gray-800 transition-colors duration-200 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Buyer"}
          </button>
        </form>
      </div>
    </div>
  );
}
