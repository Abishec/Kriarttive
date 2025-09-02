/* script.js - shared for index.html and admin.html
   IMPORTANT: set WEB_APP_URL to your Apps Script Web App URL after deployment
*/
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzyuUn3xZ9M4D45s-2xX4LZOHQmg4HhuWSMYs4OlYrwocreAFbT20eMA2N9Ep5XkyuZ/exec"; // <<--- PASTE your Apps Script Web App URL here

// Utility: GET JSON
async function apiGet(params = {}) {
  const url = new URL(WEB_APP_URL);
  Object.keys(params).forEach(k => url.searchParams.append(k, params[k]));
  const res = await fetch(url.toString());
  return res.json();
}

// Utility: POST JSON
async function apiPost(obj) {
  const res = await fetch(WEB_APP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj)
  });
  return res.json();
}

/* ============================
   Public site: index.html logic
   ============================ */
async function renderProductsGrid() {
  try {
    const products = await apiGet({ function: "getProducts" });
    const grid = document.getElementById("productsGrid");
    if (!grid) return;
    grid.innerHTML = "";
    products.forEach((p, idx) => {
      // keys from sheet: "Name", "Price", "Image URL", "Description"
      const name = p["Name"] || p.Name || "";
      const price = p["Price"] || p.Price || "";
      const img = p["Image URL"] || p["Image URL".trim()] || p["ImageURL"] || p.ImageURL || p["image"] || "";
      const desc = p["Description"] || p.Description || "";

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${img || 'https://via.placeholder.com/600x400?text=No+Image'}" alt="${name}" />
        <div class="card-body">
          <div class="title">${name}</div>
          <div class="desc">${desc}</div>
          <div class="price">रु ${Number(price || 0).toFixed(2)}</div>
          <button class="btn request-btn" data-idx="${idx}">Request</button>
        </div>
      `;
      grid.appendChild(card);
    });

    // attach request modal per card (simple inline prompt)
    document.querySelectorAll(".request-btn").forEach(btn => {
      btn.onclick = async () => {
        const idx = btn.dataset.idx;
        const name = (await apiGet({ function: "getProducts" }))[idx]["Name"];
        const custName = prompt("Your name?");
        if (!custName) return;
        const phone = prompt("Phone number?");
        if (!phone) return;
        const address = prompt("Delivery address?");
        if (!address) return;

        const resp = await apiPost({ action: "addRequest", name: custName, phone, address });
        if (resp && resp.ok !== false) alert("Request submitted — we will contact you.");
        else alert("Failed to submit request.");
      };
    });
  } catch (err) {
    console.error("Error loading products", err);
  }
}

/* Quick request sidebar */
const sendRequestBtn = document.getElementById("sendRequestBtn");
if (sendRequestBtn) {
  sendRequestBtn.onclick = async () => {
    const name = document.getElementById("reqName").value.trim();
    const phone = document.getElementById("reqPhone").value.trim();
    const address = document.getElementById("reqAddress").value.trim();
    if (!name || !phone || !address) { alert("Fill all fields"); return; }
    const r = await apiPost({ action: "addRequest", name, phone, address });
    if (r && r.ok) {
      alert("Request sent — thank you!");
      document.getElementById("reqName").value = ""; document.getElementById("reqPhone").value = ""; document.getElementById("reqAddress").value = "";
    } else alert("Failed to send request.");
  };
}

/* Load products on public page */
if (document.getElementById("productsGrid")) {
  document.addEventListener("DOMContentLoaded", renderProductsGrid);
}

/* ============================
   Admin page logic
   ============================ */
if (document.getElementById("loginBtn")) {
  document.getElementById("loginBtn").onclick = async () => {
    const email = document.getElementById("adminEmail").value.trim();
    const pwd = document.getElementById("adminPwd").value;
    if (!email || !pwd) { document.getElementById("loginMsg").innerText = "Fill email & password"; return; }
    const res = await apiPost({ action: "login", email, password: pwd });
    if (res && res.ok) {
      // show admin area
      document.getElementById("loginCard").style.display = "none";
      document.getElementById("adminArea").style.display = "block";
      // store admin email locally for session
      sessionStorage.setItem("kri_admin", email);
      loadAdminProducts();
      loadAdminRequests();
    } else {
      document.getElementById("loginMsg").innerText = "Invalid credentials";
    }
  };
}

// Save (add or edit) product
if (document.getElementById("saveProdBtn")) {
  let editIndex = null; // null => add, number => edit

  document.getElementById("saveProdBtn").onclick = async () => {
    const name = document.getElementById("prodName").value.trim();
    const price = document.getElementById("prodPrice").value.trim();
    const desc = document.getElementById("prodDesc").value.trim();
    const fileInput = document.getElementById("prodImage");
    if (!name || !price) { alert("Name and price required"); return; }

    let imageBase64 = null;
    if (fileInput && fileInput.files && fileInput.files.length) {
      const file = fileInput.files[0];
      imageBase64 = await fileToDataUrl(file); // includes prefix data:<mime>;base64,AAA...
    }

    if (editIndex === null) {
      // add
      const res = await apiPost({ action: "addProduct", name, price, description: desc, imageBase64 });
      if (res && res.ok) { document.getElementById("saveMsg").innerText = "Product added"; clearProdForm(); loadAdminProducts(); }
      else alert("Failed to add product: " + (res && res.error));
    } else {
      // update
      const res = await apiPost({ action: "updateProduct", rowIndex: editIndex, name, price, description: desc, imageBase64 });
      if (res && res.ok) { document.getElementById("saveMsg").innerText = "Product updated"; editIndex = null; clearProdForm(); loadAdminProducts(); }
      else alert("Failed to update: " + (res && res.error));
    }
  };

  // cancel edit
  document.getElementById("cancelEditBtn").onclick = () => { clearProdForm(); editIndex = null; };

  // helper to convert file -> dataURL
  async function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }
}

// Load products in admin UI
async function loadAdminProducts() {
  const products = await apiGet({ function: "getProducts" });
  const listEl = document.getElementById("productsList");
  if (!listEl) return;
  listEl.innerHTML = "";
  products.forEach((p, idx) => {
    const name = p["Name"] || p.Name || "";
    const price = p["Price"] || p.Price || "";
    const img = p["Image URL"] || p["Image URL".trim()] || p["ImageURL"] || p.ImageURL || p["image"] || "";
    const desc = p["Description"] || p.Description || "";

    const item = document.createElement("div");
    item.style.padding = "8px";
    item.style.borderBottom = "1px solid #eee";
    item.innerHTML = `
      <div style="display:flex;gap:10px;align-items:center">
        <img src="${img || 'https://via.placeholder.com/150x100?text=No+Image'}" class="thumb" />
        <div style="flex:1">
          <div style="font-weight:600">${name}</div>
          <div class="small">रु ${Number(price || 0).toFixed(2)}</div>
          <div class="small" style="color:#666">${(desc||'')}</div>
        </div>
        <div class="actions">
          <button class="btn" onclick="editProduct(${idx})">Edit</button>
          <button class="btn" style="background:#c33" onclick="deleteProduct(${idx})">Delete</button>
        </div>
      </div>
    `;
    listEl.appendChild(item);
  });
}

// Edit product: populate form
async function editProduct(index) {
  const p = await apiGet({ function: "getProductByRow", row: index });
  if (!p) return alert("Product not found");
  document.getElementById("prodName").value = p["Name"] || p.Name || "";
  document.getElementById("prodPrice").value = p["Price"] || p.Price || "";
  document.getElementById("prodDesc").value = p["Description"] || p.Description || "";
  // mark editIndex within closure by overriding save handler pattern
  // We'll implement editIndex via a simple global variable by re-binding save button:
  window.__editIndex = index;
  // modify saveProdBtn handler to use update when __editIndex set
  const saveBtn = document.getElementById("saveProdBtn");
  saveBtn.onclick = async () => {
    const name = document.getElementById("prodName").value.trim();
    const price = document.getElementById("prodPrice").value.trim();
    const desc = document.getElementById("prodDesc").value.trim();
    const fileInput = document.getElementById("prodImage");
    let imageBase64 = null;
    if (fileInput && fileInput.files && fileInput.files.length) {
      imageBase64 = await (new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(fileInput.files[0]);
      }));
    }
    const res = await apiPost({ action: "updateProduct", rowIndex: window.__editIndex, name, price, description: desc, imageBase64 });
    if (res && res.ok) {
      document.getElementById("saveMsg").innerText = "Updated";
      window.__editIndex = null;
      document.getElementById("prodImage").value = "";
      document.getElementById("prodName").value = "";
      document.getElementById("prodPrice").value = "";
      document.getElementById("prodDesc").value = "";
      loadAdminProducts();
    } else alert("Update failed");
  };
}

// Delete product
async function deleteProduct(index) {
  if (!confirm("Delete this product?")) return;
  const res = await apiPost({ action: "deleteProduct", rowIndex: index });
  if (res && res.ok) loadAdminProducts();
  else alert("Delete failed");
}

// Load requests
async function loadAdminRequests() {
  const reqs = await apiGet({ function: "getRequests" });
  const el = document.getElementById("requestsList");
  if (!el) return;
  el.innerHTML = "";
  reqs.forEach(r => {
    const div = document.createElement("div");
    div.style.padding = "8px";
    div.style.borderBottom = "1px solid #eee";
    div.innerHTML = `<div style="font-weight:600">${r["Customer Name"] || r.CustomerName || r.name || ''}</div>
                     <div class="small">${r["Phone Number"] || r.Phone || ''} — ${r["Address"] || r.Address || ''}</div>
                     <div class="small" style="color:#888">${r["Timestamp"] || r.Timestamp || ''}</div>`;
    el.appendChild(div);
  });
}

/* Utility to clear add form */
function clearProdForm() {
  document.getElementById("prodName").value = "";
  document.getElementById("prodPrice").value = "";
  document.getElementById("prodDesc").value = "";
  document.getElementById("prodImage").value = "";
}
