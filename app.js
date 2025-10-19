import React, { useState, useEffect } from "react";

export default function App() {
  const [now, setNow] = useState(new Date());
  const [username, setUsername] = useState("Connecting...");

  useEffect(() => {
    // 🕒 Live clock that updates every second
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // ✅ Initialize Pi SDK (sandbox mode)
    if (window.Pi) {
      Pi.init({ sandbox: true });

      const scopes = ["payments"];
      function onIncompletePaymentFound(payment) {
        console.log("Found incomplete payment:", payment);
      }

      // Authenticate user
      Pi.authenticate(scopes, onIncompletePaymentFound)
        .then((auth) => {
          console.log(`Hi ${auth.user.username}!`);
          setUsername(auth.user.username);
        })
        .catch((error) => {
          console.error("Auth error:", error);
          setUsername("Auth failed");
        });
    } else {
      console.warn("Pi SDK not found — make sure Pi Browser loads the SDK");
    }
  }, []);

  // 💸 Handle Donation
  const handleDonate = () => {
    Pi.createPayment(
      {
        amount: 3.14,
        memo: "Support Salaam Clock",
        metadata: { donation: true },
      },
      {
        onReadyForServerApproval: (paymentId) =>
          console.log("Ready for server approval:", paymentId),
        onReadyForServerCompletion: (paymentId, txid) =>
          console.log("Payment completed:", paymentId, txid),
        onCancel: (paymentId) => console.log("Payment cancelled:", paymentId),
        onError: (error, payment) => console.error("Payment error:", error),
      }
    );
  };

  return (
    <main
      style={{
        fontFamily: "sans-serif",
        textAlign: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #111827, #1f2937)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>Salaam Clock</h1>
      <p style={{ marginBottom: "1.5rem" }}>
        {username === "Connecting..."
          ? "Authenticating..."
          : `Hello, ${username}!`}
      </p>

      <h2 style={{ fontSize: "3rem", fontFamily: "monospace" }}>
        {now.toLocaleTimeString()}
      </h2>

      <button
        onClick={handleDonate}
        style={{
          marginTop: "2rem",
          padding: "0.75rem 2rem",
          fontSize: "1rem",
          fontWeight: "bold",
          color: "#000",
          backgroundColor: "#facc15",
          border: "none",
          borderRadius: "0.75rem",
          cursor: "pointer",
        }}
      >
        Donate 3.14 π
      </button>
    </main>
  );
}
