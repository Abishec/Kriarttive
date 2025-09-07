/* app.js - REPLACE your existing file with this entire content.
   IMPORTANT: set API_URL to your deployed Apps Script Web App URL (full).
   Example:
     const API_URL = "https://script.google.com/macros/s/AKfycb.../exec";
*/

const API_URL = "https://script.google.com/macros/s/AKfycbwtlif-GyGHpExAgEsy6CD9f2jCGsREsnL8sSi1W0aXXnB-lAXht6Da-Yrm-9wt_7HO/exec"; // <-- REPLACE with your Web App URL
const SHEET_ID = "1rz-bf1ju-VbIm4g0Pc8TzZVGCTBE5J-VBtMs3q7VCA0"; // (unused here but kept for clarity)

function qs(id) { return document.getElementById(id); }
function escapeHtml(s) { return (s || "").toString().replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

async function parseMaybeJSONorJSONP(text) {
  try { return JSON.parse(text); } catch (e) {}
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(text.substring(start, end + 1)); } catch (e) {}
  }
  return null;
}

/* ---------- Load products via your Apps Script Web App ---------- */
async function loadProducts() {
  const productsList = qs("productsList");
  const spinner = qs("loadingSpinner");
  productsList.innerHTML = "";
  spinner.style.display = "block";

  if (!API_URL || API_URL.includes("PASTE_YOUR_WEBAPP_URL_HERE")) {
    productsList.innerHTML = `<div class="error">API_URL not set in app.js. Paste your Web App URL into API_URL.</div>`;
    spinner.style.display = "none";
    return;
  }

  try {
    const url = `${API_URL}?sheet=Products`;
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    const parsed = await parseMaybeJSONorJSONP(text);

    if (!parsed) {
      productsList.innerHTML = `<div class="error">Failed to parse product data. Response: ${escapeHtml(text.slice(0,400))}</div>`;
      return;
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      productsList.innerHTML = `<div class="empty">No products found.</div>`;
      return;
    }

    // Render cards
    parsed.forEach(prod => {
      const name = escapeHtml(prod.Name || prod.name || prod.Product || prod.product || "");
      const price = escapeHtml(prod.Price || prod.price || "");
      const desc = escapeHtml(prod.Description || prod.description || "");
      const img = escapeHtml(prod.Image || prod.image || prod.ImageURL || "");

      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        <div class="card-media">
          <img loading="lazy" src="${img}" alt="${name}" onerror="this.style.opacity=0.45;this.alt='image missing';">
        </div>
        <div class="card-body">
          <h4 class="card-title">${name}</h4>
          <p class="card-desc">${desc}</p>
          <div class="card-footer">
            <div class="price">${price ? "₹ " + price : ""}</div>
            <button class="btn request-btn" data-product="${escapeHtml(name)}">Request</button>
          </div>
        </div>
      `;
      productsList.appendChild(card);
    });

    // Attach request button listeners (delegation)
    productsList.addEventListener("click", (ev) => {
      const btn = ev.target.closest(".request-btn");
      if (!btn) return;
      const productName = btn.getAttribute("data-product") || "";
      openRequestModal(productName);
    });

  } catch (err) {
    console.error("loadProducts error:", err);
    productsList.innerHTML = `<div class="error">Failed to load products. Check API_URL and Apps Script deployment.</div>`;
  } finally {
    spinner.style.display = "none";
  }
}

/* ---------- Modal & submit logic ---------- */
function openRequestModal(productName) {
  qs("modalTitle").textContent = `Request: ${productName}`;
  qs("requestProductName").value = productName;
  qs("requestModal").classList.remove("hidden");
  qs("requestModalBackdrop").classList.remove("hidden");
}

function closeRequestModal() {
  qs("requestForm").reset();
  qs("requestModal").classList.add("hidden");
  qs("requestModalBackdrop").classList.add("hidden");
}

async function submitRequestViaGet(formData) {
  if (!API_URL || API_URL.includes("PASTE_YOUR_WEBAPP_URL_HERE")) {
    throw new Error("API_URL is not set in app.js. Paste your Apps Script Web App URL into API_URL.");
  }
  const params = new URLSearchParams({
    sheet: "Requests",
    method: "save",
    productName: formData.productName || "",
    customerName: formData.customerName || "",
    phone: formData.phone || "",
    address: formData.address || "",
    message: formData.message || ""
  }).toString();

  const url = `${API_URL}?${params}`;
  const res = await fetch(url, { method: "GET", cache: "no-store" });
  const text = await res.text();
  const parsed = await parseMaybeJSONorJSONP(text);
  return parsed;
}

/* ---------- Wire DOM ---------- */
document.addEventListener("DOMContentLoaded", () => {
  if (!qs("productsList")) {
    console.warn("productsList element missing in DOM");
    return;
  }

  // modal close
  document.querySelectorAll("[data-close-modal]").forEach(b => b.addEventListener("click", closeRequestModal));
  qs("requestModalBackdrop").addEventListener("click", closeRequestModal);

  qs("requestForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const btn = qs("submitRequestBtn");
    btn.disabled = true;
    btn.textContent = "Submitting...";

    const payload = {
      productName: qs("requestProductName").value.trim(),
      customerName: qs("customerName").value.trim(),
      phone: qs("customerPhone").value.trim(),
      address: qs("customerAddress").value.trim(),
      message: qs("customerMessage").value.trim()
    };

    try {
      const result = await submitRequestViaGet(payload);
      const ok = result && (result.status === "success" || result.status === "ok");
      if (ok) {
        alert("✅ Request submitted. We'll contact you soon.");
        closeRequestModal();
      } else {
        console.warn("submit result unexpected:", result);
        throw new Error(result && result.message ? result.message : "Server returned error");
      }
    } catch (err) {
      console.error("submit error:", err);
      alert("⚠️ Failed to submit request. Please try again.");
    } finally {
      btn.disabled = false;
      btn.textContent = "Submit Request";
    }
  });

  // load products immediately
  loadProducts();
});
