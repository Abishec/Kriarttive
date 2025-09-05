const API_URL = "https://script.google.com/macros/s/AKfycbwrvuRS81qYPEnW1hgN7ErOsUuz1_U8aqS2MjImLj37fLA-3IeAxuwT9XqjTi74uldc/exec";

document.addEventListener("DOMContentLoaded", () => {

  // Load Products
  async function loadProducts() {
    document.getElementById("loadingSpinner").style.display = "block"; // show spinner
    try {
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
            <button class="btn btn--primary" data-product="${p.Name}">Request</button>
          </div>
        `;
      });

      document.getElementById("productsList").innerHTML = html;

      // attach event listeners to all buttons
      document.querySelectorAll(".product-card button").forEach(btn => {
        btn.addEventListener("click", () => {
          openRequestModal(btn.getAttribute("data-product"));
        });
      });

    } catch (err) {
      document.getElementById("productsList").innerHTML = "<p>⚠️ Failed to load products.</p>";
      console.error(err);
    } finally {
      document.getElementById("loadingSpinner").style.display = "none"; // hide spinner
    }
  }

  // Request Modal
  function openRequestModal(productName) {
    document.getElementById("requestProductName").value = productName;
    document.getElementById("modalTitle").textContent = "Request Product: " + productName;
    document.getElementById("requestModal").classList.remove("hidden");
  }

  document.getElementById("closeRequestModal").addEventListener("click", () => {
    document.getElementById("requestModal").classList.add("hidden");
  });

  // Close modal when clicking outside
  document.getElementById("requestModal").addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      document.getElementById("requestModal").classList.add("hidden");
    }
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

    try {
      await fetch(API_URL + "?sheet=Requests", {
        method: "POST",
        body: JSON.stringify(request)
      });
      alert("✅ Request submitted!");
      document.getElementById("requestModal").classList.add("hidden");
      e.target.reset();
    } catch (err) {
      alert("⚠️ Failed to submit request. Try again later.");
      console.error(err);
    }
  });

  // Init
  loadProducts();

});
