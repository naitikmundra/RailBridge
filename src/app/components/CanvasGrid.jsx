'use client';
import React, { useEffect, useRef } from 'react';

export default function CanvasGrid({ draw, width, height, ...events }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        draw(ctx, width, height);
    }, [draw, width, height]);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full bg-transparent border border-gray-500 rounded-md"
            {...events}
        />
    );
}
