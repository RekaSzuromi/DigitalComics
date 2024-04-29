
function pointInPolygon(point, polygon) {
    var x = point.x, y = point.y;
    var inside = false;
    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        var xi = polygon[i].x, yi = polygon[i].y;
        var xj = polygon[j].x, yj = polygon[j].y;
        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

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
function processPanelData(panelData, emotionData) {
    panelData.forEach((panel, index) => {
        let canvas = document.createElement('canvas');
        canvas.id = `panelCanvas-${index}`;
        canvas.style.border = "1px solid black";
        canvas.style.marginBottom = "10px";
        document.body.appendChild(canvas);

        let ctx = canvas.getContext('2d');
        let image = new Image();
        image.src = `pages/page-${panel['Page Number']}.jpg`;

        image.onload = function() {
            let panelVertices = panel['Panel Region Vertices']
                .match(/\((\d+,\d+)\)/g)
                .map(s => s.replace(/[()]/g, '').split(',').map(Number))
                .map(([x, y]) => ({x, y}));

            drawPanel(ctx, image, panelVertices, panelVertices.length > 2);

            // Process emotions for this panel
            let panelEmotions = emotionData.filter(emotion => emotion['Page Number'] === panel['Page Number']);
            let emotionTexts = [];

            panelEmotions.forEach(emotion => {
                let emotionVertices = emotion['Emotion Region Vertices']
                    .match(/\((\d+,\d+)\)/g)
                    .map(s => s.replace(/[()]/g, '').split(',').map(Number))
                    .map(([x, y]) => ({x, y}));
                
                // Count how many vertices of the emotion are inside the panel
                let countInside = emotionVertices.reduce((count, vertex) => count + pointInPolygon(vertex, panelVertices), 0);
                
                // If more than half of the vertices are inside the panel, consider the emotion associated with this panel
                if (countInside > emotionVertices.length / 2) {
                    emotionTexts.push(emotion['Taxonomy Path']);
                }
            });

            // Create a div to show associated emotions next to the canvas
            if (emotionTexts.length) {
                let taxonomyDiv = document.createElement('div');
                taxonomyDiv.innerText = emotionTexts.join('\n');
                taxonomyDiv.style.whiteSpace = 'pre';
                taxonomyDiv.style.marginLeft = '10px';
                document.body.appendChild(taxonomyDiv);
            }
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
