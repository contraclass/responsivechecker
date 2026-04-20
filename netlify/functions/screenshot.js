// Screenshot proxy. Swap providers via SCREENSHOT_PROVIDER env var.
// Supported: "microlink" (free, Chromium-only), "screenshotone" (paid, all engines).

const crypto = require("crypto");

exports.handler = async (event) => {
  const { url, width, height, dpr, userAgent, engine, fullPage } = event.queryStringParameters || {};

  if (!url) return json(400, { error: "missing url" });
  try { new URL(url); } catch { return json(400, { error: "invalid url" }); }

  const provider = (process.env.SCREENSHOT_PROVIDER || "microlink").toLowerCase();

  try {
    let imageUrl;
    if (provider === "screenshotone") {
      imageUrl = await screenshotone({ url, width, height, dpr, userAgent, engine, fullPage });
    } else {
      imageUrl = await microlink({ url, width, height, dpr, userAgent, fullPage });
    }
    return json(200, { imageUrl, provider });
  } catch (err) {
    return json(500, { error: err.message || "screenshot failed" });
  }
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=600" },
    body: JSON.stringify(body),
  };
}

// Microlink free tier: no API key required, ~50/day per IP. Chromium only.
async function microlink({ url, width, height, dpr, userAgent, fullPage }) {
  const apiKey = process.env.MICROLINK_API_KEY;
  const params = new URLSearchParams({
    url,
    screenshot: "true",
    meta: "false",
    "viewport.width": width,
    "viewport.height": height,
    "viewport.deviceScaleFactor": dpr,
    "viewport.isMobile": String(Number(width) < 900),
    "viewport.hasTouch": String(Number(width) < 900),
    "screenshot.fullPage": fullPage === "1" ? "true" : "false",
    "screenshot.type": "png",
    "waitForTimeout": "1500",
  });
  if (userAgent) params.set("userAgent", userAgent);

  const headers = { "Accept": "application/json" };
  if (apiKey) headers["x-api-key"] = apiKey;

  const res = await fetch(`https://api.microlink.io/?${params.toString()}`, { headers });
  if (!res.ok) throw new Error(`microlink ${res.status}`);
  const json = await res.json();
  const imageUrl = json?.data?.screenshot?.url;
  if (!imageUrl) throw new Error("microlink: no image url");
  return imageUrl;
}

// ScreenshotOne: paid, supports chromium/firefox/webkit via `browser` param.
// Uses HMAC-SHA256 signed URLs — secret key stays server-side, never sent to browser.
async function screenshotone({ url, width, height, dpr, userAgent, engine, fullPage }) {
  const accessKey = process.env.SCREENSHOTONE_ACCESS_KEY;
  const secretKey = process.env.SCREENSHOTONE_SECRET_KEY;
  if (!accessKey) throw new Error("SCREENSHOTONE_ACCESS_KEY not set");
  if (!secretKey) throw new Error("SCREENSHOTONE_SECRET_KEY not set — required for signed URLs");

  const browserMap = { chromium: "chromium", firefox: "firefox", webkit: "webkit" };
  const params = new URLSearchParams({
    access_key: accessKey,
    url,
    viewport_width: width,
    viewport_height: height,
    device_scale_factor: dpr,
    browser: browserMap[engine] || "chromium",
    full_page: fullPage === "1" ? "true" : "false",
    format: "png",
    cache: "true",
    cache_ttl: "3600",
    block_ads: "true",
    block_cookie_banners: "true",
    delay: "2",
  });
  if (userAgent) params.set("user_agent", userAgent);

  const queryString = params.toString();
  const signature = crypto.createHmac("sha256", secretKey).update(queryString).digest("hex");
  return `https://api.screenshotone.com/take?${queryString}&signature=${signature}`;
}
