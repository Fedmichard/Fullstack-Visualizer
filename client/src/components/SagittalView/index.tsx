// src/components/SagittalView/index.tsx

import React, { useRef, useEffect } from 'react';
import './style.css';

interface SagittalViewProps {
    volumeData: Int16Array;
    dimensions: [number, number, number];
    sliceIndex: number; // This will be the slice along the X-axis
}

const WINDOW_MIN = -2000;
const WINDOW_MAX = 4000;
const WINDOW_RANGE = WINDOW_MAX - WINDOW_MIN;

export const SagittalView: React.FC<SagittalViewProps> = ({ 
    volumeData, 
    dimensions, 
    sliceIndex // This is our 'x' coordinate
}) => {
    
    const [width, height, depth] = dimensions;

    const sagittalWidth = height; // Was 'depth'
    const sagittalHeight = depth;   // Was 'height'
    
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imageDataArray = new Uint8ClampedArray(sagittalWidth * sagittalHeight * 4);
        
        for (let z = 0; z < sagittalHeight; z++) { 
            // Iterate across the columns (Y-axis)
            for (let y = 0; y < sagittalWidth; y++) { 
                
                const x = sliceIndex;
                // index = (z * (width * height)) + (y * width) + x
                const volumeIndex = (z * width * height) + (y * width) + x;

                const huValue = volumeData[volumeIndex];

                let normalized = (huValue - WINDOW_MIN) / WINDOW_RANGE;
                normalized = Math.max(0, Math.min(1, normalized));
                const grayscale = normalized * 255;

                // --- MODIFIED: Flip the image 180 degrees ---
                // We calculate an inverted 'row' (z-axis)
                const canvas_row = (sagittalHeight - 1) - z;
                // We calculate an inverted 'column' (y-axis)
                const canvas_col = (sagittalWidth - 1) - y;
                
                // (row * width + col)
                const pixelIndex = (canvas_row * sagittalWidth + canvas_col) * 4;
                // --- End Modification ---

                imageDataArray[pixelIndex]     = grayscale;
                imageDataArray[pixelIndex + 1] = grayscale;
                imageDataArray[pixelIndex + 2] = grayscale;
                imageDataArray[pixelIndex + 3] = 255;
            }
        }

        const imageData = new ImageData(imageDataArray, sagittalWidth, sagittalHeight);
        
        createImageBitmap(imageData).then(bitmap => {
            ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        });

    }, [volumeData, dimensions, sliceIndex, width, height, depth, sagittalWidth, sagittalHeight]);

    return (
        <div className="image-item">
            <canvas
                ref={canvasRef}
                width={sagittalWidth}
                height={sagittalHeight}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
            <p>Slice {sliceIndex}</p>
        </div>
    );
};

