// Function to draw the panel on the canvas
function drawPanel(ctx, image, vertices) {
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    vertices.forEach(vertex => ctx.lineTo(vertex.x, vertex.y));
    ctx.closePath();
    ctx.clip();

    // Clear the area outside the polygon and draw the image
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(image, 0, 0);

    // Optionally draw the outline
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;
    ctx.stroke();
}

// Function to process panel data and create canvases
function processPanelData(panelData) {
    panelData.forEach((panel, index) => {
        // Create a new canvas element for each panel
        let canvas = document.createElement('canvas');
        canvas.id = `panelCanvas-${index}`;
        canvas.style.border = "1px solid black"; // Optional, for better visibility of the panels
        document.body.appendChild(canvas);
        
        let ctx = canvas.getContext('2d');
        let image = new Image();
        
        // Set image source to the corresponding page image
        image.src = `pages/page-${panel['Page Number']}.jpg`;

        image.onload = function() {
            // Set canvas size equal to the image size
            canvas.width = image.width;
            canvas.height = image.height;

            // Extract the vertices for the polygon from the panel data
            let vertices = panel['Region Vertices']
                .split('),')
                .map(s => s.replace('(', '').replace(')', '').split(',').map(Number))
                .map(([x, y]) => ({x, y}));

            // Draw the panel on the canvas
            drawPanel(ctx, image, vertices);
        };
    });
}

// Fetch the panel data from the JSON file and process it
document.addEventListener('DOMContentLoaded', function() {
    fetch('./panel_data.json')
    .then(response => response.json())
    .then(panelData => {
        processPanelData(panelData);
    })
    .catch(error => {
        console.error('Error fetching panel data:', error);
    });
});
