const emotionColors = {
    'Surprise': '#8F00FF',
    'Excitement': '#FF0000',
    'Amusement': '#FFFF00',
    'Happiness': '#FFFD01',
    'Neutral/None': '#808080',
    'Wonder': '#87CEEB',
    'Pride': '#9400D3',
    'Fear': '#000000',
    'Rejoicing': '#FFA500',
    'Sadness': '#00008B',
    'Shame': '#800000',
    'Guilt': '#DC143C',
    'Anger': '#FF0000',
    'Relief': '#ADD8E6',
    'Embarrassment': '#FFB6C1',
    'Love': '#FF1493'
};

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

 /*

function clearExistingPanels() {
    const existingCanvas = document.querySelectorAll('canvas');
    existingCanvas.forEach(canvas => canvas.parentNode.removeChild(canvas));

    // Remove all existing taxonomy text divs
    const existingTextDivs = document.querySelectorAll('.taxonomy-text');
    existingTextDivs.forEach(div => div.parentNode.removeChild(div));
}
*/
function clearExistingPanels() {
    // Remove all existing containers, which includes panels and boxes
    const existingContainers = document.querySelectorAll('.panel-container');
    existingContainers.forEach(container => container.parentNode.removeChild(container));

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

        const leftBox = createBox();
        container.appendChild(leftBox);

        let canvas = document.createElement('canvas');
        canvas.id = `panelCanvas-${panel.ID}`;
        container.appendChild(canvas);

        const rightBox = createBox();
        container.appendChild(rightBox);

        let ctx = canvas.getContext('2d');
        let image = new Image();
        image.src = `${imagePath}page-${panel['Page Number']}.jpg`;
        image.onload = () => {
            let vertices = formatVertices(panel['Panel Region Vertices']);
            let isRectangle = vertices.length === 2;
            drawPanel(ctx, canvas, image, vertices, isRectangle);

            [leftBox, rightBox].forEach(box => {
                box.style.height = `${canvas.height}px`; // Dynamically set the height
            });

            let associatedTexts = emotionAssociations.filter(assoc => parseInt(assoc.panelId) === parseInt(panel.ID));
            if (associatedTexts.length > 0) {
                let textContent = associatedTexts.map(assoc => assoc.taxonomyPath).join(', ');
                displayTaxonomyPaths(textContent, container, leftBox, rightBox); // Pass boxes along with the container
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


/*
function displayTaxonomyPaths(text, parentContainer, leftBox, rightBox) {
    if (!text) return; // No text to display if empty

    // Define the regex pattern to match the specified taxonomy path formats
    const regex = /VLT: Semantics: Emotion \(v\.\d\) \/ (Valence|Emotion) \/ (.*)/;

    // Split the text into individual taxonomy paths and filter them
    let filteredTexts = text.split(', ').filter(path => regex.test(path));
    let displayedText = filteredTexts.join(', '); // Join the filtered texts for display

    // Create and append the text div if there is any filtered text
    if (displayedText.length > 0) {
        let textDiv = document.createElement('div');
        textDiv.className = 'taxonomy-text';
        textDiv.textContent = displayedText; // Display the filtered taxonomy text
        textDiv.style.width = "100%";
        textDiv.style.textAlign = "center";
        textDiv.style.marginTop = "10px";
        textDiv.style.marginBottom = "20px";
        parentContainer.after(textDiv); 
    }

    // Process each filtered text to determine the color of the boxes
    let colors = filteredTexts.map(text => {
        let match = text.match(regex);
        return match && match[2] ? emotionColors[match[2].trim()] || 'transparent' : 'transparent';
    });

    // Determine the most frequent color to set, or default to transparent if none found
    let color = colors.length ? mostFrequentColor(colors) : 'transparent';
    leftBox.style.backgroundColor = color;
    rightBox.style.backgroundColor = color;
}
*/

function displayTaxonomyPaths(text, parentContainer, leftBox, rightBox) {
    if (!text) return; // No text to display if empty

    let textDiv = document.createElement('div');
    textDiv.className = 'taxonomy-text';
    textDiv.textContent = text;
    textDiv.style.width = "100%";
    textDiv.style.textAlign = "center";
    textDiv.style.marginTop = "10px";
    textDiv.style.marginBottom = "20px";
    parentContainer.after(textDiv);

    const regex = /VLT: Semantics: Emotion \(v\.\d\) \/ (Valence|Emotion) \/ (.*)/;
    let matches = text.match(regex);
    let color = 'rgba(128, 128, 128, 0.5)'; // Default gray with reduced opacity

    if (matches && matches.length > 2) {
        let emotion = matches[2].split(' / ')[1]; // Assumes the format "Emotion / actual_emotion"
        if (emotionColors[emotion]) {
            color = `rgba(${hexToRgb(emotionColors[emotion]).join(',')}, 0.5)`; // Convert hex to RGB and apply transparency
        }
    }

    setBoxBackground(leftBox, color, true);
    setBoxBackground(rightBox, color, false);
}

// Helper to convert HEX to RGB
function hexToRgb(hex) {
    let r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
}

// Helper function to find the most frequent color in an array
function mostFrequentColor(colors) {
    let frequency = {};
    let maxFreq = 0;
    let mostFrequent = 'transparent';

    colors.forEach(color => {
        if (frequency[color]) {
            frequency[color]++;
        } else {
            frequency[color] = 1;
        }

        if (frequency[color] > maxFreq) {
            maxFreq = frequency[color];
            mostFrequent = color;
        }
    });

    return mostFrequent;
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
function drawPanel(ctx, canvas, image, vertices, isRectangle) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Setup path for clipping
    ctx.beginPath();
    ctx.moveTo(vertices[0].x - vertices[0].x, vertices[0].y - vertices[0].y); // Normalize to start at (0,0)
    vertices.forEach((vertex, index) => {
        ctx.lineTo(vertex.x - vertices[0].x, vertex.y - vertices[0].y);
    });
    ctx.closePath();
    if (!isRectangle) {
        ctx.clip(); // Apply clipping path only if it's not a rectangle
    }

    // Adjust canvas size to fit the clipped region
    let minX = Math.min(...vertices.map(v => v.x));
    let maxX = Math.max(...vertices.map(v => v.x));
    let minY = Math.min(...vertices.map(v => v.y));
    let maxY = Math.max(...vertices.map(v => v.y));
    canvas.width = maxX - minX;
    canvas.height = maxY - minY;
    ctx.drawImage(image, minX, minY, maxX - minX, maxY - minY, 0, 0, canvas.width, canvas.height);
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

function setBoxBackground(box, color, isLeftBox) {
    if (isLeftBox) {
        // For the left box, fade from solid to transparent from left to right
        box.style.background = `linear-gradient(to right, ${color} 0%, ${color} 50%, transparent 100%)`;
    } else {
        // For the right box, fade from solid to transparent from right to left
        box.style.background = `linear-gradient(to left, ${color} 0%, ${color} 50%, transparent 100%)`;
    }
}
