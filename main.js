

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

document.addEventListener('DOMContentLoaded', function() {
    Promise.all([
        fetch('./panel_data.json').then(response => response.json()),
        fetch('./emotion_data.json').then(response => response.json())
    ]).then(([panelData, emotionData]) => {
        const downloadBtn = document.getElementById('downloadButton');
        downloadBtn.addEventListener('click', () => {
            processPanelData(panelData, emotionData);
        });
    }).catch(error => {
        console.error('Error fetching data:', error);
    });
});

function processPanelData(panelData, emotionData) {
    let allEmotionAssociations = [];
    let imagesLoaded = 0;

    panelData.forEach((panel, index) => {
        let canvas = document.createElement('canvas');
        canvas.id = `panelCanvas-${index}`;
        canvas.style.marginBottom = "20px";
        document.body.appendChild(canvas);

        let ctx = canvas.getContext('2d');
        let image = new Image();
        image.src = `pages/page-${panel['Page Number']}.jpg`;
        image.onload = () => {
            let vertices = panel['Panel Region Vertices']
                .match(/\((\d+,\d+)\)/g)
                .map(s => s.replace(/[()]/g, '').split(',').map(Number))
                .map(([x, y]) => ({x, y}));

            drawPanel(ctx, image, vertices, vertices.length === 2);

            emotionData.forEach(emotion => {
                if (emotion['Page Number'] === panel['Page Number']) {
                    let emotionVertices = emotion['Emotion Region Vertices']
                        .match(/\((\d+,\d+)\)/g)
                        .map(s => s.replace(/[()]/g, '').split(',').map(Number))
                        .map(([x, y]) => ({x, y}));

                    let countInside = emotionVertices.reduce((count, vertex) => count + pointInPolygon(vertex, vertices), 0);

                    if (countInside > emotionVertices.length / 2) {
                        allEmotionAssociations.push({
                            panelId: panel.id,  // Assuming there's an ID field in your panel data
                            emotionId: emotion.id,
                            taxonomyPath: emotion['Taxonomy Path']
                        });
                    }
                }
            });

            imagesLoaded++;
            if (imagesLoaded === panelData.length) { // All images processed
                downloadJSON(allEmotionAssociations, 'emotion_associations.json');
            }
        };
    });
}

function downloadJSON(data, filename) {
    let blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function drawPanel(ctx, image, vertices, isRectangle) {
    let minX = Math.min(...vertices.map(v => v.x)),
        maxX = Math.max(...vertices.map(v => v.x)),
        minY = Math.min(...vertices.map(v => v.y)),
        maxY = Math.max(...vertices.map(v => v.y));

    ctx.canvas.width = maxX - minX;
    ctx.canvas.height = maxY - minY;

    ctx.beginPath();
    if (isRectangle) {
        ctx.rect(0, 0, maxX - minX, maxY - minY);
    } else {
        ctx.moveTo(vertices[0].x - minX, vertices[0].y - minY);
        vertices.forEach(v => ctx.lineTo(v.x - minX, v.y - minY));
        ctx.closePath();
    }
    ctx.clip();
    ctx.drawImage(image, minX, minY, maxX - minX, maxY - minY, 0, 0, maxX - minX, maxY - minY);
}

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
