'use client';

export default function ControlPanel({ tracks, trains }) {
  return (
    <aside className="w-full md:w-2/7 bg-[#1a1a1a] text-gray-200 p-6 md:p-8 rounded-lg shadow-xl md:mr-4 mb-4 md:mb-0">
      <h2 className="text-2xl font-bold mb-6">Control Panel</h2>

      <p className="p-3 bg-[#242424] rounded-md">
        This is the control panel for your railway system. Scroll your mouse wheel over the canvas to zoom.
      </p>

      {tracks.length > 0 && (
        <div className="p-3 bg-[#242424] rounded-md mt-4">
          <h3 className="font-bold mb-2">Track Definitions</h3>
          <ul className="list-disc list-inside">
            {tracks.map(track => (
              <li key={track.id}>
                Track {track.id} ({track.type}): Start ({track.start.x}, {track.start.y}), End ({track.end.x}, {track.end.y})
              </li>
            ))}
          </ul>
        </div>
      )}

      {trains.length > 0 && (
        <div className="p-3 bg-[#242424] rounded-md mt-4">
          <h3 className="font-bold mb-2">Active Trains</h3>
          <ul className="list-disc list-inside">
            {trains.map(train => (
              <li key={train.id}>
                {train.name} on {train.trackId}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
