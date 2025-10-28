// src/components/AxialView/AxialView.tsx

import React, { useRef, useEffect } from 'react';
import './style.css'; // We'll create this file next

interface AxialViewProps { // Renamed from SlicePreviewProps
    volumeData: Int16Array;
    dimensions: [number, number, number];
    sliceIndex: number;
}

// Define a default "window" to map HU values to grayscale
const WINDOW_MIN = -1000; // e.g., Air
const WINDOW_MAX = 2000;  // e.g., Bone
const WINDOW_RANGE = WINDOW_MAX - WINDOW_MIN;

export const AxialView: React.FC<AxialViewProps> = ({ // Renamed from SlicePreview
    volumeData, 
    dimensions, 
    sliceIndex 
}) => {
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [width, height] = dimensions;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Calculate the size of one 2D slice
        const sliceSize = width * height;
        
        // 2. Find the starting position of our slice in the 3D array
        const sliceOffset = sliceIndex * sliceSize;

        // 3. Get the 2D pixel data (Hounsfield Units) for this slice
        //    .subarray() is a fast, memory-efficient "view" into the array
        const sliceData = volumeData.subarray(sliceOffset, sliceOffset + sliceSize);

        // 4. Create an RGBA pixel array to draw
        //    (width * height * 4 because each pixel has R, G, B, and A)
        const imageDataArray = new Uint8ClampedArray(width * height * 4);
        
        for (let i = 0; i < sliceSize; i++) {
            const huValue = sliceData[i];

            // 5. Normalize the HU value to a 0.0 - 1.0 range
            let normalized = (huValue - WINDOW_MIN) / WINDOW_RANGE;
            normalized = Math.max(0, Math.min(1, normalized)); // Clamp to 0-1

            // 6. Convert to 0-255 grayscale
            const grayscale = normalized * 255;

            // 7. Set the pixel data (R, G, B, A)
            const pixelIndex = i * 4;
            imageDataArray[pixelIndex]     = grayscale; // Red
            imageDataArray[pixelIndex + 1] = grayscale; // Green
            imageDataArray[pixelIndex + 2] = grayscale; // Blue
            imageDataArray[pixelIndex + 3] = 255;       // Alpha (fully opaque)
        }

        // 8. Create an ImageData object
        const imageData = new ImageData(imageDataArray, width, height);
        
        // 9. Draw the image to the canvas
        // We use createBitmap + transferToImageBitmap for best performance
        createImageBitmap(imageData).then(bitmap => {
            ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        });

    }, [volumeData, dimensions, sliceIndex, width, height]); // Re-run if data changes

    return (
        <div className="image-item">
            <canvas
                ref={canvasRef}
                width={width}    // Set internal resolution
                height={height}  // Set internal resolution
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} // CSS scaling
            />
            <p>Slice {sliceIndex}</p>
        </div>
    );
};
