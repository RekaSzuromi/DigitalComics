// Function to draw the panel on the canvas, adjusted to set canvas size dynamically and without outline
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

function processPanelData(panelData, emotionData) {
    let emotionAssociations = [];

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

            let associatedTaxonomyPaths = [];
            emotionData.forEach(emotion => {
                if (emotion['Page Number'] === panel['Page Number']) {
                    let emotionVertices = emotion['Emotion Region Vertices']
                        .match(/\((\d+,\d+)\)/g)
                        .map(s => s.replace(/[()]/g, '').split(',').map(Number))
                        .map(([x, y]) => ({x, y}));

                    let countInside = emotionVertices.reduce((count, vertex) => count + pointInPolygon(vertex, panelVertices), 0);

                    if (countInside > emotionVertices.length / 2) {
                        associatedTaxonomyPaths.push(emotion['Taxonomy Path']);
                    }
                }
            });

            if (associatedTaxonomyPaths.length) {
                emotionAssociations.push({
                    panelId: `panelCanvas-${index}`,
                    taxonomyPaths: associatedTaxonomyPaths
                });
            }
        };
    });

    // Optionally: output to console or send to server
    console.log(emotionAssociations);
    // Here you can also send this data to a server or save it as a file depending on your environment
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
