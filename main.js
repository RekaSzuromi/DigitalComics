const alphaLevel = 0.09  // Easily change this to adjust the transparency globally

const emotionColors = {
    'Surprise': `rgba(143, 0, 255, ${alphaLevel})`,
    'Excitement': `rgba(255, 0, 0, ${alphaLevel})`,
    'Amusement': `rgba(255, 255, 0, ${alphaLevel})`,
    'Happiness': `rgba(255, 253, 1, ${alphaLevel})`,
    'Neutral/None': `rgba(128, 128, 128, ${alphaLevel})`,
    'Wonder': `rgba(135, 206, 235, ${alphaLevel})`,
    'Pride': `rgba(148, 0, 211, ${alphaLevel})`,
    'Fear': `rgba(0, 0, 0, ${alphaLevel})`,
    'Rejoicing': `rgba(255, 165, 0, ${alphaLevel})`,
    'Sadness': `rgba(0, 0, 139, ${alphaLevel})`,
    'Shame': `rgba(128, 0, 0, ${alphaLevel})`,
    'Guilt': `rgba(220, 20, 60, ${alphaLevel})`,
    'Anger': `rgba(255, 0, 0, ${alphaLevel})`,
    'Relief': `rgba(173, 216, 230, ${alphaLevel})`,
    'Embarrassment': `rgba(255, 182, 193, ${alphaLevel})`,
    'Love': `rgba(255, 20, 147, ${alphaLevel})`
};



let currentPanelUrl = '';
let currentEmotionUrl = '';
let currentImagePath = '';
let panelData = [];
let emotionAssociations = [];
let currentPanelIndex = 0; // Initialize currentPanelIndex

document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
});

document.addEventListener('mousemove', function(e) {
    var circle = document.getElementById('cursorCircle');
    circle.style.left = e.clientX + 'px';
    circle.style.top = e.clientY + 'px';
    circle.style.visibility = 'visible';  // Make sure the circle is visible when moving
});

function setupNavigation() {
    document.getElementById('downloadButton').style.display = 'none';
    document.getElementById('next').addEventListener('click', () => navigate(1));
    document.getElementById('prev').addEventListener('click', () => navigate(-1));
}

function loadComicData(comicName) {
    stopAudio();  // Stop any playing audio first

    currentPanelUrl = `./${comicName}_panel_data.json`;
    currentImagePath = `./${comicName}_pages/`;
    let emotionAssociationsUrl = `./${comicName}_emotion_associations.json`;

    Promise.all([
        fetch(currentPanelUrl).then(response => response.json()),
        fetch(emotionAssociationsUrl).then(response => response.json())
    ])
    .then(([data, associations]) => {
        panelData = data;
        emotionAssociations = associations;
        
        currentPanelIndex = 0; // Reset index when loading new comic data
        displayPanel(currentPanelIndex);  // Call displayPanel once data is confirmed loaded
        handleAudioForCurrentPanel(); // Handle audio for the displayed panel
        document.getElementById('downloadButton').style.display = 'block';
    })
    .catch(error => {
        console.error('Error fetching data:', error);
    });
}


function displayPanel(index) {
    const panel = panelData[index];
    if (!panel) {
        console.error("No panel data available");
        return;
    }

    const container = document.getElementById('panelDisplayContainer');
    container.innerHTML = '';  // Clear previous content

    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    let image = new Image();

    image.onload = () => {
        let vertices = formatVertices(panel['Panel Region Vertices']);
        drawPanel(ctx, canvas, image, vertices, vertices.length === 2);
        container.appendChild(canvas);
        updateBackgroundColor(panel.ID);
        const valence = getPanelValence(index);  // Retrieve the valence for the current panel
        updateCursorCircle(valence);  // Update the cursor based on the valence
    };

    image.src = `${currentImagePath}page-${panel['Page Number']}.jpg`;
}


