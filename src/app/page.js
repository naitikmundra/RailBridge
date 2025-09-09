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
			<aside className="w-full md:w-2/7 bg-gradient-to-b from-[#1f1f1f] to-[#141414] text-gray-200 p-6 md:p-8 rounded-lg shadow-2xl md:mr-4 mb-4 md:mb-0 border border-gray-700">
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
      <button
        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-md text-sm"
        onClick={() => {
          const newId = `T-${(tracks.length + 1).toString().padStart(3, "0")}`;
          const newTrack = {
            id: newId,
            type: "main",
            active: true,
            start: { x: 0 * gridSize, y: tracks.length * 2 * gridSize },
            end: { x: 40 * gridSize, y: tracks.length * 2 * gridSize }
          };
          setTracks([...tracks, newTrack]);
        }}
      >
        ➕ Add Track
      </button>
    </div>

    {/* Add Train */}
    <div>
      <h4 className="text-sm font-semibold mb-2">🚂 New Train</h4>
      <select
        id="trackSelect"
        className="bg-[#1e1e1e] border border-gray-600 rounded-md p-1 mr-2 text-sm"
      >
        {tracks.map(track => (
          <option key={track.id} value={track.id}>
            {track.id} ({track.type})
          </option>
        ))}
      </select>
      <select
        id="spawnSelect"
        className="bg-[#1e1e1e] border border-gray-600 rounded-md p-1 mr-2 text-sm"
      >
        <option value="start">Start</option>
        <option value="end">End</option>
      </select>
      <button
        className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded-md text-sm"
        onClick={() => {
          const trackId = document.getElementById("trackSelect").value;
          const spawnPoint = document.getElementById("spawnSelect").value;

          const newTrainId = `Train-${(trains.length + 1).toString().padStart(2, "0")}`;
          const newTrain = {
            id: newTrainId,
            name: `Train ${trains.length + 1}`,
            trackId,
            spawnPoint,
            direction: spawnPoint === "end" ? -1 : 1,
            haulted: false,
            speed: 0.5,
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