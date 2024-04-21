document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('polygonCanvas');
    const ctx = canvas.getContext('2d');
    const image = new Image();

    // Set the source to your image path
    image.src = 'pages/page-16.jpg';
    image.onload = function() {
        // Adjust the canvas size to the image size
        canvas.width = image.width;
        canvas.height = image.height;

        // First draw the image
        ctx.drawImage(image, 0, 0);

        // Define the polygon coordinates
        const polygon = [
            {x: 182, y: 679}, {x: 160, y: 690}
        ];

        // Set composite mode to 'destination-in' to keep only the pixels that overlap both the existing canvas and the new path
        ctx.globalCompositeOperation = 'destination-in';

        // Draw the polygon path
        ctx.beginPath();
        ctx.moveTo(polygon[0].x, polygon[0].y);
        polygon.forEach((point, index) => {
            ctx.lineTo(point.x, point.y);
        });
        ctx.closePath();
        ctx.fill();

        // Reset composite mode to default
        ctx.globalCompositeOperation = 'source-over';
    };
});
