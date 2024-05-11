let currentPanelUrl = '';
let currentEmotionUrl = '';
let currentImagePath = '';

document.addEventListener('DOMContentLoaded', function() {
    // Initially hide the download button since no comic is selected
    document.getElementById('downloadButton').style.display = 'none';
});

function loadComicData(comicName) {
    currentPanelUrl = `./${comicName}_panel_data.json`;
    currentEmotionUrl = `./${comicName}_emotion_data.json`;
    currentImagePath = `./${comicName}_pages/`; 

    Promise.all([
        fetch(currentPanelUrl).then(response => response.json()),
        fetch(currentEmotionUrl).then(response => response.json())
    ]).then(([panelData, emotionData]) => {
        clearExistingPanels();
        loadPanels(panelData, currentImagePath);
        document.getElementById('downloadButton').style.display = 'block'; // Show the download button now
        document.getElementById('downloadButton').onclick = () => {
            const associations = createAssociations(panelData, emotionData);
            downloadJSON(associations, `${comicName}_emotion_associations.json`);
        };
    }).catch(error => {
        console.error('Error fetching data for ' + comicName + ':', error);
    });
}

function clearExistingPanels() {
    const existingCanvas = document.querySelectorAll('canvas');
    existingCanvas.forEach(canvas => canvas.parentNode.removeChild(canvas));
}

function loadPanels(panelData, currentImagePath) {
    // Sort panelData by ID before creating and displaying panels
    panelData.sort((a, b) => parseInt(a.id) - parseInt(b.id));

    panelData.forEach(panel => {
        let canvas = document.createElement('canvas');
        canvas.id = `panelCanvas-${panel.id}`;  // Use panel id for identification
        canvas.style.marginBottom = "20px";  // Adds space between each canvas
        document.body.appendChild(canvas);

        let ctx = canvas.getContext('2d');
        let image = new Image();
        image.src = `${currentImagePath}page-${panel['Page Number']}.jpg`;
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
        let isPanelRectangle = panelVertices.length === 2; // Check if panel is a rectangle

        emotionData.forEach(emotion => {
            if (emotion['Page Number'] === panel['Page Number']) {
                let emotionVertices = formatVertices(emotion['Emotion Region Vertices']);

                let isOverlap = isPanelRectangle ? 
                    rectangleContainsPolygon(panelVertices, emotionVertices) :
                    polygonContainsPolygon(panelVertices, emotionVertices);

                if (isOverlap) {
                    // Filter based on taxonomy path
                    if (/^VLT: Semantics: Emotion \(v\.\d\) \/ (Valence|Emotion) \//.test(emotion['Taxonomy Path'])) {
                    allEmotionAssociations.push({
                        panelId: panel['ID'],  // Using 'ID' field
                        emotionId: emotion['ID'],  // Using 'ID' field
                        taxonomyPath: emotion['Taxonomy Path']
                    });
                }
                }
            }
        });
    });

    return allEmotionAssociations;
}


function rectangleContainsPolygon(rectangleVertices, polygonVertices) {
    let [minRect, maxRect] = rectangleVertices;
    let rectangle = {
        minX: Math.min(minRect.x, maxRect.x),
        maxX: Math.max(minRect.x, maxRect.x),
        minY: Math.min(minRect.y, maxRect.y),
        maxY: Math.max(minRect.y, maxRect.y)
    };

    let countInside = polygonVertices.reduce((count, vertex) => {
        return count + (vertex.x >= rectangle.minX && vertex.x <= rectangle.maxX &&
                        vertex.y >= rectangle.minY && vertex.y <= rectangle.maxY);
    }, 0);

    return countInside > polygonVertices.length / 2;
}

function polygonContainsPolygon(panelVertices, emotionVertices) {
    let countInside = emotionVertices.reduce((count, vertex) => count + pointInPolygon(vertex, panelVertices), 0);
    return countInside > emotionVertices.length / 2;
}

function formatVertices(vertexString) {
    return vertexString.match(/\((\d+,\d+)\)/g)
                        .map(s => s.replace(/[()]/g, '').split(',').map(Number))
                        .map(([x, y]) => ({x, y}));
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
        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}