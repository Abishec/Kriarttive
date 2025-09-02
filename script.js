/* Public site script: loads products from Apps Script webapp
   Replace with your webapp URL
*/
const WEBAPP_URL = "YOUR_WEBAPP_URL_HERE";

async function loadProducts() {
  const grid = document.getElementById('product-grid');
  try {
    grid.innerHTML = '<div class="loading-message">Loading products...</div>';
    const url = new URL(WEBAPP_URL);
    url.searchParams.append('function', 'getProducts');
    const res = await fetch(url.toString());
    const products = await res.json();
    if (!Array.isArray(products) || products.length === 0) {
      grid.innerHTML = '<div class="loading-message">No products found.</div>';
      return;
    }
    grid.innerHTML = '';
    products.forEach(p => {
      const card = document.createElement('div');
      card.className = 'product-card';
      const img = p.ImageURL || '';
      const desc = p.Description || '';
      const price = p.Price || '';
      // show NPR currency
      const formatted = (price !== '' && !isNaN(Number(price))) ? `NPR ${Number(price).toFixed(2)}` : `NPR ${price}`;
      card.innerHTML = `
        <img src="${img}" alt="${(p.Name || '').replace(/"/g,'')}" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
        <div class="product-info">
          <div class="product-name">${p.Name || ''}</div>
          <div class="product-price">${formatted}</div>
          <p style="margin-top:8px;font-size:0.95rem;color:#444">${desc}</p>
        </div>
        <a class="buy-button" href="https://docs.google.com/forms/d/e/1FAIpQLSeA8mIg6Lz99bwGVNT9lsKTvvBh3efvhKqHzdjQjoHz02MiaA/viewform?usp=sharing" target="_blank">Request to Buy</a>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = '<div class="loading-message">Error loading products. Check API URL and permissions.</div>';
    console.error(err);
  }
}

// load on page ready
document.addEventListener('DOMContentLoaded', loadProducts);
