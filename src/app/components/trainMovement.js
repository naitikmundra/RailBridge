export const startTrainMovement = ({
    tracks,
    setTrains,
    gridSize,
    timerRef,
    pausedRef,
	runBool,
    setConnectingTracksInfo
}) => {
    const findConnections = (currentTrackId, currentPosition) => {
		
        const trainX = Math.round(currentPosition.x / gridSize);
        const trainY = Math.round(currentPosition.y / gridSize);
        const tolerance = 0.001;

        return tracks.filter(track => {
			if (!track.active) return false;
            if (track.id === currentTrackId) return false;

            const startX = track.start.x / gridSize;
            const startY = track.start.y / gridSize;
            const endX = track.end.x / gridSize;
            const endY = track.end.y / gridSize;

            if (Math.abs(startX - endX) < tolerance && Math.abs(trainX - startX) < tolerance) {
                const minY = Math.min(startY, endY);
                const maxY = Math.max(startY, endY);
                return trainY >= minY - tolerance && trainY <= maxY + tolerance;
            }

            if (Math.abs(startY - endY) < tolerance && Math.abs(trainY - startY) < tolerance) {
                const minX = Math.min(startX, endX);
                const maxX = Math.max(startX, endX);
                return trainX >= minX - tolerance && trainX <= maxX + tolerance;
            }

            return false;
        });
    };
	const trackMap = new Map(tracks.map(t => [t.id, t])); 
    const moveTrain = () => {
		if (!runBool.current) return;
        if (pausedRef.current) return;

        setTrains(prevTrains => {
            const updatedTrains = prevTrains.map(train => {
			  if (train.haulted) {
				
				return train;
			  }
                const track = trackMap.get(train.trackId);
                if (!track) return train;

                const dx = track.end.x - track.start.x;
                const dy = track.end.y - track.start.y;
                const trackLength = Math.sqrt(dx * dx + dy * dy);
                const stepSize = (train.speed ?? 1) / (trackLength / gridSize);

                // Update train position
				// only move if direction ≠ 0
				let newPosition = train.position;

				if (train.direction !== 0) {
					newPosition += stepSize * train.direction;

					// Check if train reaches end
					if (newPosition > 1 || newPosition < 0) {
						return { ...train, position: newPosition < 0 ? 0 : 1, speed: 0, direction: 0 }; 
					}
				}
                const currentPos = { x: track.start.x + dx * newPosition, y: track.start.y + dy * newPosition };



                const isAtGridIntersection = Math.abs(newPosition * (trackLength / gridSize) - Math.round(newPosition * (trackLength / gridSize))) < 0.001;

                if (isAtGridIntersection) {
                    const connections = findConnections(train.trackId, currentPos);

                    if (connections.length > 0) {
                        const newTrack = connections[0];
                        const newDx = newTrack.end.x - newTrack.start.x;
                        const newDy = newTrack.end.y - newTrack.start.y;
                        const enteredFromStart = Math.abs(currentPos.x - newTrack.start.x) < 0.001 &&
                                                 Math.abs(currentPos.y - newTrack.start.y) < 0.001;

                        const currentConnections = findConnections(train.trackId, currentPos);
                        if (currentConnections.length > 0 && currentConnections[0].type === 'junction') {
                            if ((train.direction === -1 && !enteredFromStart) ||
                                (train.direction === 1 && enteredFromStart)) {
                                return { ...train, position: newPosition };
                            }
                        }

                        const newPositionValue = newTrack.start.x === newTrack.end.x
                            ? (currentPos.y - newTrack.start.y) / newDy
                            : (currentPos.x - newTrack.start.x) / newDx;

						let newDirection;
						if (enteredFromStart) {
							newDirection = 1; // entering from start → move forward
						} else {
							newDirection = -1; // entering from end → move backward
						}

                        return { ...train, trackId: newTrack.id, position: newPositionValue, direction: newDirection };
                    } else if (newPosition >= 1 || newPosition <= 0) {
                            return { ...train, speed: 0, direction: 0 }; // stop completely

                    }
                }

                return { ...train, position: newPosition };
            });

            // Update connecting tracks info only for first train
            if (updatedTrains.length > 0) {
                const firstTrain = updatedTrains[0];
                const track = tracks.find(t => t.id === firstTrain.trackId);
                if (track && firstTrain.direction === 0 && (firstTrain.position >= 1 || firstTrain.position <= 0)) {
                    const endpoint = firstTrain.position >= 1 ? track.end : track.start;
                    setConnectingTracksInfo(findConnections(track.id, endpoint));
                } else {
                    setConnectingTracksInfo([]);
                }
            }

            return updatedTrains;
        });
		runBool.current = false;
        timerRef.current = setTimeout(moveTrain, 500);
    };

    if (tracks.length > 0) timerRef.current = setTimeout(moveTrain, 100);
};
