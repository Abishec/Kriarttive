const API_URL = "https://script.google.com/macros/s/AKfycbwrvuRS81qYPEnW1hgN7ErOsUuz1_U8aqS2MjImLj37fLA-3IeAxuwT9XqjTi74uldc/exec";

// Load Products
async function loadProducts() {
  const res = await fetch(API_URL + "?sheet=Products");
  const products = await res.json();

  let html = "";
  products.forEach(p => {
    html += `
      <div class="product-card">
        <img src="${p.Image}" alt="${p.Name}" class="product-image">
        <h3>${p.Name}</h3>
        <p class="price">Rs. ${p.Price}</p>
        <p>${p.Description}</p>
        <button onclick="openRequestModal('${p.Name}')">Request</button>
      </div>
    `;
  });

  document.getElementById("productsList").innerHTML = html;
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
});

// Init
loadProducts();
