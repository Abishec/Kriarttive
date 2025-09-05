// ================================
//  FINAL app.js — Copy & Paste
// ================================

const API_URL = "https://script.google.com/macros/s/AKfycbyBF4N4Td0isoluXR2ctze9_DrLjn8n_nhYFFdSTGuMee-vbrVKTmKM97qXf5yR6p2C/exec";

document.addEventListener("DOMContentLoaded", () => {
  const productsListEl = document.getElementById("productsList");
  const spinnerEl = document.getElementById("loadingSpinner");
  const modalEl = document.getElementById("requestModal");
  const modalTitleEl = document.getElementById("modalTitle");
  const requestProductInput = document.getElementById("requestProductName");
  const requestForm = document.getElementById("requestForm");
  const closeModalBtn = document.getElementById("closeRequestModal");

  function getField(obj = {}, candidates = []) {
    for (const name of candidates) {
      if (obj[name] != null && obj[name] !== "") return obj[name];
    }
    return "";
  }

  function productCardHTML({ name, price, description, imageUrl }) {
    return `
      <article class="product-card">
        <div class="image-wrap">
          <img src="${imageUrl || ""}" alt="${name}" class="product-image" />
        </div>
        <div class="product-body">
          <h3 class="product-name">${name}</h3>
          <div class="price">Rs. ${price}</div>
          <p class="product-desc">${description}</p>
          <button class="btn btn--primary" data-action="request" data-product="${name}">
            Request
          </button>
        </div>
      </article>`;
  }

  async function loadProducts() {
    spinnerEl.style.display = "block";
    productsListEl.innerHTML = "";

    try {
      const res = await fetch(`${API_URL}?sheet=Products`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch products");
      const rows = await res.json();
      if (!Array.isArray(rows) || rows.length === 0) {
        productsListEl.innerHTML = `<p class="empty">No products available at the moment.</p>`;
      } else {
        productsListEl.innerHTML = rows.map(r => {
          const name = getField(r, ["Name", "Product", "Title"]);
          const price = getField(r, ["Price", "price", "Cost"]);
          const description = getField(r, ["Description", "Desc"]);
          const imageUrl = getField(r, ["Image", "Image URL", "image_url"]);
          return productCardHTML({ name, price, description, imageUrl });
        }).join("");
      }
    } catch (err) {
      console.error("Error loading products:", err);
      productsListEl.innerHTML = `<p class="error">Failed to load products.</p>`;
    } finally {
      spinnerEl.style.display = "none";
    }
  }

  productsListEl.addEventListener("click", e => {
    const btn = e.target.closest("button[data-action='request']");
    if (!btn) return;
    openRequestModal(btn.dataset.product);
  });

  function openRequestModal(productName) {
    requestProductInput.value = productName;
    modalTitleEl.textContent = `Request: ${productName}`;
    modalEl.classList.remove("hidden");
  }

  function closeModal() {
    modalEl.classList.add("hidden");
    requestForm.reset();
  }

  closeModalBtn.addEventListener("click", closeModal);
  modalEl.addEventListener("click", e => {
    if (e.target === modalEl) closeModal();
  });

  requestForm.addEventListener("submit", async e => {
    e.preventDefault();
    const btn = e.submitter;
    btn.disabled = true;

    const payload = {
      productName: requestProductInput.value,
      customerName: document.getElementById("customerName").value,
      phone: document.getElementById("customerPhone").value,
      address: document.getElementById("customerAddress").value,
      message: document.getElementById("customerMessage").value
    };

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.status === "success") {
        alert("🎉 Request submitted successfully!");
        closeModal();
      } else {
        console.error("Error response:", result);
        alert("❌ Failed to submit request.");
      }
    } catch (err) {
      console.error("Submission error:", err);
      alert("❌ Failed to submit request. Try again later.");
    } finally {
      btn.disabled = false;
    }
  });

  loadProducts();
});
