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

        // Define the polygon coordinates
        const polygon = [
            {x: 182, y: 679}, {x: 160, y: 690}, {x: 134, y: 725}, {x: 140, y: 767},
            {x: 149, y: 738}, {x: 148, y: 773}, {x: 148, y: 781}, {x: 118, y: 797},
            {x: 109, y: 815}, {x: 113, y: 845}, {x: 116, y: 868}, {x: 123, y: 891},
            {x: 132, y: 914}, {x: 121, y: 953}, {x: 261, y: 949}, {x: 257, y: 921},
            {x: 279, y: 883}, {x: 289, y: 837}, {x: 291, y: 806}, {x: 255, y: 779},
            {x: 261, y: 753}, {x: 258, y: 726}, {x: 269, y: 740}, {x: 267, y: 721},
            {x: 253, y: 697}, {x: 241, y: 689}, {x: 265, y: 691}, {x: 250, y: 681},
            {x: 227, y: 681}, {x: 211, y: 687}
        ];

        // Draw the image
        ctx.drawImage(image, 0, 0);

        // Create clipping path from the polygon
        ctx.beginPath();
        ctx.moveTo(polygon[0].x, polygon[0].y);
        polygon.forEach((point, index) => {
            ctx.lineTo(point.x, point.y);
        });
        ctx.closePath();

        // Clip the region
        ctx.clip();

        // Clear the canvas outside the clipped region by drawing only the clipped image
        ctx.clearRect(0, 0, canvas.width, canvas.height);  // Clears the whole canvas
        ctx.drawImage(image, 0, 0);  // Redraws the image within the clipping mask
    };
});
