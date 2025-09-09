// trainController.js
const predictNextPositions = (train, track, gridSize) => {
  const dx = track.end.x - track.start.x;
  const dy = track.end.y - track.start.y;
  const trackLength = Math.sqrt(dx * dx + dy * dy);
  const stepSize = (train.speed ?? 1) / (trackLength / gridSize);

  let tempPosition = train.position;
  let tempDirection = train.direction;
  const nextPositions = [];

  for (let i = 0; i < 10; i++) {
    let futurePos = tempPosition + stepSize * tempDirection;
    if (futurePos > 1) futurePos = 2 - futurePos;
    if (futurePos < 0) futurePos = -futurePos;

    nextPositions.push({
      x: Math.round(track.start.x + dx * futurePos),
      y: Math.round(track.start.y + dy * futurePos)
    });

    tempPosition = futurePos;
  }

  return nextPositions;
};

export const trainController = ({
  tracks,
  trainsRef,
  setTrains,
  gridSize,
  timerRef,
  pausedRef,
  runBool,
  predictedPositionsRef,
  setConnectingTracksInfo
}) => {
  if (pausedRef.current) return; // literally just exit if paused

  const trackMap = new Map(tracks.map(t => [t.id, t]));
  const collisionCandidates = new Map();

  // 1. Generate predictions for all trains
  trainsRef.current.forEach(train => {
    const track = trackMap.get(train.trackId);
    if (!track) return;

    const predictions = predictNextPositions(train, track, gridSize);
    predictedPositionsRef.current[train.id] = predictions;

    // store first 5 predicted positions for collision check
    for (let i = 0; i < 5; i++) {
      const key = `${predictions[i].x},${predictions[i].y}`;
      if (!collisionCandidates.has(key)) {
        collisionCandidates.set(key, []);
      }
      collisionCandidates.get(key).push(train.id);
    }
  });

  // 2. Find collisions
  const trainsToHalt = new Set();
collisionCandidates.forEach(trainIds => {
  // only halt if at least 2 *different* trains occupy the same spot
  const uniqueIds = [...new Set(trainIds)];
  if (uniqueIds.length > 1) {
    // halt all but first train
    uniqueIds.slice(1).forEach(id => trainsToHalt.add(id));
  }
});

  // 3. Halt trains by updating state
  if (trainsToHalt.size > 0) {
	
    setTrains(prev =>
      prev.map(train =>
        trainsToHalt.has(train.id)
          ? { ...train, haulted: true } // halt train
          : train
      )
    );
  }

  runBool.current = true;
  timerRef.current = setTimeout(() => {
    trainController({
      tracks,
      trainsRef,
      setTrains,
      gridSize,
      timerRef,
      pausedRef,
      runBool,
      predictedPositionsRef,
      setConnectingTracksInfo
    });
  }, 500);
};
