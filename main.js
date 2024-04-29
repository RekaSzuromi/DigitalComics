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
document.addEventListener('DOMContentLoaded', function() {
    const downloadBtn = document.getElementById('downloadButton');
    downloadBtn.addEventListener('click', function() {
        fetch('./panel_data.json')
            .then(response => response.json())
            .then(panelData => fetch('./emotion_data.json')
                .then(response => response.json())
                .then(emotionData => {
                    const associations = processPanelData(panelData, emotionData);
                    downloadJSON(associations, 'emotion_associations.json');
                })
            )
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    });
});

function processPanelData(panelData, emotionData) {
    let allEmotionAssociations = [];
    
    panelData.forEach(panel => {
        let panelVertices = panel['Panel Region Vertices']
            .match(/\((\d+,\d+)\)/g)
            .map(s => s.replace(/[()]/g, '').split(',').map(Number))
            .map(([x, y]) => ({x, y}));

        emotionData.forEach(emotion => {
            if (emotion['Page Number'] === panel['Page Number']) {
                let emotionVertices = emotion['Emotion Region Vertices']
                    .match(/\((\d+,\d+)\)/g)
                    .map(s => s.replace(/[()]/g, '').split(',').map(Number))
                    .map(([x, y]) => ({x, y}));

                let countInside = emotionVertices.reduce((count, vertex) => count + pointInPolygon(vertex, panelVertices), 0);

                if (countInside > emotionVertices.length / 2) {
                    allEmotionAssociations.push({
                        panelId: panel.id,
                        taxonomyPath: emotion['Taxonomy Path'],
                        emotionId: emotion.id
                    });
                }
            }
        });
    });

    return allEmotionAssociations;
}

function downloadJSON(data, filename) {
    let blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

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
