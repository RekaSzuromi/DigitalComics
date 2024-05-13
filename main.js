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

const valenceFilters = {
    'Negative': 'brightness(70%) contrast(110%)',
    'Slightly Negative': 'brightness(85%) contrast(105%)',
    'Neutral': 'none',  // No filter for neutral
    'Slightly Positive': 'brightness(115%) contrast(95%)',
    'Positive': 'brightness(130%) contrast(90%)'
};

const emotionVolumes = {
    'Surprise': 0.17,
    'Excitement': 0.11,
    'Amusement': 0.13,
    'Happiness': 0.015,
    'Neutral/None': 0.25,
    'Wonder': 0.016,
    'Pride': 0.2,
    'Fear': 0.5,
    'Rejoicing': 0.2,
    'Sadness': 0.14,
    'Shame': 0.13,
    'Guilt': 0.2,
    'Anger': 0.016,
    'Relief': 0.12,
    'Embarrassment': 0.2,
    'Love': 0.017
};

let ambientEnabled = true;  // Global flag to control ambient features
let currentPanelUrl = '';
let currentEmotionUrl = '';
let currentImagePath = '';
let panelData = [];
let emotionAssociations = [];
let currentPanelIndex = 0; // Initialize currentPanelIndex
let currentValence = 'Neutral'; // Default valence


document.addEventListener('DOMContentLoaded', function() {
    // Handle opening the survey modal
    var surveyButton = document.getElementById('surveyButton');
    if (surveyButton) {
        surveyButton.addEventListener('click', function() {
            document.getElementById('surveyModal').style.display = 'block';
        });
    }

    // Handle closing the survey modal
    var closeButton = document.querySelector('.close');  // Adjusted to use `querySelector` for simplicity
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            document.getElementById('surveyModal').style.display = 'none';
        });
    }

    // Handle saving the survey and closing the modal
    var saveButton = document.querySelector('.comic-button'); // Adjusted to use `querySelector` and correct class name
    if (saveButton) {
        saveButton.addEventListener('click', function() {
            saveSurvey();
        });
    }
});

// Define the saveSurvey function
function saveSurvey() {
    console.log('Survey data saved.');
    document.getElementById('surveyModal').style.display = 'none';
    // You can add more logic here to actually process the survey data as needed
}


document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    document.getElementById('downloadButton').style.display = 'none';  // Ensure button is hidden on load

    document.getElementById('backButton').addEventListener('click', function() {
        // Hide comic navigation and content elements
        document.querySelector('.button-container').style.display = 'flex';
        document.querySelector('h1').style.display = 'block';
        document.querySelector('p').style.display = 'block';
        document.getElementById('panelDisplayContainer').innerHTML = '';
        document.getElementById('prev').style.display = 'none';
        document.getElementById('next').style.display = 'none';
        document.getElementById('surveyButton').style.display = 'none';
        this.style.display = 'none'; // Hide the back button

        // Stop the audio playback
        stopAudio();

        // Reset the background color to default
        document.documentElement.style.setProperty('--emotion-color', 'rgba(255, 255, 255, 0)');

        // Disable the cursor effect by setting currentValence to 'Neutral'
        currentValence = 'Neutral';
        var cursorCircle = document.getElementById('cursorCircle');
        cursorCircle.style.visibility = 'hidden';
    });
});

document.addEventListener('mousemove', function(e) {
    var circle = document.getElementById('cursorCircle');
    circle.style.left = e.clientX + 'px';
    circle.style.top = e.clientY + 'px';
    // Only make the circle visible if the valence is not neutral
    circle.style.visibility = (currentValence === 'Neutral') ? 'hidden' : 'visible';
});


function setupNavigation() {
    document.getElementById('downloadButton').style.display = 'none';
    document.getElementById('next').addEventListener('click', () => navigate(1));
    document.getElementById('prev').addEventListener('click', () => navigate(-1));
}

