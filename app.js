/* app.js - REPLACE your existing file with this entire content.
   1) IMPORTANT: set API_URL below to your deployed Apps Script Web App URL (full).
      Example: "https://script.google.com/macros/s/AKfycbxxx.../exec"
   2) Do NOT change other files. After replacing this file, push & reload your GitHub Pages site.
*/

// ---------- CONFIG ----------
const API_URL = "https://script.google.com/macros/s/AKfycbyU0CMyRNG2OGZGfn--qHbssA_6Oop61PmJJhP04P22wxr3R_TlPx5PqsQD_CXtV52p/exec"; // <- REPLACE this with your deployed Apps Script URL
const SHEET_ID = "1rz-bf1ju-VbIm4g0Pc8TzZVGCTBE5J-VBtMs3q7VCA0"; // your sheet id (already yours)

// ---------- Utils ----------
function qs(id) { return document.getElementById(id); }
function safeText(v) { return v === null || v === undefined ? "" : String(v); }

async function parseMaybeJSONorJSONP(text) {
  // try plain JSON
  try { return JSON.parse(text); } catch (e) {}
  // try to extract {...} from JSONP like callback({...});
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(text.substring(start, end + 1)); } catch (e) {}
  }
  // fallback: return raw text
  return text;
}

// ---------- Product loading (via Sheets gviz) ----------
async function loadProducts() {
  const productsListEl = qs("productsList");
  const spinner = qs("loadingSpinner");
  productsListEl.innerHTML = "";
  spinner.style.display = "block";

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Products`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    const json = (function _strip(txt) {
      const i = txt.indexOf("{");
      const j = txt.lastIndexOf("}");
      if (i !== -1 && j !== -1) return JSON.parse(txt.substring(i, j + 1));
      return JSON.parse(txt);
    })(text);

    const cols = json.table.cols.map(c => (c.label || c.id || "").trim());
    const rows = json.table.rows || [];

    if (!rows.length) {
      productsListEl.innerHTML = '<div class="empty">No products found.</div>';
      return;
    }

    const products = rows.map(r => {
      const obj = {};
      (r.c || []).forEach((cell, i) => { obj[cols[i] || ("col" + i)] = cell ? cell.v : ""; });
      return obj;
    });

    // render cards
    products.forEach(prod => {
      const name = safeText(prod.Name || prod.name || prod.Product || prod.product || prod.Title || prod.title || "");
      const price = safeText(prod.Price || prod.price || prod.Price_NPR || "");
      const desc = safeText(prod.Description || prod.description || prod.Desc || "");
      const img = safeText(prod.Image || prod.image || prod.img || prod.ImageURL || "");
      const model = name;

      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        <div class="card-media">
          <img loading="lazy" onerror="this.style.opacity=0.4;this.alt='image missing';" src="${img}" alt="${name}">
        </div>
        <div class="card-body">
          <h4 class="card-title">${name}</h4>
          <p class="card-desc">${desc}</p>
          <div class="card-footer">
            <div class="price">${price ? "₹ " + price : ""}</div>
            <button class="btn request-btn" data-product="${escapeHtml(model)}">Request</button>
          </div>
        </div>
      `;
      productsListEl.appendChild(card);
    });

    // attach click handlers for request buttons (event delegation)
    productsListEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".request-btn");
      if (!btn) return;
      const productName = btn.getAttribute("data-product") || "";
      openRequestModal(productName);
    });

  } catch (err) {
    console.error("loadProducts error:", err);
    productsListEl.innerHTML = `<div class="error">Failed to load products. Check sheet visibility or network.</div>`;
  } finally {
    spinner.style.display = "none";
  }
}

// small helper to avoid XSS when injecting attributes
function escapeHtml(s) {
  if (!s) return "";
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ---------- Modal & form ----------
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

// ---------- Submit request via GET (no preflight) ----------
async function submitRequestViaGet(formData) {
  // Build params including sheet=Requests & method=save to match server logic
  const params = new URLSearchParams({
    sheet: "Requests",
    method: "save",
    productName: formData.productName || "",
    customerName: formData.customerName || "",
    phone: formData.phone || "",
    address: formData.address || "",
    message: formData.message || ""
  }).toString();

  const fullUrl = (API_URL || "").trim();
  if (!fullUrl || fullUrl.includes("PASTE_YOUR_WEBAPP_URL_HERE")) {
    throw new Error("API_URL is not set. Paste your Apps Script Web App URL into app.js (API_URL).");
  }

  const url = `${fullUrl}?${params}`;
  const r = await fetch(url, { method: "GET", cache: "no-store" });
  const text = await r.text();
  const parsed = await parseMaybeJSONorJSONP(text);
  return parsed;
}

// ---------- DOM wiring ----------
document.addEventListener("DOMContentLoaded", () => {
  // elements assumed by your HTML
  const closeBtns = document.querySelectorAll("[data-close-modal]");
  closeBtns.forEach(b => b.addEventListener("click", closeRequestModal));
  qs("requestModalBackdrop").addEventListener("click", closeRequestModal);

  qs("requestForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const submitBtn = qs("submitRequestBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    const data = {
      productName: qs("requestProductName").value.trim(),
      customerName: qs("customerName").value.trim(),
      phone: qs("customerPhone").value.trim(),
      address: qs("customerAddress").value.trim(),
      message: qs("customerMessage").value.trim()
    };

    try {
      const res = await submitRequestViaGet(data);
      // res may be {status:"success"} or an array/object depending on endpoint
      const ok = (res && (res.status === "success" || res.status === "ok")) || (typeof res === "object" && !Array.isArray(res) && res !== null && res.status !== "error");
      if (ok) {
        alert("✅ Request submitted successfully. We will contact you soon.");
        closeRequestModal();
      } else {
        console.warn("submit result", res);
        throw new Error((res && res.message) ? res.message : "Server returned an error or unexpected response");
      }
    } catch (err) {
      console.error("submitRequest error:", err);
      alert("⚠️ Failed to submit request. Please try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Request";
    }
  });

  // initial load
  loadProducts();
});
