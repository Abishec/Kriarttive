const API_URL = "https://script.google.com/macros/s/AKfycbwQuhi8_Y6Cft51cZ7xTvmu1UtqVQngfWeEvs88WXF2htJzKwVSpbWwb115DtvB6Y0/exec";

// ========== CUSTOMER SIDE ==========
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("product-list")) {
    loadProducts();
  }

  if (document.getElementById("requestForm")) {
    document.getElementById("requestForm").addEventListener("submit", submitRequest);
  }

  if (document.getElementById("loginBtn")) {
    document.getElementById("loginBtn").addEventListener("click", loginAdmin);
  }

  if (document.getElementById("productForm")) {
    document.getElementById("productForm").addEventListener("submit", addProduct);
  }
});

// Load products for customers
function loadProducts() {
  fetch(API_URL + "?action=getProducts")
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById("product-list");
      list.innerHTML = "";
      data.forEach(p => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
          <img src="${p.image}" alt="${p.name}">
          <h3>${p.name}</h3>
          <p>Price: ${p.price}</p>
          <p>${p.description}</p>
        `;
        list.appendChild(card);
      });
    });
}

// Submit customer request
function submitRequest(e) {
  e.preventDefault();
  const formData = new FormData();
  formData.append("action", "addRequest");
  formData.append("name", document.getElementById("reqName").value);
  formData.append("phone", document.getElementById("reqPhone").value);
  formData.append("address", document.getElementById("reqAddress").value);

  fetch(API_URL, { method: "POST", body: formData })
    .then(res => res.json())
    .then(data => {
      alert("Request submitted successfully!");
      document.getElementById("requestForm").reset();
    });
}

// ========== ADMIN SIDE ==========

// Admin login
function loginAdmin() {
  const formData = new FormData();
  formData.append("action", "login");
  formData.append("email", document.getElementById("adminEmail").value);
  formData.append("password", document.getElementById("adminPassword").value);

  fetch(API_URL, { method: "POST", body: formData })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        document.getElementById("loginSection").style.display = "none";
        document.getElementById("adminSection").style.display = "block";
        loadRequests();
      } else {
        document.getElementById("loginMessage").innerText = "Invalid login!";
      }
    });
}

// Add product (with image upload)
function addProduct(e) {
  e.preventDefault();
  const formData = new FormData();
  formData.append("action", "addProduct");
  formData.append("name", document.getElementById("productName").value);
  formData.append("price", document.getElementById("productPrice").value);
  formData.append("description", document.getElementById("productDescription").value);
  formData.append("file", document.getElementById("productImage").files[0]);

  fetch(API_URL, { method: "POST", body: formData })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Product added successfully!");
        document.getElementById("productForm").reset();
      } else {
        alert("Error: " + data.error);
      }
    });
}

// Load customer requests for admin
function loadRequests() {
  fetch(API_URL + "?action=getRequests")
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById("requestsList");
      list.innerHTML = "";
      data.forEach(r => {
        const div = document.createElement("div");
        div.innerHTML = `<p><strong>${r.name}</strong> (${r.phone}) - ${r.address}</p>`;
        list.appendChild(div);
      });
    });
}
