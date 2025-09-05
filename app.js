// YOUR Apps Script web app endpoint (from you)
const API_URL = "https://script.google.com/macros/s/AKfycbwrvuRS81qYPEnW1hgN7ErOsUuz1_U8aqS2MjImLj37fLA-3IeAxuwT9XqjTi74uldc/exec";

document.addEventListener("DOMContentLoaded", () => {
  const productsListEl = document.getElementById("productsList");
  const spinnerEl = document.getElementById("loadingSpinner");
  const modalEl = document.getElementById("requestModal");
  const modalTitleEl = document.getElementById("modalTitle");
  const requestProductInput = document.getElementById("requestProductName");
  const requestForm = document.getElementById("requestForm");
  const closeModalBtn = document.getElementById("closeRequestModal");

  // Helper: safely get possible field names from sheet row object
  function getField(obj, candidates = []) {
    for (const c of candidates) {
      if (obj[c] !== undefined && obj[c] !== null && obj[c] !== "") return obj[c];
    }
    // try lowercase keys fallback
    const keys = Object.keys(obj || {});
    for (const key of keys) {
      const lk = key.toLowerCase();
      for (const c of candidates) {
        if (lk === c.toLowerCase()) return obj[key];
      }
    }
    return "";
  }

  // Render a product card (square board + image)
  function productCardHTML({ name, price, description, imageUrl }) {
    return `
      <article class="product-card">
        <div class="image-wrap" aria-hidden="true">
          <img src="${imageUrl || ''}" alt="${escapeHtml(name)}" loading="lazy" onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22><rect fill=%22%23f3f3f3%22 width=%22200%22 height=%22200%22></rect><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Roboto%22 font-size=%2214%22 fill=%22%23888%22>No image</text></svg>';">
        </div>
        <div class="product-body">
          <h3 class="product-name">${escapeHtml(name)}</h3>
          <div class="price">Rs. ${escapeHtml(price)}</div>
          <p class="product-desc">${escapeHtml(description)}</p>
          <div class="product-actions">
            <button class="btn btn--primary" data-action="request" data-product="${escapeAttr(name)}">Request</button>
          </div>
        </div>
      </article>
    `;
  }

  // Basic HTML escaping for safety
  function escapeHtml(str = "") {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
  function escapeAttr(s = "") {
    return String(s).replaceAll('"', '&quot;').replaceAll("'", "&#39;");
  }

  // Load products from sheet
  async function loadProducts() {
    spinnerEl.style.display = "block";
    productsListEl.innerHTML = ""; // clear
    try {
      const res = await fetch(`${API_URL}?sheet=Products`, { cache: "no-store" });
      if (!res.ok) throw new Error("Network response not OK");
      const rows = await res.json();

      // rows is an array of objects where keys are your sheet headers
      if (!Array.isArray(rows) || rows.length === 0) {
        productsListEl.innerHTML = `<p class="empty">No products available right now.</p>`;
        return;
      }

      const html = rows.map(row => {
        // try to read fields with multiple possible header names
        const name = getField(row, ["Name", "Product", "Title"]);
        const price = getField(row, ["Price", "price", "Cost"]);
        const description = getField(row, ["Description", "Desc", "description"]);
        const imageUrl = getField(row, ["Image", "Image URL", "ImageUrl", "image", "image_url"]);
        return productCardHTML({ name, price, description, imageUrl });
      }).join("");

      productsListEl.innerHTML = html;
    } catch (err) {
      console.error("Load products error:", err);
      productsListEl.innerHTML = `<p class="error">Failed to load products. Please try later.</p>`;
    } finally {
      spinnerEl.style.display = "none";
    }
  }

  // Event delegation for product request buttons
  productsListEl.addEventListener("click", (ev) => {
    const btn = ev.target.closest('button[data-action="request"]');
    if (!btn) return;
    const productName = btn.dataset.product || "";
    openRequestModal(productName);
  });

  // Open modal
  function openRequestModal(productName) {
    requestProductInput.value = productName;
    modalTitleEl.textContent = `Request: ${productName}`;
    modalEl.classList.remove("hidden");
    // focus first input
    setTimeout(() => document.getElementById("customerName").focus(), 80);
  }

  // Close modal
  function closeModal() {
    modalEl.classList.add("hidden");
  }
  closeModalBtn.addEventListener("click", closeModal);

  // Click outside modal to close
  modalEl.addEventListener("click", (e) => {
    // If click on backdrop or modal root (not inside modal-card)
    if (e.target === modalEl || e.target.classList.contains("modal-backdrop")) {
      closeModal();
    }
  });

  // Escape key closes modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalEl.classList.contains("hidden")) closeModal();
  });

  // Submit request — writes to Requests sheet via Apps Script POST
  requestForm.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const submitBtn = document.getElementById("submitRequestBtn");
    submitBtn.disabled = true;
    const payload = {
      productName: document.getElementById("requestProductName").value || "",
      customerName: document.getElementById("customerName").value || "",
      phone: document.getElementById("customerPhone").value || "",
      address: document.getElementById("customerAddress").value || "",
      message: document.getElementById("customerMessage").value || ""
    };

    try {
      const res = await fetch(`${API_URL}?sheet=Requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Network error");
      // success
      alert("✅ Request submitted. We will contact you soon.");
      closeModal();
      requestForm.reset();
    } catch (err) {
      console.error("Submit request error:", err);
      alert("⚠️ Failed to submit request. Please try again.");
    } finally {
      submitBtn.disabled = false;
    }
  });

  // init
  loadProducts();
});
