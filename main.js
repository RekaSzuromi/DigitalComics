// Function to determine if a point is inside a polygon (using the Ray-casting algorithm)
function pointInPolygon(point, polygon) {
    var x = point.x, y = point.y;
    var inside = false;
    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        var xi = polygon[i].x, yi = polygon[i].y;
        var xj = polygon[j].x, yj = polygon[j].y;
        var intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// Function to draw the panel on the canvas
function drawPanel(ctx, image, vertices, isRectangle) {
    let minX, maxX, minY, maxY;

    if (isRectangle) {
        minX = Math.min(vertices[0].x, vertices[1].x);
        minY = Math.min(vertices[0].y, vertices[1].y);
        maxX = Math.max(vertices[0].x, vertices[1].x);
        maxY = Math.max(vertices[0].y, vertices[1].y);
    } else {
        minX = vertices.reduce((min, v) => v.x < min ? v.x : min, vertices[0].x);
        maxX = vertices.reduce((max, v) => v.x > max ? v.x : max, vertices[0].x);
        minY = vertices.reduce((min, v) => v.y < min ? v.y : min, vertices[0].y);
        maxY = vertices.reduce((max, v) => v.y > max ? v.y : max, vertices[0].y);
    }

    ctx.canvas.width = maxX - minX;
    ctx.canvas.height = maxY - minY;

    ctx.beginPath();
    if (isRectangle) {
        ctx.rect(0, 0, maxX - minX, maxY - minY);
    } else {
        ctx.moveTo(vertices[0].x - minX, vertices[0].y - minY);
        vertices.slice(1).forEach(vertex => ctx.lineTo(vertex.x - minX, vertex.y - minY));
        ctx.closePath();
    }

    ctx.clip();
    ctx.drawImage(image, minX, minY, maxX - minX, maxY - minY, 0, 0, maxX - minX, maxY - minY);
}

// Process the panel data and create canvases, and log emotion associations
function processPanelData(panelData, emotionData) {
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

            let isRectangle = vertices.length === 2;

            drawPanel(ctx, image, vertices, isRectangle);

            // Process emotions for this panel
            let emotionAssociations = [];
            emotionData.forEach(emotion => {
                if (emotion['Page Number'] === panel['Page Number']) {
                    let emotionVertices = emotion['Emotion Region Vertices']
                        .match(/\((\d+,\d+)\)/g)
                        .map(s => s.replace(/[()]/g, '').split(',').map(Number))
                        .map(([x, y]) => ({x, y}));

                    let countInside = emotionVertices.reduce((count, vertex) => count + pointInPolygon(vertex, vertices), 0);

                    if (countInside > emotionVertices.length / 2) {
                        emotionAssociations.push(emotion['Taxonomy Path']);
                    }
                }
            });

            if (emotionAssociations.length) {
                console.log(`Panel ${index} associations:`, emotionAssociations);
            }
        };
    });
}

document.addEventListener('DOMContentLoaded', function() {
    Promise.all([
        fetch('./panel_data.json').then(response => response.json()),
        fetch('./emotion_data.json').then(response => response.json())
    ]).then(([panelData, emotionData]) => {
        processPanelData(panelData, emotionData);
    }).catch(error => {
        console.error('Error fetching data:', error);
    });
});
