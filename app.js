import { useEffect, useState } from "react";

export default function App() {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [username, setUsername] = useState("Connecting...");

  useEffect(() => {
    // ✅ Initialize Pi SDK in sandbox mode
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
        setUsername("Authentication failed");
      });

    // 🕒 Clock update interval
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  // Handle donation
  const handleDonate = () => {
    Pi.createPayment(
      {
        amount: 3.14,
        memo: "Support Salaam Clock",
        metadata: { donation: true },
      },
      {
        onReadyForServerApproval: (paymentId) => {
          console.log("Payment ready for server approval:", paymentId);
        },
        onReadyForServerCompletion: (paymentId, txid) => {
          console.log("Payment completed:", paymentId, txid);
        },
        onCancel: (paymentId) => {
          console.log("Payment cancelled:", paymentId);
        },
        onError: (error, payment) => {
          console.error("Payment error:", error);
        },
      }
    );
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <h1 className="text-3xl font-bold mb-2">Salaam Clock</h1>
      <p className="text-lg mb-6">Hello, {username}</p>

      {/* 🕒 Show live time */}
      <div className="text-5xl font-mono mb-8">{time}</div>

      <button
        onClick={handleDonate}
        className="px-6 py-3 bg-yellow-400 text-black rounded-xl font-semibold hover:bg-yellow-300 transition-all"
      >
        Donate 3.14 π
      </button>
    </main>
  );
}
import "@/styles/globals.css"; 
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <SpeedInsights />
    </>
  );
}
// Initialize Pi SDK in sandbox mode
Pi.init({ sandbox: true });

// Authentication logic
async function authenticate() {
  const scopes = ['username', 'payments'];

  try {
    const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);
    console.log('Authenticated user:', auth.user);
    document.getElementById('status').innerText = `Welcome, ${auth.user.username}!`;
  } catch (err) {
    console.error('Authentication error:', err);
    document.getElementById('status').innerText = 'Authentication failed.';
  }
}

// Handle incomplete payments (optional)
function onIncompletePaymentFound(payment) {
  console.log('Incomplete payment:', payment);
}

// Run authentication
authenticate();
/*{
  "name": "salaam-clock",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "latest",
    "react": "latest",
    "react-dom": "latest"
  }
}
  Salaam Clock - simple prayer time app for Pi Browser.
  - Default cities: Makkah, Medina (country: Saudi Arabia)
  - Uses Aladhan API for timings.
  - Pi SDK included for login/donation (developer must configure app in Pi Developer Portal).
*/

Pi && Pi.init && Pi.init({ version: "2.0" });

// Helper: fetch prayer times from Aladhan API by city (country fixed to Saudi Arabia)
async function fetchPrayerTimes(city) {
  const cityParam = encodeURIComponent(city);
  const country = "Saudi Arabia";
  const url = `https://api.aladhan.com/v1/timingsByCity?city=${cityParam}&country=${encodeURIComponent(country)}&method=2`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.code !== 200 || !json.data) throw new Error("Failed to fetch timings");
  return json.data;
}

function formatTime(t) {
  // returns HH:MM (24-hour)
  return t;
}

// UI
const citySelect = document.getElementById('citySelect');
const refreshBtn = document.getElementById('refreshBtn');
const prayersEl = document.getElementById('prayers');
const dateLocal = document.getElementById('dateLocal');
const hijriDate = document.getElementById('hijriDate');
const countdown = document.getElementById('countdown');
const donateBtn = document.getElementById('donateBtn');
const loginBtn = document.getElementById('loginBtn');

let currentTimings = null;
let nextPrayerTimer = null;

async function load(city){
  try {
    prayersEl.innerHTML = '<div class="card">Loading prayer times…</div>';
    const data = await fetchPrayerTimes(city);
    currentTimings = data.timings;
    const dateInfo = data.date;
    renderTimings(currentTimings);
    dateLocal.textContent = `Gregorian: ${dateInfo.gregorian.date}`;
    hijriDate.textContent = `Hijri: ${dateInfo.hijri.date} (${dateInfo.hijri.month.en} ${dateInfo.hijri.year})`;
    startNextPrayerCountdown(currentTimings);
  } catch (err) {
    prayersEl.innerHTML = '<div class="card">Error loading timings. Check your connection.</div>';
    console.error(err);
  }
}

function renderTimings(timings) {
  const order = ['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha'];
  prayersEl.innerHTML = '';
  order.forEach(name=>{
    if (!timings[name]) return;
    const div = document.createElement('div');
    div.className = 'prayer card';
    div.innerHTML = `<strong>${name}</strong><div class="time">${formatTime(timings[name])}</div>`;
    prayersEl.appendChild(div);
  });
}

function startNextPrayerCountdown(timings){
  if (nextPrayerTimer) clearInterval(nextPrayerTimer);
  function getNext(){
    const now = new Date();
    let nextName = null;
    let nextTime = null;
    // build today's prayer Date objects in local timezone
    for (const [name, timeStr] of Object.entries(timings)) {
      // timeStr format: "05:12 (EET)" or "05:12"
      const hhmm = timeStr.split(' ')[0];
      const [hh,mm] = hhmm.split(':').map(n=>parseInt(n,10));
      const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0);
      if (candidate > now) {
        nextName = name; nextTime = candidate; break;
      }
    }
    // if none left, take Fajr of next day
    if (!nextTime && timings.Fajr) {
      const [hh,mm] = timings.Fajr.split(':').map(n=>parseInt(n,10));
      nextTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1, hh, mm, 0);
      nextName = 'Fajr';
    }
    return { nextName, nextTime };
  }
  nextPrayerTimer = setInterval(()=>{
    const {nextName, nextTime} = getNext();
    if (!nextTime) { countdown.textContent = ''; return; }
    const diff = Math.max(0, nextTime - new Date());
    const hrs = Math.floor(diff / (1000*60*60));
    const mins = Math.floor((diff % (1000*60*60)) / (1000*60));
    const secs = Math.floor((diff % (1000*60)) / 1000);
    countdown.textContent = `Next: ${nextName} in ${hrs}h ${mins}m ${secs}s`;
  }, 500);
}

// Pi Login
loginBtn.addEventListener('click', () => {
  if (!window.Pi || !Pi.authenticate) {
    alert("Pi SDK not available. Open this app inside Pi Browser with Pi SDK enabled.");
    return;
  }
  Pi.authenticate(['username'], (auth) => {
    alert("Logged in as: " + (auth && auth.username ? auth.username : "unknown"));
  }, (err) => {
    console.error(err);
    alert("Login failed or cancelled.");
  });
});

// Pi Donation (placeholder: developer must set merchant info in Pi Developer Portal)
donateBtn.addEventListener('click', async () => {
  if (!window.Pi || !Pi.requestPayment) {
    alert("Pi payment not available in this environment. Ensure you run this inside Pi Browser and configure payments in the Pi Developer Portal.");
    return;
  }
  try {
    // Example payment payload - adapt in production
    const payload = {
      amount: "1", // 1 Pi (adjust as desired)
      currency: "PI",
      comment: "Donation to Salaam Clock",
      // merchant public key or other required fields should be configured in Developer Portal
    };
    const res = await Pi.requestPayment(payload);
    console.log('Payment result', res);
    alert('Donation request sent. Check Pi Browser to complete.');
  } catch (err) {
    console.error(err);
    alert('Donation failed or cancelled.');
  }
});

// Refresh/load handlers
refreshBtn.addEventListener('click', ()=> load(citySelect.value));
citySelect.addEventListener('change', ()=> load(citySelect.value));

// initial load default to Makkah
load(citySelect.value);
