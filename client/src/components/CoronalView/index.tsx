// src/components/CoronalView/index.tsx

import React, { useRef, useEffect } from 'react';
import './style.css'; // This will be the same as AxialView/SagittalView

interface CoronalViewProps {
    volumeData: Int16Array;
    dimensions: [number, number, number];
    sliceIndex: number; // This will be the slice along the Y-axis
}

// Define a default "window" to map HU values to grayscale
const WINDOW_MIN = -2000; // e.g., Air
const WINDOW_MAX = 4000;  // e.g., Bone
const WINDOW_RANGE = WINDOW_MAX - WINDOW_MIN;

export const CoronalView: React.FC<CoronalViewProps> = ({ 
    volumeData, 
    dimensions, 
    sliceIndex // This is our 'y' coordinate
}) => {
    
    // Deconstruct all dimensions
    const [width, height, depth] = dimensions;

    // A Coronal (front) view's canvas will have a
    // width equal to the volume's WIDTH (x-axis)
    // height equal to the volume's DEPTH (z-axis)
    const coronalWidth = width;
    const coronalHeight = depth;
    
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Create an RGBA pixel array for our NEW canvas dimensions
        const imageDataArray = new Uint8ClampedArray(coronalWidth * coronalHeight * 4);
        
        // We must iterate over the X and Z axes to build our new 2D image
        for (let z = 0; z < coronalHeight; z++) { // Iterating down the rows (Z-axis)
            for (let x = 0; x < coronalWidth; x++) { // Iterating across the columns (X-axis)
                
                // 2. Find the 1D index in volumeData for the voxel at (x, sliceIndex, z)
                const y = sliceIndex;
                const volumeIndex = (z * width * height) + (y * width) + x;

                // 3. Get the Hounsfield Unit (HU) value at that voxel
                const huValue = volumeData[volumeIndex];

                // 4. Normalize the HU value (same as AxialView)
                let normalized = (huValue - WINDOW_MIN) / WINDOW_RANGE;
                normalized = Math.max(0, Math.min(1, normalized)); // Clamp to 0-1
                const grayscale = normalized * 255;

                // 5. --- MODIFIED: Flip the image vertically ---
                // We calculate an inverted 'row' coordinate for the canvas
                // This maps volume 'z=0' to canvas 'row=max'
                const canvas_row = (coronalHeight - 1) - z;

                // 6. Find the 2D pixel index in our *new* imageDataArray
                // (row * width + col)
                const pixelIndex = (canvas_row * coronalWidth + x) * 4;
                // --- End Modification ---

                // 7. Set the pixel data (R, G, B, A)
                imageDataArray[pixelIndex]     = grayscale; // Red
                imageDataArray[pixelIndex + 1] = grayscale; // Green
                imageDataArray[pixelIndex + 2] = grayscale; // Blue
                imageDataArray[pixelIndex + 3] = 255;       // Alpha
            }
        }

        // 8. Create an ImageData object
        const imageData = new ImageData(imageDataArray, coronalWidth, coronalHeight);
        
        // 9. Draw the image to the canvas
        createImageBitmap(imageData).then(bitmap => {
            ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        });

    }, [volumeData, dimensions, sliceIndex, width, height, depth, coronalWidth, coronalHeight]);

    return (
        <div className="image-item">
            <canvas
                ref={canvasRef}
                width={coronalWidth}    // Set internal resolution
                height={coronalHeight}  // Set internal resolution
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} // CSS scaling
            />
            <p>Slice {sliceIndex}</p>
        </div>
    );
};

