document.addEventListener('DOMContentLoaded', function() {
    Promise.all([
        fetch('./panel_data.json').then(response => response.json()),
        fetch('./emotion_data.json').then(response => response.json())
    ]).then(([panelData, emotionData]) => {
        loadPanels(panelData);
        document.getElementById('downloadButton').addEventListener('click', () => {
            const associations = createAssociations(panelData, emotionData);
            downloadJSON(associations, 'emotion_associations.json');
        });
    }).catch(error => {
        console.error('Error fetching data:', error);
    });
});

function loadPanels(panelData) {
    panelData.forEach(panel => {
        let canvas = document.createElement('canvas');
        canvas.id = `panelCanvas-${panel.id}`; // Assume 'id' is part of the panel data
        canvas.style.marginBottom = "20px"; // Adds space between each canvas
        document.body.appendChild(canvas);

        let ctx = canvas.getContext('2d');
        let image = new Image();
        image.src = `pages/page-${panel['Page Number']}.jpg`;
        image.onload = () => {
            let vertices = formatVertices(panel['Panel Region Vertices']);
            drawPanel(ctx, image, vertices, vertices.length === 2);
        };
    });
}

function createAssociations(panelData, emotionData) {
    let allEmotionAssociations = [];

    panelData.forEach(panel => {
        let panelVertices = formatVertices(panel['Panel Region Vertices']);

        emotionData.forEach(emotion => {
            if (emotion['Page Number'] === panel['Page Number']) {
                let emotionVertices = formatVertices(emotion['Emotion Region Vertices']);

                let countInside = emotionVertices.reduce((count, vertex) => count + pointInPolygon(vertex, panelVertices), 0);

                if (countInside > emotionVertices.length / 2) {
                    allEmotionAssociations.push({
                        panelId: panel['ID'],
                        emotionId: emotion['ID'],
                        taxonomyPath: emotion['Taxonomy Path']
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
