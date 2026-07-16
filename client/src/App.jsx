import { useState, useEffect } from "react";

function App() {
  const [serverMessage, setServerMessage] = useState("Connecting...");

  useEffect(() => {
    // Try to talk to our Express server
    fetch("http://localhost:5000/api/message")
      .then((res) => res.json())
      .then((data) => setServerMessage(data.message))
      .catch((err) => setServerMessage("Backend is offline or not responding"));
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold text-teal-400 mb-6">StayHub</h1>

      <div className="bg-slate-800 p-8 rounded-lg shadow-xl border border-slate-700 max-w-md w-full text-center">
        <h2 className="text-xl font-semibold mb-4 text-slate-300">
          Environment Status
        </h2>

        <div className="p-4 bg-slate-900 rounded border border-slate-700">
          <p className="text-lg">{serverMessage}</p>
        </div>

        <p className="mt-6 text-sm text-slate-500">
          Frontend: React + Tailwind | Backend: Node + Express + Postgres
        </p>
      </div>
    </div>
  );
}

export default App;
