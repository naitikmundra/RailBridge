export const initialTrackDefinitions = [
    { id: 'T-001', type: 'main', active:true, start: { x: 0, y: 19 }, end: { x: 40, y: 19 } },
    { id: 'T-002', type: 'main',active:true, start: { x: 0, y: 21 }, end: { x: 40, y: 21 } },
    { id: 'T-003', type: 'junction', active:true, start: { x: 5, y: 19 }, end: { x: 5, y: 21 } },
    { id: 'T-004', type: 'junction', active:true, start: { x: 38, y: 19 }, end: { x: 38, y: 21 } },
    { id: 'T-005', type: 'junction', active:true, start: { x: 20, y: 21 }, end: { x: 20, y: 19 } },
];

export const initialTrains = [
    { id: 'Train-01', name: 'The Rocket', trackId: 'T-001', spawnPoint: 'end', direction: -1,haulted:false, speed: 0.5 },
    { id: 'Train-02', name: 'The Rocket2', trackId: 'T-002', spawnPoint: 'end', direction: -1,haulted:false, speed:0.25 }
];
