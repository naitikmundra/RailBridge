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

// store halted trains and why they’re halted
const haltedTrainsRef = { current: new Map() };

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

  // 2. Find collisions and decide which trains must halt
  const trainsToHalt = new Set();
  collisionCandidates.forEach(trainIds => {
    const uniqueIds = [...new Set(trainIds)];
    if (uniqueIds.length > 1) {
      const blocker = uniqueIds[0]; // let first train continue
      uniqueIds.slice(1).forEach(id => {
        trainsToHalt.add(id);
        haltedTrainsRef.current.set(id, { reason: "collision", blockedBy: blocker });
      });
    }
  });

  // 3. Update train states (halt or resume)
  setTrains(prev =>
    prev.map(train => {
      if (trainsToHalt.has(train.id)) {
        // must halt this tick
        return { ...train, haulted: true };
      }

      if (haltedTrainsRef.current.has(train.id)) {
        // train was halted previously → check if still blocked
        const info = haltedTrainsRef.current.get(train.id);
        const blockerPredictions = predictedPositionsRef.current[info.blockedBy];
        const myPredictions = predictedPositionsRef.current[train.id];

        const stillBlocked = blockerPredictions?.some(pos1 =>
          myPredictions?.some(pos2 => pos1.x === pos2.x && pos1.y === pos2.y)
        );

        if (stillBlocked) {
          return { ...train, haulted: true };
        } else {
          // clear it, resume train
          haltedTrainsRef.current.delete(train.id);
          return { ...train, haulted: false };
        }
      }

      // not halted, let it run
      return { ...train, haulted: false };
    })
  );

  // 4. Recurse
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
