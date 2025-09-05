const API_URL = "https://script.google.com/macros/s/AKfycbwev4ld1Ewxi8L7X8E3TSASAlinGkoxyvRU-wZDFzzyU6iJn5hVWYDI6SYj4RvKpML8/exec";

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
    <div class="product-card">
      <div class="image-wrap">
        <img src="${imageUrl || 'https://via.placeholder.com/200?text=No+Image'}" alt="${name}">
      </div>
      <div class="product-body">
        <h3 class="product-name">${name}</h3>
        <p class="price">₹${price}</p>
        <p class="product-desc">${description}</p>
        <div class="product-actions">
          <button class="btn btn--primary" data-action="request" data-product="${name}">
            Request
          </button>
        </div>
      </div>
    </div>
  `;
}

async function loadProducts() {
  spinnerEl.style.display = "block";
  try {
    const response = await fetch(API_URL);
    const rows = await response.json();
    if (!rows || rows.length === 0) {
      productsListEl.innerHTML = `<div class="empty">No products available at the moment.</div>`;
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
    productsListEl.innerHTML = `<div class="error">Failed to load products.</div>`;
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
  
  console.log("Form submission started"); // Debug log
  
  const payload = {
    productName: requestProductInput.value,
    customerName: document.getElementById("customerName").value,
    phone: document.getElementById("customerPhone").value,
    address: document.getElementById("customerAddress").value,
    message: document.getElementById("customerMessage").value
  };
  
  console.log("Payload:", payload); // Debug log

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "text/plain;charset=utf-8" // Changed content type to avoid CORS preflight
      },
      body: JSON.stringify(payload)
    });
    
    console.log("Response status:", res.status); // Debug log
    
    const result = await res.json();
    console.log("Response result:", result); // Debug log
    
    if (result.status === "success") {
      alert("🎉 Request submitted successfully!");
      closeModal();
    } else {
      console.error("Error response:", result);
      alert("❌ Failed to submit request: " + (result.message || "Unknown error"));
    }
  } catch (err) {
    console.error("Submission error:", err);
    alert("❌ Failed to submit request. Check console for details.");
  } finally {
    btn.disabled = false;
  }
});

loadProducts();
});
