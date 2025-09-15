"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false); // New state for loading

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true); 

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.userId);
        alert("Logged in successfully!");
        router.push("/buyers");
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert("An unexpected error occurred.");
    } finally {
      setIsLoading(false); 
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black">
      <div className="w-full max-w-md p-8 border rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
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
            placeholder="Password"
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
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}