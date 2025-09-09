// mouseHandlers.js
export const createMouseHandlers = ({
    setIsPanning,
    setStartPan,
    setPanOffset,
    setHoveredTrain,
    setGridSize,
    trains,
    tracks,
    isPanning,
    startPan,
    panOffset
}) => {
    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsPanning(true);
        setStartPan({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
        setIsPanning(false);
    };

    const handleMouseMove = (e) => {
        if (isPanning) {
            const dx = e.clientX - startPan.x;
            const dy = e.clientY - startPan.y;
            setPanOffset(prevOffset => ({
                x: prevOffset.x + dx,
                y: prevOffset.y + dy
            }));
            setStartPan({ x: e.clientX, y: e.clientY });
        } else {
            const rect = e.target.getBoundingClientRect();
            const mouseX = e.clientX - rect.left - panOffset.x;
            const mouseY = e.clientY - rect.top - panOffset.y;

            let newHoveredTrain = null;
            for (const train of trains) {
                const track = tracks.find(t => t.id === train.trackId);
                if (!track) continue;

                const trainX = track.start.x + (track.end.x - track.start.x) * train.position;
                const trainY = track.start.y + (track.end.y - track.start.y) * train.position;

                const distance = Math.sqrt(Math.pow(mouseX - trainX, 2) + Math.pow(mouseY - trainY, 2));
                if (distance < 10) {
                    newHoveredTrain = train;
                    break;
                }
            }
            setHoveredTrain(newHoveredTrain);
        }
    };

    const handleWheel = (e) => {
        e.preventDefault();
        setGridSize(prevSize => {
            const newSize = e.deltaY < 0 ? prevSize + 2 : prevSize - 2;
            return Math.max(10, Math.min(50, newSize));
        });
    };

    return {
        handleMouseDown,
        handleMouseUp,
        handleMouseMove,
        handleWheel
    };
};
