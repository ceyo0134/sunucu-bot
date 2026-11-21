// Minecraft AFK/presence bot. Joins the server, stays SESSION_HOURS, leaves,
// waits 10-20 seconds, joins again. Reconnects automatically if kicked or the server restarts.
const mineflayer = require("mineflayer");

const HOST = process.env.MC_HOST || "lunahack.aternos.me";
const PORT = process.env.MC_PORT ? parseInt(process.env.MC_PORT, 10) : undefined;
const USERNAME = process.env.MC_USERNAME || "ceyobot";
const VERSION = process.env.MC_VERSION || "1.21.4"; // e.g. "1.20.4", auto-detected if empty
const AUTH = process.env.MC_AUTH || "offline";
const SESSION_MS = parseFloat(process.env.SESSION_HOURS || "5") * 3600 * 1000;
const PASSWORD = process.env.MC_PASSWORD;
if (!PASSWORD) { console.error("MC_PASSWORD is not set"); process.exit(1); }
const ONCE = process.env.ONCE === "1"; // true = run one session then exit (GitHub Actions)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString(), ...a);

function connect(msLeft) {
  return new Promise((resolve) => {
    let finished = false;
    let joinTimer;
    const timers = [];
    const bot = mineflayer.createBot({
      host: HOST, port: PORT, username: USERNAME, version: VERSION, auth: AUTH, hideErrors: true,
    });

    // AuthMe-style login: answers the server prompts with /register or /login
    let authTries = 0, lastAuth = 0, authed = false;
    const doAuth = (kind) => {
      if (authed || authTries >= 6 || Date.now() - lastAuth < 2500) return;
      authTries++; lastAuth = Date.now();
      const cmd = kind === "register" ? `/register ${PASSWORD} ${PASSWORD}` : `/login ${PASSWORD}`;
      log("Sending", kind);
      try { bot.chat(cmd); } catch (_) {}
    };
    bot.on("messagestr", (msg) => {
      log("Chat:", msg.slice(0, 200));
      const m = msg.toLowerCase();
      if (/success|giris yapildi|giriş yapıldı|basariyla|başarıyla|welcome back/.test(m) && authTries > 0) { authed = true; return; }
      if (/\/register|\/kayit|\/kayıt/.test(m) && !/already|zaten/.test(m)) doAuth("register");
      else if (/\/login|\/giris|\/giriş/.test(m)) doAuth("login");
    });
    const end = (why) => {
      if (finished) return;
      finished = true;
      timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
      try { bot.end(); } catch (_) {}
      resolve(why);
    };
    bot.once("spawn", () => {
      clearTimeout(joinTimer); // joined fine, cancel the join timeout
      log("Joined", HOST, "as", USERNAME);
      // fallback if the server sends no prompt: try login first (register is answered by the prompt handler)
      timers.push(setTimeout(() => { if (authTries === 0) doAuth("login"); }, 5000));
      timers.push(setTimeout(() => end("session-over"), msLeft));
      timers.push(setInterval(() => {
        try {
          bot.look(Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.6, true);
          bot.setControlState("jump", true);
          setTimeout(() => bot.setControlState("jump", false), 300);
        } catch (_) {}
      }, 25000));
    });
    bot.on("kicked", (r) => { log("Kicked:", typeof r === "string" ? r : JSON.stringify(r)); end("kicked"); });
    bot.on("error", (e) => { log("Error:", e.message); end("error"); });
    bot.on("end", () => end("ended"));
    joinTimer = setTimeout(() => end("join-timeout"), 90000); // never got in
    timers.push(joinTimer);
  });
}

async function runSession() {
  const start = Date.now();
  while (Date.now() - start < SESSION_MS) {
    const why = await connect(SESSION_MS - (Date.now() - start));
    if (why === "session-over") break;
    log("Disconnected (" + why + "), retrying in 30s");
    await sleep(30000);
  }
  log("Session finished");
}

(async () => {
  do {
    await runSession();
    if (ONCE) break;
    const wait = 10000 + Math.random() * 10000;
    log("Rejoining in", Math.round(wait / 1000), "seconds");
    await sleep(wait);
  } while (true);
})();
