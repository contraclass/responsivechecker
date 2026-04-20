const form = document.getElementById("checkForm");
const results = document.getElementById("results");
const cardTemplate = document.getElementById("cardTemplate");
const runBtn = document.getElementById("runBtn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const url = document.getElementById("url").value.trim();
  if (!url) return;

  const categories = [...document.querySelectorAll('input[name="category"]:checked')].map(el => el.value);
  const engines = [...document.querySelectorAll('input[name="engine"]:checked')].map(el => el.value);
  const fullPage = document.getElementById("fullPage").checked;

  if (categories.length === 0 || engines.length === 0) {
    alert("Pick at least one device category and one browser engine.");
    return;
  }

  results.innerHTML = "";
  runBtn.disabled = true;
  runBtn.textContent = "Running…";

  const jobs = [];
  for (const device of window.DEVICES) {
    if (!categories.includes(device.category)) continue;
    for (const engine of engines) {
      if (!device.engines.includes(engine)) continue;
      jobs.push({ device, engine });
    }
  }

  const cards = jobs.map(job => createCard(job));
  await Promise.allSettled(jobs.map((job, i) => runJob(url, job, cards[i], fullPage)));

  runBtn.disabled = false;
  runBtn.textContent = "Run check";
});

function createCard({ device, engine }) {
  const node = cardTemplate.content.cloneNode(true);
  const article = node.querySelector(".card");
  article.querySelector(".deviceName").textContent = `${device.name} — ${engineLabel(engine)}`;
  article.querySelector(".deviceSpec").textContent = `${device.width} × ${device.height}  @ ${device.dpr}x  ·  ${device.platform}`;
  results.appendChild(node);
  return article;
}

function engineLabel(engine) {
  if (engine === "chromium") return "Chromium";
  if (engine === "firefox") return "Firefox";
  if (engine === "webkit") return "WebKit";
  return engine;
}

async function runJob(url, { device, engine }, card, fullPage) {
  const img = card.querySelector("img");
  const loader = card.querySelector(".loader");
  const openFull = card.querySelector(".openFull");

  try {
    const params = new URLSearchParams({
      url,
      width: String(device.width),
      height: String(device.height),
      dpr: String(device.dpr),
      userAgent: device.userAgent,
      engine,
      fullPage: fullPage ? "1" : "0",
    });

    const res = await fetch(`/.netlify/functions/screenshot?${params.toString()}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${res.status}: ${text}`);
    }
    const data = await res.json();

    img.src = data.imageUrl;
    img.alt = `${device.name} on ${engine}`;
    img.classList.remove("hidden");
    loader.style.display = "none";
    openFull.href = data.imageUrl;
  } catch (err) {
    loader.textContent = `error — ${err.message}`;
    loader.classList.add("error");
  }
}
