// Function to draw the panel on the canvas
function drawPanel(ctx, image, vertices) {
    ctx.beginPath();
    
    // Check if the vertices define a rectangle (exactly 2 points)
    if (vertices.length === 2) {
        // Rectangle: use the 'rect' method
        const x = Math.min(vertices[0].x, vertices[1].x);
        const y = Math.min(vertices[0].y, vertices[1].y);
        const width = Math.abs(vertices[1].x - vertices[0].x);
        const height = Math.abs(vertices[1].y - vertices[0].y);
        ctx.rect(x, y, width, height);
    } else {
        // Polygon: use the 'moveTo' and 'lineTo' methods
        ctx.moveTo(vertices[0].x, vertices[0].y);
        vertices.slice(1).forEach(vertex => ctx.lineTo(vertex.x, vertex.y));
        ctx.closePath();
    }

    ctx.clip();

    // Clear the area outside the shape and draw the image
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(image, 0, 0);

    // Optionally draw the outline
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;
    ctx.stroke();
}

// Process the panel data and create canvases
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

            // Extract the vertices for the shape from the panel data
            let vertices = panel['Panel Region Vertices']
                .match(/\((\d+,\d+)\)/g)
                .map(s => s.replace(/[()]/g, '').split(',').map(Number))
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
