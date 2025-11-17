# Full-Stack 3D Medical DICOM Visualizer

This is a full-stack web application for medical visualization, built with a C#/.NET 8 backend and a React/TypeScript frontend.

The application allows a user to upload a series of 2D DICOM medical images. The backend processes this series, sorts the slices, and converts the raw pixel data into 16-bit Hounsfield Units (HU). This 3D volume data is then sent to the frontend, where it is rendered in real-time as a 3D volume using a custom GPU-powered ray-marching renderer built with WebGPU and WGSL.

## 🖼️ Features & Screenshots

* **Full 3D Volumetric Rendering:** Real-time GPU ray-marching of 3D volume data.
* **DICOM Data Pipeline:** Backend pipeline parses raw 2D DICOM series, applies slope/intercept, and converts data to 16-bit Hounsfield Units.
* **WebGPU Accelerated:** All rendering is done on the GPU, with data stored in `r16unorm` textures to enable hardware-based linear filtering for smooth visualization.
* **Shader-Based:** All rendering logic, including ray-box intersection and alpha compositing, is handled in a custom WGSL shader.

---

*(Add your screenshots here. You can just drag and drop them into the GitHub editor.)*

<img width="1408" height="1217" alt="Torso" src="https://github.com/user-attachments/assets/7a3919bc-20e1-42f4-8d7d-88d9f0a4b00f" />
_A demo of the 3D volumetric renderer in action._

<br>

<img width="2559" height="1209" alt="image" src="https://github.com/user-attachments/assets/4ead2b56-2818-46b8-9c2f-20a504e08216" />
_The full application UI, showing the 2D slice views and 3D render._

---

## 🛠️ Technology Stack

* **Backend:** C#, ASP.NET 8
* **Frontend:** React, TypeScript
* **Rendering:** WebGPU, WGSL
* **Data Parsing:** FellowOakDicom

## 🚀 How to Run

### Prerequisites

* [.NET 8 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/8.0)
* [Node.js](https://nodejs.org/en) (v18 or later)
* A WebGPU-compatible browser (e.g., Google Chrome, Microsoft Edge)

---

### 1. Run the Backend (Server)

```bash
# Navigate to the server directory
cd path/to/your/server

# Restore .NET dependencies
dotnet restore

# Run the backend server (usually on https://localhost:7XXX or http://localhost:5XXX)
dotnet run
