const API_URL = "https://script.google.com/macros/s/AKfycbwrvuRS81qYPEnW1hgN7ErOsUuz1_U8aqS2MjImLj37fLA-3IeAxuwT9XqjTi74uldc/exec";

// Load Products
async function loadProducts() {
  const res = await fetch(API_URL + "?sheet=Products");
  const products = await res.json();

  let html = "";
  products.forEach(p => {
    html += `
      <div class="product-card">
        <img src="${p.Image}" alt="${p.Name}">
        <h3>${p.Name}</h3>
        <p>Price: Rs. ${p.Price}</p>
        <p>${p.Description}</p>
        <button onclick="openRequestModal('${p.Name}')">Request</button>
      </div>
    `;
  });

  document.getElementById("productsList").innerHTML = html;
  document.getElementById("adminProductsList").innerHTML = html;
}

// Load Requests
async function loadRequests() {
  const res = await fetch(API_URL + "?sheet=Requests");
  const requests = await res.json();

  let html = "";
  requests.forEach(r => {
    html += `
      <div class="request-card">
        <h4>${r.Product} - ${r.Customer}</h4>
        <p>Phone: ${r.Phone}</p>
        <p>Address: ${r.Address}</p>
        <p>Message: ${r.Message}</p>
        <p>Status: ${r.Status}</p>
      </div>
    `;
  });

  document.getElementById("requestsList").innerHTML = html;
}

// Request Modal
function openRequestModal(productName) {
  document.getElementById("requestProductName").value = productName;
  document.getElementById("requestModal").classList.remove("hidden");
}

document.getElementById("closeRequestModal").addEventListener("click", () => {
  document.getElementById("requestModal").classList.add("hidden");
});

// Submit Request
document.getElementById("requestForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const request = {
    productName: document.getElementById("requestProductName").value,
    customerName: document.getElementById("customerName").value,
    phone: document.getElementById("customerPhone").value,
    address: document.getElementById("customerAddress").value,
    message: document.getElementById("customerMessage").value
  };

  await fetch(API_URL + "?sheet=Requests", {
    method: "POST",
    body: JSON.stringify(request)
  });

  alert("Request submitted!");
  document.getElementById("requestModal").classList.add("hidden");
  e.target.reset();
  loadRequests();
});

// Tab Switch
document.getElementById("productsTab").addEventListener("click", () => {
  document.getElementById("productsSection").classList.remove("hidden");
  document.getElementById("requestsSection").classList.add("hidden");
});

document.getElementById("requestsTab").addEventListener("click", () => {
  document.getElementById("productsSection").classList.add("hidden");
  document.getElementById("requestsSection").classList.remove("hidden");
  loadRequests();
});

// Init
loadProducts();
