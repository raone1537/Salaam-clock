import { useEffect, useState } from "react";

export default function PrayerTimes() {
  const [makkah, setMakkah] = useState(null);
  const [madina, setMadina] = useState(null);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(new Date());

  // Fetch prayer times on mount
  useEffect(() => {
    const makkahURL =
      "https://api.aladhan.com/v1/timingsByCity?city=Makkah&country=Saudi%20Arabia";
    const madinaURL =
      "https://api.aladhan.com/v1/timingsByCity?city=Medina&country=Saudi%20Arabia";

    Promise.all([
      fetch(makkahURL).then((res) => res.json()),
      fetch(madinaURL).then((res) => res.json()),
    ])
      .then(([makkahRes, madinaRes]) => {
        if (makkahRes.code === 200) setMakkah(makkahRes.data.timings);
        if (madinaRes.code === 200) setMadina(madinaRes.data.timings);
      })
      .catch((err) => setError(err.message));
  }, []);

  // Update current time every second for live countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return <p style={{ color: "red" }}>⚠️ Error: {error}</p>;
  }

  if (!makkah || !madina) {
    return <p>Loading prayer times...</p>;
  }

  // Helper: Get next prayer time for a city
  const getNextPrayer = (times) => {
    const today = new Date();
    const prayerNames = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
    for (let name of prayerNames) {
      const [hours, minutes] = times[name].split(":").map(Number);
      const prayerTime = new Date();
      prayerTime.setHours(hours, minutes, 0, 0);

      if (prayerTime > today) {
        return { name, time: prayerTime };
      }
    }
    // If all have passed, next prayer is tomorrow's Fajr
    const [fajrHours, fajrMinutes] = times["Fajr"].split(":").map(Number);
    const fajrTomorrow = new Date();
    fajrTomorrow.setDate(fajrTomorrow.getDate() + 1);
    fajrTomorrow.setHours(fajrHours, fajrMinutes, 0, 0);
    return { name: "Fajr (Tomorrow)", time: fajrTomorrow };
  };

  // Helper: Format countdown in HH:MM:SS
    const formatCountdown = (target) => {
    const diff = target - now;
    if (diff <= 0) return "00:00:00";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const renderTimes = (times) =>
    Object.entries(times).map(([name, time]) => (
      <div key={name} className="flex justify-between py-1 text-sm">
        <span>{name}</span>
        <span>{time}</span>
      </div>
    ));

  // Get next prayer info
  const nextMakkah = getNextPrayer(makkah);
  const nextMadina = getNextPrayer(madina);

  return (
    <div className="p-4 max-w-md mx-auto space-y-6 font-sans">
      {/* Makkah Card */}
      <div className="bg-white shadow rounded-2xl p-4">
        <h2 className="text-xl font-semibold text-center mb-2">🕋 Makkah Prayer Times</h2>
        {renderTimes(makkah)}
        <div className="mt-3 text-center bg-gray-100 rounded-xl p-2">
          <p className="text-sm">Next Prayer: <strong>{nextMakkah.name}</strong></p>
          <p className="text-lg font-bold text-green-600">{formatCountdown(nextMakkah.time)}</p>
        </div>
      </div>

      {/* Madina Card */}
      <div className="bg-white shadow rounded-2xl p-4">
        <h2 className="text-xl font-semibold text-center mb-2">🌿 Madina Prayer Times</h2>
        {renderTimes(madina)}
        <div className="mt-3 text-center bg-gray-100 rounded-xl p-2">
          <p className="text-sm">Next Prayer: <strong>{nextMadina.name}</strong></p>
          <p className="text-lg font-bold text-green-600">{formatCountdown(nextMadina.time)}</p>
        </div>
      </div>
    </div>
  );
}
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
