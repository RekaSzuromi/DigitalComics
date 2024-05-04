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
let panelData = [];
let emotionAssociations = [];

document.addEventListener('DOMContentLoaded', function() {
    // Initially hide the download button since no comic is selected
    document.getElementById('downloadButton').style.display = 'none';
    document.getElementById('next').addEventListener('click', () => navigate(1));
    document.getElementById('prev').addEventListener('click', () => navigate(-1));
});

function loadComicData(comicName) {
    currentPanelUrl = `./${comicName}_panel_data.json`;
    currentImagePath = `./${comicName}_pages/`;
    let emotionAssociationsUrl = `./${comicName}_emotion_associations.json`;

    Promise.all([
        fetch(currentPanelUrl).then(response => response.json()),
        fetch(emotionAssociationsUrl).then(response => response.json())
    ]).then(([data, associations]) => {
        panelData = data;
        emotionAssociations = associations;
        displayPanel(0); // Display the first panel initially
        document.getElementById('downloadButton').style.display = 'block';
    }).catch(error => {
        console.error('Error fetching data:', error);
    });
}

function displayPanel(index) {
    const panel = panelData[index];
    const container = document.getElementById('panelDisplayContainer');
    container.innerHTML = '';  // Clear previous content

    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    let image = new Image();
    image.src = `${currentImagePath}page-${panel['Page Number']}.jpg`;

    image.onload = () => {
        let vertices = formatVertices(panel['Panel Region Vertices']);
        drawPanel(ctx, canvas, image, vertices, vertices.length === 2);
        container.appendChild(canvas);
        updateBackgroundColor(panel.ID);
    };
}

function updateBackgroundColor(panelId) {
    const associatedEmotions = emotionAssociations.filter(e => e.panelId === panelId);
    let color = 'transparent'; // Default color if no match found

    for (let emotion of associatedEmotions) {
        const match = emotion.taxonomyPath.match(/Emotion \(v\.\d\) \/ Emotion \/ (.+)/);
        if (match && emotionColors[match[1]]) {
            color = emotionColors[match[1]]; // Set the background color based on the emotion
            break; // Exit once a match is found
        }
    }

    document.body.style.backgroundColor = color;
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


function navigate(delta) {
    currentPanelIndex += delta;
    if (currentPanelIndex >= panelData.length) currentPanelIndex = 0;
    if (currentPanelIndex < 0) currentPanelIndex = panelData.length - 1;
    displayPanel(currentPanelIndex);
}
