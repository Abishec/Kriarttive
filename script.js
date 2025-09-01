google.charts.load('current',{ packages:['corechart','table'] });
google.charts.setOnLoadCallback(init);
function init() {
  const sheetId = '1rz-bf1ju-VbIm4g0Pc8TzZVGCTBE5J-VBtMs3q7VCA0';
  const sheetName = 'Products';
  const formLink = 'https://docs.google.com/forms/d/e/1FAIpQLSeA8mIg6Lz99bwGVNT9lsKTvvBh3efvhKqHzdjQjoHz02MiaA/viewform?usp=sharing';
  const queryUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?sheet=${sheetName}&headers=1`;
  const query = new google.visualization.Query(queryUrl);
  query.send(response => {
    if (response.isError()) {
      document.getElementById('product-grid').innerHTML =
        '<div class="error-message">Could not load products. Check sheet permissions.</div>';
      return;
    }
    const data = response.getDataTable();
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';
    for (let i = 0; i < data.getNumberOfRows(); i++) {
      const name = data.getValue(i,0);
      const price = data.getValue(i,1);
      const img = data.getValue(i,2) || '';
      const formatted = typeof price==='number'?`₹${price.toFixed(2)}`:price;
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <img src="${img}" alt="${name}">
        <div class="product-info">
          <h3 class="product-name">${name}</h3>
          <p class="product-price">${formatted}</p>
        </div>
        <a href="${formLink}" target="_blank" class="buy-button">Request to Buy</a>
      `;
      grid.appendChild(card);
    }
  });
}
