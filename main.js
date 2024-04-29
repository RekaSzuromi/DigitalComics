// Function to draw the panel on the canvas, adjusted to set canvas size dynamically and without outline
function drawPanel(ctx, image, vertices, isRectangle) {
    let minX, maxX, minY, maxY;

    if (isRectangle) {
        // Calculate bounding box for rectangle
        minX = Math.min(vertices[0].x, vertices[1].x);
        minY = Math.min(vertices[0].y, vertices[1].y);
        maxX = Math.max(vertices[0].x, vertices[1].x);
        maxY = Math.max(vertices[0].y, vertices[1].y);
    } else {
        // Calculate bounding box for polygon
        minX = vertices.reduce((min, v) => v.x < min ? v.x : min, vertices[0].x);
        maxX = vertices.reduce((max, v) => v.x > max ? v.x : max, vertices[0].x);
        minY = vertices.reduce((min, v) => v.y < min ? v.y : min, vertices[0].y);
        maxY = vertices.reduce((max, v) => v.y > max ? v.y : max, vertices[0].y);
    }

    // Set canvas size to fit the panel
    ctx.canvas.width = maxX - minX;
    ctx.canvas.height = maxY - minY;

    ctx.beginPath();
    if (isRectangle) {
        // Rectangle: adjust the coordinates for the smaller canvas
        ctx.rect(0, 0, maxX - minX, maxY - minY);
    } else {
        // Polygon: adjust coordinates for the smaller canvas
        ctx.moveTo(vertices[0].x - minX, vertices[0].y - minY);
        vertices.slice(1).forEach(vertex => ctx.lineTo(vertex.x - minX, vertex.y - minY));
        ctx.closePath();
    }

    ctx.clip();

    // Draw the image section corresponding to the bounding box
    ctx.drawImage(image, minX, minY, maxX - minX, maxY - minY, 0, 0, maxX - minX, maxY - minY);
}

// Process the panel data and create canvases
function processPanelData(panelData) {
    panelData.forEach((panel, index) => {
        let canvas = document.createElement('canvas');
        canvas.id = `panelCanvas-${index}`;
        canvas.style.marginBottom = "40px"; // Adds space between each canvas
        document.body.appendChild(canvas);
        
        let ctx = canvas.getContext('2d');
        let image = new Image();
        image.src = `pages/page-${panel['Page Number']}.jpg`;

        image.onload = function() {
            let vertices = panel['Panel Region Vertices']
                .match(/\((\d+,\d+)\)/g)
                .map(s => s.replace(/[()]/g, '').split(',').map(Number))
                .map(([x, y]) => ({x, y}));

            // Determine if the panel is a rectangle
            let isRectangle = vertices.length === 2;

            drawPanel(ctx, image, vertices, isRectangle);
        };
    });
}

// Event listener to fetch and process data
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
