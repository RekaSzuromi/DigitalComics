let currentPanelUrl = '';
let currentEmotionUrl = '';
let currentImagePath = '';

document.addEventListener('DOMContentLoaded', function() {
    // Initially hide the download button since no comic is selected
    document.getElementById('downloadButton').style.display = 'none';
    document.getElementById('next').addEventListener('click', () => navigate(1));
    document.getElementById('prev').addEventListener('click', () => navigate(-1));
});

function loadComicData(comicName) {
    let currentPanelUrl = `./${comicName}_panel_data.json`;
    let currentImagePath = `./${comicName}_pages/`;

    fetch(currentPanelUrl).then(response => response.json())
    .then(panelData => {
        clearExistingPanels();
        loadPanels(panelData, currentImagePath);
        document.getElementById('downloadButton').style.display = 'block';
    }).catch(error => {
        console.error('Error fetching data for ' + comicName + ':', error);
    });
}

function clearExistingPanels() {
    // Remove all existing panel containers
    const existingContainer = document.querySelector('.panel-container');
    if (existingContainer) {
        existingContainer.parentNode.removeChild(existingContainer);
    }
}

function loadPanels(panelData, imagePath) {
    // Sort panels by ID
    panelData.sort((a, b) => parseInt(a.ID) - parseInt(b.ID));
    window.currentPanelIndex = 0;
    window.panelData = panelData;
    window.imagePath = imagePath;

    // Create a container for the panel and navigation
    const container = document.createElement('div');
    container.className = 'panel-container';
    document.body.appendChild(container);

    displayPanel(window.currentPanelIndex);
}

function displayPanel(index) {
    const container = document.querySelector('.panel-container');
    container.innerHTML = '';  // Clear previous content

    let canvas = document.createElement('canvas');
    canvas.id = `panelCanvas-${window.panelData[index].ID}`;
    container.appendChild(canvas);

    let ctx = canvas.getContext('2d');
    let image = new Image();
    image.src = `${window.imagePath}page-${window.panelData[index]['Page Number']}.jpg`;

    image.onload = () => {
        let vertices = formatVertices(window.panelData[index]['Panel Region Vertices']);
        drawPanel(ctx, canvas, image, vertices, vertices.length === 2);
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
    const newIndex = window.currentPanelIndex + direction;
    if (newIndex >= 0 && newIndex < window.panelData.length) {
        window.currentPanelIndex = newIndex;
        displayPanel(window.currentPanelIndex);
    }
}
