export const createDrawGraph = ({ tracks, trains, gridSize, panOffset, hoveredTrain }) => {
    return (ctx, width, height) => {
        // Background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        ctx.translate(panOffset.x, panOffset.y);

        // Draw tracks
        tracks.forEach(track => {
            const lineWidth = track.type === 'junction' ? 4 : 3;
            ctx.beginPath();
            const endX = track.type === 'junction' ? track.end.x - 7 : track.end.x;
            ctx.moveTo(track.start.x, track.start.y);
            ctx.lineTo(endX, track.end.y);

            // Track colors
            if (track.type === 'main') {
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'; // red
                ctx.shadowColor = ctx.strokeStyle;
            } else {
                ctx.strokeStyle = '#f97316'; // orange
                ctx.shadowColor = ctx.strokeStyle;
            }

            ctx.shadowBlur = 15;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Track labels
            ctx.fillStyle = 'rgba(203, 213, 225, 0.7)';
            ctx.font = '14px sans-serif';
            ctx.textAlign = track.start.x === track.end.x ? 'right' : 'left';
            ctx.fillText(`${track.id}`, track.start.x + (track.start.x === track.end.x ? -5 : 5), track.start.y + 15);
        });

        // Draw trains
        const trainColors = ['#60a5fa', '#facc15', '#f472b6', '#34d399']; // blue, yellow, pink, green
        trains.forEach((train, index) => {
            const track = tracks.find(t => t.id === train.trackId);
            if (!track) return;

            const trainX = track.start.x + (track.end.x - track.start.x) * train.position;
            const trainY = track.start.y + (track.end.y - track.start.y) * train.position;

            ctx.beginPath();
            ctx.arc(trainX, trainY, 8, 0, 2 * Math.PI);

            // Train color
            const trainColor = trainColors[index % trainColors.length];
            ctx.fillStyle = trainColor;
            ctx.shadowColor = trainColor;
            
            ctx.shadowBlur = 20;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Hover info
            if (hoveredTrain && hoveredTrain.id === train.id) {
                const boxWidth = 150;
                const boxHeight = 45;
                const boxPadding = 5;
                const boxX = trainX + 10;
                const boxY = trainY - boxHeight / 2;

                ctx.fillStyle = 'rgba(50,50,50,0.8)';
                ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

                ctx.fillStyle = '#fff';
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(`${train.name}`, boxX + boxPadding, boxY + 15);
                ctx.fillText(`Speed: ${(train.speed * 1000).toFixed(2)}`, boxX + boxPadding, boxY + 30);
            }
        });

        ctx.restore();

        // Footer text
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
    };
};