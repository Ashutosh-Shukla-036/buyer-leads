"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false); // New state for loading
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true); // Start loading

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.userId);
        alert("Registered successfully!");
        router.push("/buyers");
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert("An unexpected error occurred.");
    } finally {
      setIsLoading(false); // End loading
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black">
      <div className="w-full max-w-md p-8 border rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Register</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-black p-3 rounded-md"
            required
            disabled={isLoading} // Disable input while loading
          />
          <input
            type="password"
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-black p-3 rounded-md"
            required
            disabled={isLoading} // Disable input while loading
          />
          <button
            type="submit"
            className="w-full bg-black text-white p-3 rounded-md hover:bg-white hover:text-black hover:border hover:border-black transition"
            disabled={isLoading} // Disable button while loading
          >
            {isLoading ? "Registering..." : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}