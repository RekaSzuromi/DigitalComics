let currentPanelUrl = '';
let currentEmotionUrl = '';
let currentImagePath = '';
let currentPanelIndex = 0;
let panelData = [];

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('next').addEventListener('click', () => navigate(1));
    document.getElementById('prev').addEventListener('click', () => navigate(-1));
});

function loadComicData(comicName) {
    currentPanelUrl = `./${comicName}_panel_data.json`;
    currentImagePath = `./${comicName}_pages/`;

    fetch(currentPanelUrl).then(response => response.json())
    .then(data => {
        panelData = data;
        currentPanelIndex = 0; // Reset index for new comic
        displayPanel(currentPanelIndex);
        document.getElementById('downloadButton').style.display = 'block';
    }).catch(error => {
        console.error('Error fetching data for ' + comicName + ':', error);
    });
}

function displayPanel(index) {
    const container = document.getElementById('panelDisplayContainer');
    container.innerHTML = '';  // Clear previous content

    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    let image = new Image();
    image.src = `${currentImagePath}page-${panelData[index]['Page Number']}.jpg`;

    image.onload = () => {
        let vertices = formatVertices(panelData[index]['Panel Region Vertices']);
        drawPanel(ctx, canvas, image, vertices, vertices.length === 2);
        container.appendChild(canvas);
    };
}

function formatVertices(vertexString) {
    return vertexString.match(/\((\d+,\d+)\)/g)
        .map(s => s.replace(/[()]/g, '').split(',').map(Number))
        .map(([x, y]) => ({x, y}));
}

function drawPanel(ctx, canvas, image, vertices, isRectangle) {
    let minX = Math.min(...vertices.map(v => v.x));
    let maxX = Math.max(...vertices.map(v => v.x));
    let minY = Math.min(...vertices.map(v => v.y));
    let maxY = Math.max(...vertices.map(v => v.y));

    canvas.width = maxX - minX;
    canvas.height = maxY - minY;

    ctx.drawImage(image, minX, minY, maxX - minX, maxY - minY, 0, 0, canvas.width, canvas.height);
}

function navigate(direction) {
    currentPanelIndex += direction;
    if (currentPanelIndex >= panelData.length) currentPanelIndex = 0;
    if (currentPanelIndex < 0) currentPanelIndex = panelData.length - 1;
    displayPanel(currentPanelIndex);
}
