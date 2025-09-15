export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-3xl font-bold">Buyer Leads App</h1>
      <a href="/register" className="text-blue-500 underline">Register</a>
      <a href="/login" className="text-green-500 underline">Login</a>
    </div>
  );
}