function loadComicData(comicName, enableAmbient) {
    ambientEnabled = enableAmbient;  // Set the global flag based on user choice
    stopAudio();  // Stop any playing audio first

    currentPanelUrl = `./${comicName}_panel_data.json`;
    currentImagePath = `./${comicName}_pages/`;
    let emotionAssociationsUrl = `./${comicName}_emotion_associations.json`;

    Promise.all([
        fetch(currentPanelUrl).then(response => response.json()),
        fetch(emotionAssociationsUrl).then(response => response.json())
    ])
    .then(([data, associations]) => {
        if (comicName === 'comic1') {
            panelData = data.filter(panel => panel['Page Number'] >= 7 && panel['Page Number'] <= 16);
        } else if (comicName === 'comic2') {
            panelData = data.filter(panel => panel['Page Number'] <= 16);
        } else {
            panelData = data; // For other comics, no filtering applied
        }
        emotionAssociations = ambientEnabled ? associations : [];  // Load or ignore emotions

        currentPanelIndex = 0;
        displayPanel(currentPanelIndex);
        handleAudioForCurrentPanel();
        document.getElementById('downloadButton').style.display = ambientEnabled ? 'block' : 'none';
        showNavigationButtons();
        document.querySelector('.button-container').style.display = 'none';
        document.querySelector('h1').style.display = 'none';
        document.querySelector('p').style.display = 'none';
        document.getElementById('backButton').style.display = 'block';
    })
    .catch(error => {
        console.error('Error fetching data:', error);
    });
}

function showNavigationButtons() {
    document.getElementById('prev').style.display = 'inline-block';  // Show the previous button
    document.getElementById('next').style.display = 'inline-block';  // Show the next button
}

function displayPanel(index) {
    const panel = panelData[index];
    const container = document.getElementById('panelDisplayContainer');
    container.innerHTML = '';  // Clear previous content

    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    let image = new Image();

    image.onload = () => {
        let vertices = formatVertices(panel['Panel Region Vertices']);
        drawPanel(ctx, canvas, image, vertices, vertices.length === 2);
        container.appendChild(canvas);

        const valence = getPanelValence(index) || 'Neutral';  // Default to 'Neutral' if undefined
        if (ambientEnabled) {
            canvas.style.filter = valenceFilters[valence];
            updateBackgroundColor(panel.ID);
            updateCursorCircle(valence);
        }
    };

    image.src = `${currentImagePath}page-${panel['Page Number']}.jpg`;
}


function updateBackgroundColor(panelId) {
    if (!ambientEnabled) return;  // Skip updating background if ambient is disabled
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);  // Clear the canvas for new drawing

    // Calculate the bounds of the polygon/rectangle
    let minX = Math.min(...vertices.map(v => v.x));
    let maxX = Math.max(...vertices.map(v => v.x));
    let minY = Math.min(...vertices.map(v => v.y));
    let maxY = Math.max(...vertices.map(v => v.y));

    // Set the canvas size to fit the polygon/rectangle
    canvas.width = maxX - minX;
    canvas.height = maxY - minY;

    ctx.beginPath();
    if (isRectangle) {
        // Draw rectangle if vertices define a rectangle
        ctx.rect(0, 0, maxX - minX, maxY - minY);
    } else {
        // Draw polygon if vertices define a polygon
        ctx.moveTo(vertices[0].x - minX, vertices[0].y - minY);
        vertices.forEach((v, index) => {
            ctx.lineTo(v.x - minX, v.y - minY);
        });
        ctx.closePath();
    }
    ctx.clip();  // Clip the context to the shape

    // Draw the image within the clipped region
    ctx.drawImage(image, minX, minY, maxX - minX, maxY - minY, 0, 0, maxX - minX, maxY - minY);
}

function navigate(direction) {
    if (direction === 1 && currentPanelIndex === panelData.length - 1) {
        // This condition checks if it's the last panel and direction is 'next'
        displayEndScreen();
    } else {
        // Handle normal navigation
        currentPanelIndex += direction;
        if (currentPanelIndex >= panelData.length) {
            currentPanelIndex = 0;  // Wrap around to the first panel
        }
        if (currentPanelIndex < 0) {
            currentPanelIndex = panelData.length - 1; // Wrap around to the last panel
        }
        document.getElementById('next').style.display = 'inline-block'; // Ensure the next button is visible
        displayPanel(currentPanelIndex);
        handleAudioForCurrentPanel();
    }
}

