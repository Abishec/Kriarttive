// Load the Google Visualization API and the corechart package.
google.charts.load('current', {'packages':['corechart', 'table']});

// Set a callback to run when the Google Visualization API is loaded.
google.charts.setOnLoadCallback(init);

function init() {
    // Google Sheet ID and sheet name
    const sheetId = '1rz-bf1ju-VbIm4g0Pc8TzZVGCTBE5J-VBtMs3q7VCA0';
    const sheetName = 'Sheet1'; // Or whatever your sheet is named
    
    // The Google Form link for the "Request to Buy" button
    const googleFormLink = 'https://docs.google.com/forms/d/e/1FAIpQLSeA8mIg6Lz99bwGVNT9lsKTvvBh3efvhKqHzdjQjoHz02MiaA/viewform?usp=sharing';

    // The full URL to query the Google Sheet
    const queryUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?sheet=${sheetName}&headers=1`;
    
    // Create a new query object
    const query = new google.visualization.Query(queryUrl);
    
    // Send the query and handle the response in the callback
    query.send(handleQueryResponse);

    function handleQueryResponse(response) {
        if (response.isError()) {
            console.error('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
            const productGrid = document.getElementById('product-grid');
            productGrid.innerHTML = '<div class="error-message">Error: Could not load products. Please ensure the Google Sheet is public.</div>';
            return;
        }

        const dataTable = response.getDataTable();
        const numRows = dataTable.getNumberOfRows();
        const productGrid = document.getElementById('product-grid');

        // Clear the loading message
        productGrid.innerHTML = '';

        // Loop through all the rows of data
        for (let i = 0; i < numRows; i++) {
            const productName = dataTable.getValue(i, 0); // Column A
            const price = dataTable.getValue(i, 1);       // Column B
            const imageUrl = dataTable.getValue(i, 2);    // Column C

            // Format the price to include currency symbol if it doesn't already
            const formattedPrice = typeof price === 'number' ? `₹${price.toFixed(2)}` : price;

            // Create the HTML for a product card
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${imageUrl}" alt="${productName}">
                <div class="product-info">
                    <h3 class="product-name">${productName}</h3>
                    <p class="product-price">${formattedPrice}</p>
                </div>
                <a href="${googleFormLink}" target="_blank" rel="noopener noreferrer" class="buy-button">Request to Buy</a>
            `;
            
            // Append the new card to the grid
            productGrid.appendChild(card);
        }
    }
}