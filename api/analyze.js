export default async function handler(req, res) {

  let { site } = req.body;

  // ❌ INVALID
  if (!site || !site.includes(".")) {
    return res.status(400).json({
      result: "Enter a valid website"
    });
  }

  // 🔧 FIX URL
  if (!site.startsWith("http")) {
    site = "https://" + site;
  }

  // =============================
  // 🚫 RATE LIMIT (REAL SECURITY)
  // =============================
  const ip = req.headers["x-forwarded-for"] || "unknown";

  global.calls = global.calls || {};

  if (!global.calls[ip]) global.calls[ip] = 0;

  if (global.calls[ip] > 10) {
    return res.status(429).json({
      result: "Too many requests"
    });
  }

  global.calls[ip]++;

  // continue with fetch + GPT
}