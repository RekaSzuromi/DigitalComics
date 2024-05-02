let currentPanelUrl = '';
let currentEmotionUrl = '';
let currentImagePath = '';

document.addEventListener('DOMContentLoaded', function() {
    // Initially hide the download button since no comic is selected
    document.getElementById('downloadButton').style.display = 'none';
});

function loadComicData(comicName) {
    let currentPanelUrl = `./${comicName}_panel_data.json`;
    let currentEmotionUrl = `./${comicName}_emotion_data.json`;
    let emotionAssociationsUrl = `./${comicName}_emotion_associations.json`; // URL for the associations JSON
    let currentImagePath = `./${comicName}_pages/`;

    Promise.all([
        fetch(currentPanelUrl).then(response => response.json()),
        fetch(currentEmotionUrl).then(response => response.json()),
        fetch(emotionAssociationsUrl).then(response => response.json()) // Fetch the associations JSON
    ]).then(([panelData, emotionData, emotionAssociations]) => {
        clearExistingPanels();
        loadPanels(panelData, currentImagePath, emotionAssociations); // Pass emotionAssociations to loadPanels
        document.getElementById('downloadButton').style.display = 'block';
    }).catch(error => {
        console.error('Error fetching data for ' + comicName + ':', error);
    });
}



function clearExistingPanels() {
    const existingCanvas = document.querySelectorAll('canvas');
    existingCanvas.forEach(canvas => canvas.parentNode.removeChild(canvas));

    // Remove all existing taxonomy text divs
    const existingTextDivs = document.querySelectorAll('.taxonomy-text');
    existingTextDivs.forEach(div => div.parentNode.removeChild(div));
}

function loadPanels(panelData, imagePath, emotionAssociations) {
    panelData.sort((a, b) => parseInt(a.ID) - parseInt(b.ID));

    panelData.forEach(panel => {
        const container = document.createElement('div');
        container.className = 'panel-container';
        document.body.appendChild(container);

        // Create and append the left box
        const leftBox = createBox();
        container.appendChild(leftBox);

        // Canvas for the panel, without resizing
        let canvas = document.createElement('canvas');
        canvas.id = `panelCanvas-${panel.ID}`;
        container.appendChild(canvas);

        // Create and append the right box
        const rightBox = createBox();
        container.appendChild(rightBox);

        let ctx = canvas.getContext('2d');
        let image = new Image();
        image.src = `${imagePath}page-${panel['Page Number']}.jpg`;
        image.onload = () => {
            // Setup canvas dimensions directly based on image dimensions
            canvas.width = image.width;
            canvas.height = image.height;
        
            // Get vertices and determine if it is a rectangle
            let vertices = formatVertices(panel['Panel Region Vertices']);
            let isRectangle = vertices.length === 2;
        
            // Use drawPanel to handle the drawing and clipping based on vertices
            drawPanel(ctx, image, vertices, isRectangle);
        
            // Setup boxes height to match the panel
            [leftBox, rightBox].forEach(box => {
                box.style.height = `${canvas.height}px`; // Match the height with the clipped panel
            });
        
            // Display associated taxonomy paths if any
            let associatedTexts = emotionAssociations.filter(assoc => parseInt(assoc.panelId) === parseInt(panel.ID));
            if (associatedTexts.length > 0) {
                let textContent = associatedTexts.map(assoc => assoc.taxonomyPath).join(', ');
                displayTaxonomyPaths(textContent);
            }
        };
    });
}

function createBox() {
    const box = document.createElement('div');
    box.className = 'box';
    return box;
}
/*
function adjustPanelAndBoxes(canvas, leftBox, rightBox, image) {
    const viewportHeight = window.innerHeight;
    const panelHeight = viewportHeight * 0.7;
    const boxWidth = window.innerWidth * 0.1;

    canvas.style.height = `${panelHeight}px`;
    canvas.style.width = `${window.innerWidth * 0.8}px`; // Assume canvas takes 80% of viewport width
    canvas.height = panelHeight;
    canvas.width = window.innerWidth * 0.8;

    [leftBox, rightBox].forEach(box => {
        box.style.width = `${boxWidth}px`;
        box.style.height = `${panelHeight}px`;
        box.style.backgroundColor = 'red';
    });
}
*/


function displayTaxonomyPaths(text) {
    // Define the regex pattern to match the specified taxonomy path formats
    const regex = /VLT: Semantics: Emotion \(v\.\d\) \/ (Valence|Emotion) \/ .*/;

    // Filter the text based on the regex pattern
    let filteredText = text.split(', ').filter(path => regex.test(path)).join(', ');

    // Only create and display the div if there is filtered text to show
    if (filteredText.length > 0) {
        let textDiv = document.createElement('div');
        textDiv.className = 'taxonomy-text';  // Use this class for easy selection and removal
        textDiv.textContent = filteredText;
        textDiv.style.marginTop = "5px";
        document.body.appendChild(textDiv); // Append directly to the body to ensure it appears in a separate row
    }
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
                    allEmotionAssociations.push({
                        panelId: panel['ID'],  // Using 'ID' field
                        emotionId: emotion['ID'],  // Using 'ID' field
                        taxonomyPath: emotion['Taxonomy Path']
                    });
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
/*
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
*/
function drawPanel(ctx, image, vertices, isRectangle) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear previous drawings

    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    vertices.forEach((v, index) => {
        if (index > 0) ctx.lineTo(v.x, v.y);
    });
    ctx.closePath();

    if (!isRectangle) {
        ctx.clip(); // Apply clipping path only if it's not a rectangle
    }

    ctx.drawImage(image, 0, 0);
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
