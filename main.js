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
            {x: 37, y: 1208}, {x: 59, y: 1214}, {x: 75, y: 1198}, {x: 109, y: 1210}, 
            {x: 137, y: 1196}, {x: 225, y: 1163}, {x: 299, y: 1148}, {x: 347, y: 1151}, 
            {x: 397, y: 1165}, {x: 336, y: 1112}, {x: 266, y: 1081}, {x: 182, y: 1061}, 
            {x: 108, y: 1061}, {x: 55, y: 1077}, {x: 35, y: 1085}, {x: 87, y: 1052}, 
            {x: 135, y: 1035}, {x: 192, y: 1022}, {x: 259, y: 1028}, {x: 330, y: 1052}, 
            {x: 391, y: 1086}, {x: 466, y: 1126}, {x: 524, y: 1148}, {x: 592, y: 1148}, 
            {x: 679, y: 1140}, {x: 758, y: 1166}, {x: 699, y: 1108}, {x: 631, y: 1039}, 
            {x: 558, y: 996}, {x: 492, y: 973}, {x: 413, y: 972}, {x: 358, y: 983}, 
            {x: 464, y: 958}, {x: 561, y: 954}, {x: 664, y: 983}, {x: 726, y: 1034}, 
            {x: 772, y: 1086}, {x: 798, y: 1123}, {x: 845, y: 1155}, {x: 881, y: 1191}, 
            {x: 900, y: 1230}, {x: 874, y: 1165}, {x: 876, y: 1108}, {x: 845, y: 1028}, 
            {x: 807, y: 984}, {x: 839, y: 1006}, {x: 875, y: 1044}, {x: 899, y: 1122}, 
            {x: 915, y: 1177}, {x: 938, y: 1221}, {x: 967, y: 1254}, {x: 987, y: 1302}, 
            {x: 1002, y: 1357}, {x: 1003, y: 1425}, {x: 35, y: 1423}
        ];

        // Clip the region using 'destination-in' to keep only the pixels that overlap both the existing canvas and the new path
        ctx.globalCompositeOperation = 'destination-in';
        drawPolygon(ctx, polygon, true); // Draw and fill the path for clipping

        // Reset composite mode to default
        ctx.globalCompositeOperation = 'source-over';

        // Draw the red outline of the polygon
        drawPolygon(ctx, polygon, false, true); // Draw the outline in red without filling
    };
});

function drawPolygon(ctx, points, fill = false, outline = false) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(point => {
        ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    if (fill) {
        ctx.fill();
    }
    if (outline) {
        ctx.lineWidth = 3; // Set the line width for the outline
        ctx.strokeStyle = 'red'; // Set the outline color to red
        ctx.stroke(); // Draw the outline
    }
}