function displayEndScreen() {
    const container = document.getElementById('panelDisplayContainer');
    container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100vh;"><h2>End of Comic - Time for Questions!</h2></div>';

    stopAudio();  // Stop any playing audio
    // Disable the cursor effect by setting currentValence to 'Neutral'
    currentValence = 'Neutral';
    var cursorCircle = document.getElementById('cursorCircle');
    cursorCircle.style.visibility = 'hidden';

    document.getElementById('surveyButton').style.display = 'block'; // Show the survey button
    document.getElementById('next').style.display = 'none'; // Hide the next button
    document.documentElement.style.setProperty('--emotion-color', 'rgba(255, 255, 255, 0)'); // Reset background color
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
            return match[1].trim();  // Return the matched valence
        }
    }
    return 'Neutral';  // Return 'Neutral' if no valid valence is found
}

function updateCursorCircle(valence) {
    if (!ambientEnabled) {
        document.getElementById('cursorCircle').style.visibility = 'hidden';
        return;
    }
    const cursorCircle = document.getElementById('cursorCircle');
    currentValence = valence; // Update global valence variable
    switch (valence) {
        case 'Negative':
            cursorCircle.style.backgroundImage = "radial-gradient(circle at center, rgba(115, 105, 105, 0.418) 0%, rgba(255, 255, 0, 0.01) 40%)";
            break;
        case 'Slightly Negative':
            cursorCircle.style.backgroundImage = "radial-gradient(circle at center, rgba(207, 200, 200, 0.418) 0%, rgba(255, 255, 0, 0.01) 40%)";
            break;
        case 'Neutral':
            cursorCircle.style.visibility = 'hidden';
            break;
        case 'Slightly Positive':
            cursorCircle.style.backgroundImage = "radial-gradient(circle at center, rgba(214, 250, 53, 0.418) 0%, rgba(255, 255, 0, 0.01) 40%)";
            break;
        case 'Positive':
            cursorCircle.style.backgroundImage = "radial-gradient(circle at center, rgba(255, 255, 0, 0.418) 0%, rgba(255, 255, 0, 0.01) 40%)";
            break;
        default:
            cursorCircle.style.visibility = 'hidden'; // Handle no valence data like 'Neutral'
            currentValence = 'Neutral'; // Reset to neutral if undefined
            break;
    }
}

function handleAudioForCurrentPanel() {
    if (!ambientEnabled) return;  // Skip audio handling if ambient is disabled
    const emotion = getPanelEmotion(currentPanelIndex);
    if (emotion) {
        const wavFile = `./music/${emotion}.wav`;
        const mp3File = `./music/${emotion}.mp3`;

        fetch(wavFile)
            .then(response => {
                if (response.ok) {
                    playAudio(wavFile, emotion);
                } else {
                    // WAV not available, try MP3 file
                    return fetch(mp3File).then(response => {
                        if (response.ok) {
                            playAudio(mp3File, emotion);
                        } else {
                            console.error(`No valid audio file found for ${emotion}`);
                            stopAudio();  // No valid file found, stop any currently playing audio
                        }
                    });
                }
            })
            .catch(error => {
                console.error(`Error accessing audio file for ${emotion}: ${error}`);
                stopAudio(); // Ensure to stop any currently playing audio if files are missing
            });
    } else {
        console.log("No emotion available to determine audio, stopping playback.");
        stopAudio(); // Stop the audio if there's no emotion associated
    }
}

function playAudio(audioFilePath, emotion) {
    const audioPlayer = document.getElementById('audioPlayer');
    if (!audioPlayer) {
        console.error("Audio player element not found");
        return;
    }

    // Retrieve and log the volume setting for the current emotion
    const volumeSetting = emotionVolumes[emotion] || 0.5;  // Ensure you have a default volume level
    console.log(`Playing ${emotion} at volume: ${volumeSetting}, file: ${audioFilePath}`);

    audioPlayer.volume = volumeSetting;
    audioPlayer.src = audioFilePath;

    audioPlayer.load();  // Important to reload the new source
    audioPlayer.play().then(() => {
        console.log("Audio playback started successfully");
    }).catch(error => {
        console.error(`Failed to play audio: ${error}. File: ${audioFilePath}`);
    });
}

function stopAudio() {
    const audioPlayer = document.getElementById('audioPlayer');
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;  // Reset the time
        console.log("Audio playback stopped and reset.");
    }
}