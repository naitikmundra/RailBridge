'use client';

import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { initialTrackDefinitions, initialTrains } from './data/data';
import CanvasGrid from './components/CanvasGrid';
import { createMouseHandlers } from './components/mouseHandlers';
import { createDrawGraph } from './components/drawGraph';
import { startTrainMovement } from './components/trainMovement';
import { trainController } from './components/trainController';




const App = () => {
    const [gridSize, setGridSize] = useState(25);
    const [tracks, setTracks] = useState([]);
    const [trains, setTrains] = useState([]);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
	const trainsRef = useRef(trains);

    const [isPanning, setIsPanning] = useState(false);
    const [startPan, setStartPan] = useState({ x: 0, y: 0 });
    const [hoveredTrain, setHoveredTrain] = useState(null);
    const [connectingTracksInfo, setConnectingTracksInfo] = useState([]);
	const predictedPositionsRef = useRef({});
	const [trackType, setTrackType] = useState("main");
	const [refTrack, setRefTrack] = useState("");
	const [lengthFactor, setLengthFactor] = useState(1);
	const [position, setPosition] = useState("below"); // "above" or "below"
const [originTrack, setOriginTrack] = useState("");
const [destinationTrack, setDestinationTrack] = useState("");
const [spawnPoint, setSpawnPoint] = useState("start");
const [trainSpeed, setTrainSpeed] = useState(50); // slider 1–100 → 0.01–1.0
const [destinationEndpoint, setDestinationEndpoint] = useState("end");

	// junction
	const [junctionT1, setJunctionT1] = useState("");
	const [junctionT2, setJunctionT2] = useState("");
	const [junctionAttach, setJunctionAttach] = useState("mid");
	const [parallel, setParallel] = useState(false);
	const [isRunning, setIsRunning] = useState(false);
	const [paused, setIsPaused] = useState(false);
	const timerRef = useRef(null);	
    const canvasContainerRef = useRef(null);
    const [canvasWidth, setCanvasWidth] = useState(0);
    const [canvasHeight, setCanvasHeight] = useState(0);
	const {
		handleMouseDown,
		handleMouseUp,
		handleMouseMove,
		handleWheel
	} = createMouseHandlers({
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
	});
	const pausedRef = useRef(false);
	const runBool = useRef(false);


    // Use useLayoutEffect to get the dimensions of the canvas container
    useLayoutEffect(() => {
        const updateDimensions = () => {
            if (canvasContainerRef.current) {
                setCanvasWidth(canvasContainerRef.current.offsetWidth);
                setCanvasHeight(canvasContainerRef.current.offsetHeight);
            }
        };
        
        updateDimensions(); // Set initial dimensions
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);
	useEffect(() => {
	  trainsRef.current = trains;
	}, [trains]);
    // Use useEffect to update the track and train data when gridSize or canvas size changes
    useEffect(() => {
        if (canvasWidth > 0 && canvasHeight > 0 && gridSize > 0) {
            // Calculate pixel coordinates for all tracks based on the current gridSize
            const calculatedTracks = initialTrackDefinitions.map(track => ({
                ...track,
                start: { x: track.start.x * gridSize, y: track.start.y * gridSize },
                end: { x: track.end.x * gridSize, y: track.end.y * gridSize }
            }));
            setTracks(calculatedTracks);
            
            const newTrains = initialTrains.map(train => {
                const track = calculatedTracks.find(t => t.id === train.trackId);
                if (!track) return train;

                const initialPosition = train.spawnPoint === 'end' ? 1 : 0;
                return { ...train, position: initialPosition };
            });
            setTrains(newTrains);
        }
    }, [canvasWidth, canvasHeight, gridSize]);







	const drawGraph = useCallback(
		createDrawGraph({ tracks, trains, gridSize, panOffset, hoveredTrain }),
		[tracks, trains, gridSize, panOffset, hoveredTrain]
	);


    return (
        <div className="flex flex-col md:flex-row h-screen bg-[#121212] p-4 font-sans text-gray-100">
            {/* Control Panel (1/5 width on desktop) */}
			<aside className="w-full md:w-2/7 bg-gradient-to-b from-[#1f1f1f] to-[#141414] text-gray-200 p-6 md:p-8 rounded-lg shadow-2xl md:mr-4 mb-4 md:mb-0 border border-gray-700 overflow-y-auto max-h-screen">
				<h2 className="text-2xl font-extrabold mb-6 flex items-center gap-2 text-yellow-400">
					🚂 Control Panel
				</h2>

				<div className="flex gap-3 mb-6">
					<button
						onClick={() => {
							if (!isRunning) {
								setIsRunning(true);
								pausedRef.current = false;
								startTrainMovement({
									tracks,
									trains,
									setTrains,
									gridSize,
									timerRef,
									pausedRef,
									runBool,
									setConnectingTracksInfo
								});
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
							} else {
								pausedRef.current = !pausedRef.current;
								setIsPaused(pausedRef.current);
								if (!pausedRef.current) {
									// resume train movement
									startTrainMovement({
										tracks,
										trains,
										setTrains,
										gridSize,
										timerRef,
										pausedRef,
										runBool,
									    setConnectingTracksInfo
									});
									
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
								} else {
									clearTimeout(timerRef.current); // pause
								}
							}
						}}
						className={`px-4 py-2 rounded-md font-semibold shadow-lg transition ${
							!isRunning || !paused ? 'bg-green-600 hover:bg-green-500' : 'bg-yellow-600 hover:bg-yellow-500'
						}`}
					>
						{!isRunning ? '▶ Start' : paused ? '▶ Resume' : '⏸ Pause'}
					</button>
					<button
						onClick={() => {
							// reset simulation
							window.location.reload();
						}}
						className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-md font-semibold shadow-lg transition"
					>
						🔄 Reset
					</button>
				</div>

				<div className="space-y-4">
					<p className="p-3 bg-[#242424] rounded-md border border-gray-700 hover:border-yellow-400 transition">
						Scroll to zoom the railway map. Click and drag to pan.
					</p>

					{tracks.length > 0 && (
    <div className="p-3 bg-[#242424] rounded-md border border-gray-700 hover:border-yellow-400 transition">
        <h3 className="font-bold mb-2">🛤 Track Definitions</h3>
        <ul className="list-disc list-inside space-y-1">
            {tracks.map(track => (
                <details key={track.id} className="bg-[#1e1e1e] p-2 rounded-md">
                    <summary className="cursor-pointer hover:text-yellow-400">
                        Track {track.id} ({track.type})
                    </summary>
                    <div className="mt-2 text-sm text-gray-300">
                        <p>Start: ({track.start.x / gridSize}, {track.start.y / gridSize})</p>
                        <p>End: ({track.end.x / gridSize}, {track.end.y / gridSize})</p>
                    </div>
                </details>
            ))}
        </ul>
    </div>
)}
{/* Track + Train Creation Menu */}
{!isRunning && (
  <div className="p-3 bg-[#242424] rounded-md border border-gray-700 hover:border-yellow-400 transition">
    <h3 className="font-bold mb-3">➕ Create</h3>

    {/* Add Track */}
    <div className="mb-4">
  <h4 className="text-sm font-semibold mb-2">🛤 New Track</h4>

  {/* track type selector */}
  <select
    value={trackType}
    onChange={(e) => setTrackType(e.target.value)}
    className="bg-[#1e1e1e] border border-gray-600 rounded-md p-1 mb-2 w-full text-sm"
  >
    <option value="main">Main Track</option>
    <option value="junction">Junction Track</option>
  </select>

  {/* --- Main Track Options --- */}
  {trackType === "main" && (
    <div className="space-y-2">
      <label className="block text-xs">Next to Track:</label>
      <select
        value={refTrack}
        onChange={(e) => setRefTrack(e.target.value)}
        className="w-full bg-[#1e1e1e] border border-gray-600 rounded-md p-1 text-sm"
      >
	  <option value="" disabled>-- Select Track --</option>

        {tracks.filter(t => t.type === "main").map((t) => (
          <option key={t.id} value={t.id}>
            {t.id} ({t.type})
          </option>
        ))}
      </select>

      <label className="block text-xs">Above / Below:</label>
      <select
        value={position}
        onChange={(e) => setPosition(e.target.value)}
        className="w-full bg-[#1e1e1e] border border-gray-600 rounded-md p-1 text-sm"
      >
        <option value="below">Below</option>
        <option value="above">Above</option>
      </select>

      <label className="block text-xs">Length:</label>
      <select
        value={lengthFactor}
        onChange={(e) => setLengthFactor(parseFloat(e.target.value))}
        className="w-full bg-[#1e1e1e] border border-gray-600 rounded-md p-1 text-sm"
      >
        <option value="1">Full</option>
        <option value="0.25">1/4</option>
        <option value="0.2">1/5</option>
      </select>
    </div>
  )}

  {/* --- Junction Track Options --- */}
  {trackType === "junction" && (
    <div className="space-y-2">
      <label className="block text-xs">Between Tracks:</label>
      <select
        value={junctionT1}
        onChange={(e) => setJunctionT1(e.target.value)}
        className="w-full bg-[#1e1e1e] border border-gray-600 rounded-md p-1 text-sm"
      >
	  <option value="" disabled>-- Select Track --</option>

        {tracks.filter(t => t.type === "main").map((t) => (
          <option key={t.id} value={t.id}>{t.id}</option>
        ))}
      </select>
      <select
        value={junctionT2}
        onChange={(e) => setJunctionT2(e.target.value)}
        className="w-full bg-[#1e1e1e] border border-gray-600 rounded-md p-1 text-sm"
      >
	  <option value="" disabled>-- Select Track --</option>

        {tracks.filter(t => t.type === "main").map((t) => (
          <option key={t.id} value={t.id}>{t.id}</option>
        ))}
      </select>

      <label className="block text-xs">Attach At:</label>
      <select
        value={junctionAttach}
        onChange={(e) => setJunctionAttach(e.target.value)}
        className="w-full bg-[#1e1e1e] border border-gray-600 rounded-md p-1 text-sm"
      >
	  
        <option value="start">Start</option>
        <option value="mid">Mid</option>
        <option value="end">End</option>
      </select>

      <label className="block text-xs flex items-center">
        <input
          type="checkbox"
          checked={parallel}
          onChange={(e) => setParallel(e.target.checked)}
          className="mr-2"
        />
        Enable Parallel
      </label>
    </div>
  )}

  {/* --- Add Track Button --- */}
  <button
    className="mt-3 px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-md text-sm w-full"
    onClick={() => {
      const newId = `T-${(tracks.length + 1).toString().padStart(3, "0")}`;

      if (trackType === "main") {
        const ref = tracks.find((t) => t.id === refTrack);
        if (!ref) return;

        // compute new Y based on above/below
        let newY = position === "below"
          ? ref.start.y + gridSize * 2
          : ref.start.y - gridSize * 2;

        // prevent overlap
        while (tracks.some((t) => t.start.y === newY && t.end.y === newY)) {
          newY += (position === "below" ? gridSize * 2 : -gridSize * 2);
        }

        const newTrack = {
          id: newId,
          type: "main",
          active: true,
          start: { x: ref.start.x, y: newY },
          end: { x: ref.start.x + (40 * gridSize * lengthFactor), y: newY },
        };
        setTracks([...tracks, newTrack]);

      } else {
        const t1 = tracks.find((t) => t.id === junctionT1);
        const t2 = tracks.find((t) => t.id === junctionT2);
        if (!t1 || !t2) return;

        const pickPoint = (track, pos) => {
          if (pos === "start") return track.start;
          if (pos === "end") return track.end;
          return {
            x: (track.start.x + track.end.x) / 2,
            y: (track.start.y + track.end.y) / 2,
          };
        };

        const p1 = pickPoint(t1, junctionAttach);
        const p2 = pickPoint(t2, junctionAttach);

        const newTrack = {
          id: newId,
          type: "junction",
          active: true,
          start: p1,
          end: p2,
          connect: [t1.id, t2.id],
          attach: junctionAttach,
          parallel,
        };
        setTracks([...tracks, newTrack]);
      }
    }}
  >
    ➕ Add Track
  </button>
</div>

<div className="mt-3 space-y-3">
  {/* Origin Track */}
        <h4 className="text-sm font-semibold mb-2">🚂 New Train</h4>

  <label className="block text-xs">Origin Track:</label>
  <select
    value={originTrack}
    onChange={(e) => setOriginTrack(e.target.value)}
    className="bg-[#1e1e1e] border border-gray-600 rounded-md p-1 w-full text-sm"
  >
    <option value="">-- Select Origin --</option>
    {tracks.map(track => (
      <option key={track.id} value={track.id}>
        {track.id} ({track.type})
      </option>
    ))}
  </select>

  {/* Destination Track */}
  <label className="block text-xs">Destination Track:</label>
  <select
    value={destinationTrack}
    onChange={(e) => setDestinationTrack(e.target.value)}
    className="bg-[#1e1e1e] border border-gray-600 rounded-md p-1 w-full text-sm"
  >
    <option value="">-- Select Destination --</option>
    {tracks.map(track => (
      <option key={track.id} value={track.id}>
        {track.id} ({track.type})
      </option>
    ))}
  </select>

  {/* Spawn Point */}
  <label className="block text-xs">Spawn Point:</label>
  <select
    value={spawnPoint}
    onChange={(e) => setSpawnPoint(e.target.value)}
    className="bg-[#1e1e1e] border border-gray-600 rounded-md p-1 w-full text-sm"
  >
    <option value="start">Start</option>
    <option value="end">End</option>
  </select>
<label className="block text-xs">Destination Endpoint:</label>
<select
  value={destinationEndpoint}
  onChange={(e) => setDestinationEndpoint(e.target.value)}
  className="bg-[#1e1e1e] border border-gray-600 rounded-md p-1 w-full text-sm"
>
  <option value="start">Start</option>
  <option value="end">End</option>
</select>
  {/* Speed Slider */}
  <label className="block text-xs">Speed: {trainSpeed / 100}</label>
  <input
    type="range"
    min="1"
    max="100"
    value={trainSpeed}
    onChange={(e) => setTrainSpeed(Number(e.target.value))}
    className="w-full"
  />

  {/* Add Train Button */}
  <button
    className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded-md text-sm w-full"
    onClick={() => {
      if (!originTrack || !destinationTrack) return;

      const newTrainId = `Train-${(trains.length + 1).toString().padStart(2, "0")}`;
      const newTrain = {
        id: newTrainId,
        name: `Train ${trains.length + 1}`,
        trackId: originTrack,
        trackIdEND: destinationTrack,
        spawnPoint,
        direction: spawnPoint === "end" ? -1 : 1,
        haulted: false,
        speed: trainSpeed / 100,
        position: spawnPoint === "end" ? 1 : 0
      };

      setTrains([...trains, newTrain]);
    }}
  >
    ➕ Add Train
  </button>
</div>
</div>
)}

{isRunning && (
  <p className="mt-4 text-sm text-gray-400 italic">
    🚫 Creation disabled while simulation is running. Reset to add new trains/tracks.
  </p>
)}

					{trains.length > 0 && (
						<div className="p-3 bg-[#242424] rounded-md border border-gray-700 hover:border-yellow-400 transition">
							<h3 className="font-bold mb-2">🚆 Active Trains</h3>
							<ul className="list-disc list-inside space-y-1">
								{trains.map(train => {
									const track = tracks.find(t => t.id === train.trackId);
									if (!track) return null;
									const trainX = Math.round(track.start.x + (track.end.x - track.start.x) * train.position);
									const trainY = Math.round(track.start.y + (track.end.y - track.start.y) * train.position);
									return (
								<li key={train.id}>
									{train.name} on {train.trackId} ({trainX}, {trainY})
									{predictedPositionsRef.current[train.id] && (
									  <span className="ml-2 text-sm text-yellow-400">
										Next: {predictedPositionsRef.current[train.id]
										  .map(pos => `(${pos.x}, ${pos.y})`)
										  .join(' → ')}
									  </span>
									)}
								</li>
										
									);
								})}
							</ul>
						</div>
					)}
				</div>
			</aside>
            {/* Main Content Area (4/5 width on desktop) */}
            <main className="flex-1 bg-[#1a1a1a] w-full rounded-lg shadow-xl p-4 transition-all duration-300">
                <h1 className="text-3xl font-bold text-gray-100 mb-4">Railway Tracks Visualization</h1>
                <div ref={canvasContainerRef} className="w-full h-[calc(100%-4rem)] bg-[#1a1a1a] rounded-md cursor-grab active:cursor-grabbing">
                    {canvasWidth > 0 && canvasHeight > 0 && gridSize > 0 && (
                        <CanvasGrid
                            draw={drawGraph}
                            width={canvasWidth}
                            height={canvasHeight}
                            onMouseDown={handleMouseDown}
                            onMouseUp={handleMouseUp}
                            onMouseMove={handleMouseMove}
                            onWheel={handleWheel} // Pass the new handler to the component
                        />
                    )}
                </div>
            </main>
        </div>
    );
};

export default App;