function updateBackgroundColor(panelId) {
    const associatedEmotions = emotionAssociations.filter(e => e.panelId === panelId);
    let defaultColor = 'rgba(255, 255, 255, 0)'; // Default to transparent if no emotion color is found

    // This will hold the final CSS color string
    let gradientColor = defaultColor;

    for (let emotion of associatedEmotions) {
        const match = emotion.taxonomyPath.match(/Emotion \(v\.\d\) \/ Emotion \/ (.+)/);
        if (match && emotionColors[match[1].trim()]) {
            gradientColor = emotionColors[match[1].trim()]; // Use the trimmed emotion key to match colors
            break; // Break after the first match for simplicity
        }
    }

    // Use CSS variable to control background gradient dynamically
    document.documentElement.style.setProperty('--emotion-color', gradientColor);
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
    stopAudio(); // Ensure to stop current audio when navigating panels
    currentPanelIndex += direction;
    if (currentPanelIndex >= panelData.length) currentPanelIndex = 0;
    if (currentPanelIndex < 0) currentPanelIndex = panelData.length - 1;

    displayPanel(currentPanelIndex);
    handleAudioForCurrentPanel();
}



function getPanelEmotion(panelIndex) {
    const panelId = panelData[panelIndex].ID;
    const associatedEmotions = emotionAssociations.filter(e => e.panelId === panelId);
    for (let emotion of associatedEmotions) {
        const match = emotion.taxonomyPath.match(/Emotion \(v\.\d\) \/ Emotion \/ (.+)/);
        if (match && emotionColors[match[1].trim()]) {
            return match[1].trim(); // Return the matched emotion
        }
    }
    return null; // Return null if no valid emotion is found
}

function getPanelValence(panelIndex) {
    const panelId = panelData[panelIndex].ID;
    const associatedValences = emotionAssociations.filter(e => e.panelId === panelId);
    for (let valence of associatedValences) {
        const match = valence.taxonomyPath.match(/Valence \/ (.+)/);
        if (match) {
            return match[1].trim(); // Return the matched valence
        }
    }
    return null; // Return null if no valid valence is found
}

function updateCursorCircle(valence) {
    const cursorCircle = document.getElementById('cursorCircle');
    switch (valence) {
        case 'Negative':
            cursorCircle.style.backgroundImage = "radial-gradient(circle at center, rgba(115, 105, 105, 0.418) 0%, rgba(255, 255, 0, 0.01) 40%)";
            cursorCircle.style.visibility = 'visible';
            break;
        case 'Slightly Negative':
            cursorCircle.style.backgroundImage = "radial-gradient(circle at center, rgba(207, 200, 200, 0.418) 0%, rgba(255, 255, 0, 0.01) 40%)";
            cursorCircle.style.visibility = 'visible';
            break;
        case 'Neutral':
            cursorCircle.style.visibility = 'hidden';
            break;
        case 'Slightly Positive':
            cursorCircle.style.backgroundImage = "radial-gradient(circle at center, rgba(214, 250, 53, 0.418) 0%, rgba(255, 255, 0, 0.01) 40%)";
            cursorCircle.style.visibility = 'visible';
            break;
        case 'Positive':
            cursorCircle.style.backgroundImage = "radial-gradient(circle at center, rgba(255, 255, 0, 0.418) 0%, rgba(255, 255, 0, 0.01) 40%)";
            cursorCircle.style.visibility = 'visible';
            break;
        default:
            cursorCircle.style.visibility = 'hidden';
            break;
    }
}


function handleAudioForCurrentPanel() {
    const emotion = getPanelEmotion(currentPanelIndex);
    if (emotion) {
        playAudio(`./music/${emotion}.wav`);
    } else {
        stopAudio(); // Stop the audio if there's no emotion
    }
}

function playAudio(audioFilePath) {
    var audioPlayer = document.getElementById('audioPlayer');
    audioPlayer.src = audioFilePath;
    audioPlayer.pause();
    audioPlayer.load();

    audioPlayer.play().catch(error => {
        console.log(`No file for emotion: ${audioFilePath.split('/').pop().split('.')[0]}`);
    });
}

function stopAudio() {
    var audioPlayer = document.getElementById('audioPlayer');
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
}