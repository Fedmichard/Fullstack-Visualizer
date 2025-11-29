# Full-Stack 3D Medical DICOM Visualizer

This is a full-stack web application for medical visualization, built with a C#/.NET 8 backend and a React/TypeScript frontend.

The application allows a user to upload a series of 2D DICOM medical images. The backend processes this series, sorts the slices, and converts the raw pixel data into 16-bit Hounsfield Units (HU). This 3D volume data is then sent to the frontend, where it is rendered in real-time as a 3D volume using a custom GPU-powered ray-marching + front to back compisiting renderer built with WebGPU and WGSL.

## Features & Screenshots

* **Full 3D Volumetric Rendering:** Real-time GPU ray-marching of 3D volume data.
* **DICOM Data Pipeline:** Backend pipeline parses raw 2D DICOM series, applies slope/intercept, and converts data to 16-bit Hounsfield Units.
* **WebGPU Accelerated:** All rendering is done on the GPU, with data stored in `r16unorm` textures to enable hardware-based linear filtering for smooth visualization.
* **Shader-Based:** All rendering logic, including ray-box intersection and alpha compositing, is handled in a custom WGSL shader.

---

A demo of the 3D volumetric renderer in action
<img width="2338" height="1221" alt="image" src="https://github.com/user-attachments/assets/e74ca406-233b-4d34-9f74-db2ed819aa42" />
<br>
Patient chest at default render settings and X-Axis clipping
<img width="2558" height="1220" alt="image" src="https://github.com/user-attachments/assets/216c0367-f47e-43bb-bad7-2ace10ba2df1" />
<br>
Skull scan with manipulated contrast, opacity, and softness
<img width="2558" height="1276" alt="image" src="https://github.com/user-attachments/assets/d6c9f794-5eb6-4014-8029-431b7dbe566a" />


---

## Technology Stack

* **Backend:** C#, ASP.NET 8
* **Frontend:** React, TypeScript
* **Rendering:** WebGPU, WGSL
* **Data Parsing:** FellowOakDicom

## Resources I Used

* GPU Gems Chapter 39
* Will Usher Volume Rendering with WebGL
* WebGPU Fundamentals
* WebGPU Samples
* https://radiopaedia.org/articles/hounsfield-unit?lang=us
* https://www.sciencedirect.com/topics/medicine-and-dentistry/hounsfield-scale
* https://dicom.nema.org/medical/dicom/current/output/chtml/part06/chapter_6.html
* https://github.com/fraserlove/ossium
* https://stackoverflow.com/questions/6111559/volume-rendering-confusion-with-front-to-back-compositing
* https://gpuweb.github.io/gpuweb/#ref-for-dom-gputextureformat-r16uint%E2%91%A0
* https://community.khronos.org/t/linear-filtering-for-texture3d-not-working-while-nearest-filtering-works/108637
* And of course our good friends google + AI

## Next Steps

* Camera Interaction
* Metadata Viewing
* Render Setting Functionality
* Transfer Function
* Blinn-phong Lighting
* Export Functionality

## How to Run

### Prerequisites

* [.NET 8 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/8.0)
* [Node.js](https://nodejs.org/en) (v18 or later)
* A WebGPU-compatible browser (e.g., Google Chrome, Microsoft Edge)

---

### 1. Run the Backend (Server)

```bash
# Navigate to the server directory
cd path/to/your/server

# Adjust global.json to your .Net version
{
  "sdk": {
    "version": "8.0.414"
  }
}

# Restore .NET dependencies
dotnet restore

# Run the backend server (usually on https://localhost:7XXX or http://localhost:5XXX)
dotnet run
