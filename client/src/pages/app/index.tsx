import React, { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import { uploadDicom } from '../../utils/dicom/api'; 
import './style.css';
import githubIcon from '../../assets/github.png';
import linkedinIcon from '../../assets/linkedin.png';

// Import your 2D preview component
import { AxialView } from '../../components/Preview/index';
import { SagittalView } from '../../components/SagittalView';
import { CoronalView } from '../../components/CoronalView';
import { WebGPURenderer } from '../../components/WebGPU';

// Interface to hold your processed volume data
export interface VolumeInfo {
    dimensions: [number, number, number];
    voxelSpacing: [number, number, number];
    volumeData: Int16Array; // Convert byte back to 16 bits 
}

type TabID = 'mpr' | 'metadata' | 'render';

function App() {
    const [settingsSidebarWidth, setSettingsSidebarWidth] = useState(300);
    
    const [activeTab, setActiveTab] = useState<TabID>('mpr');

    const [resizingPanel, setResizingPanel] = useState<'settings' | null>(null); // Only 'settings' is needed
    const dragInfo = useRef({ initialPos: 0, initialSize: 0 });

    // State for your volume data
    const [volumeInfo, setVolumeInfo] = useState<VolumeInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, panel: 'settings') => { // Only 'settings'
        e.preventDefault();
        setResizingPanel(panel);
        
        // 'settings'
        dragInfo.current.initialPos = e.clientX;
        dragInfo.current.initialSize = settingsSidebarWidth;
    };

    const handleMouseUp = useCallback(() => {
        setResizingPanel(null);
    }, []);
    
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!resizingPanel) return;
        
        if (resizingPanel === 'settings') {
            const delta = e.clientX - dragInfo.current.initialPos;
            const newWidth = dragInfo.current.initialSize - delta;
            if (newWidth >= 280 && newWidth <= 600) {
                setSettingsSidebarWidth(newWidth);
            }
        }
    }, [resizingPanel, settingsSidebarWidth]); // Simplified dependencies

    useEffect(() => {
        if (resizingPanel) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingPanel, handleMouseMove, handleMouseUp]);


    // Add a ref for our hidden file input
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            try {
                setIsLoading(true); // Set loading state
                setVolumeInfo(null); // Clear any old data
                
                // 1. Get the raw API response
                const result = await uploadDicom(files);

                // 2. Decode the Base64 data
                const binaryString = atob(result.voxelData);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                // 3. Re-interpret the buffer as a SIGNED 16-bit array
                const decodedVolumeData = new Int16Array(bytes.buffer);

                // 4. Store everything in our state
                setVolumeInfo({
                    dimensions: result.dimensions,
                    voxelSpacing: result.voxelSpacing,
                    volumeData: decodedVolumeData
                });
                
            } catch (error) {
                console.error('Upload failed in the component.');
            } finally {
                setIsLoading(false); // Unset loading state
            }
        }
    };

    // This is the function the button will call
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };


    return (
        <div className="visualizer-container">
            <header className="top-bar">
                <div className="top-bar-left">
                    <span className="app-title">DICOMIZER</span>
                    <button className="top-bar-btn" onClick={handleUploadClick}>Upload DICOM</button>
                    <button className="top-bar-btn">Export Render</button>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    accept=".dcm"
                    multiple
                />
                <div className="top-bar-right">
                    <a href="https://github.com/Fedmichard/Fullstack-Visualizer" target="_blank" rel="noopener noreferrer" className="top-bar-link">
                        <img src={githubIcon} alt="GitHub Repository" />
                    </a>
                    <a href="https://www.linkedin.com/in/fedmichard/" target="_blank" rel="noopener noreferrer" className="top-bar-link">
                        <img src={linkedinIcon} alt="LinkedIn Profile" />
                    </a>
                </div>
            </header>
            
            <main className='app-layout'>
                <section className='renderer'>
                    {!volumeInfo && !isLoading && (
                        <div className="placeholder-content">
                            <h1>Renderer Placeholder</h1>
                            <p>Please upload a DICOM series to begin.</p>
                        </div>
                    )}
                    {isLoading && (
                        <div className="placeholder-content">
                            <h1>Loading & Processing...</h1>
                            <p>This may take a moment.</p>
                        </div>
                    )}
                    {volumeInfo && (
                        <WebGPURenderer volumeInfo={volumeInfo} />
                    )}
                </section>
                
                {/* --- Right Sidebar --- */}
                <section className='rightbar' style={{ width: `${settingsSidebarWidth}px` }}>
                    <div className="resizer" onMouseDown={(e) => handleMouseDown(e, 'settings')}></div>
                    
                    <div className="rightbar-content">

                        {/* --- Tab Bar --- */}
                        <div className="tab-bar">
                            <button
                                className={`tab-button ${activeTab === 'mpr' ? 'active' : ''}`}
                                onClick={() => setActiveTab('mpr')}
                            >
                                2D Views
                            </button>
                            <button
                                className={`tab-button ${activeTab === 'metadata' ? 'active' : ''}`}
                                onClick={() => setActiveTab('metadata')}
                            >
                                Metadata
                            </button>
                            <button
                                className={`tab-button ${activeTab === 'render' ? 'active' : ''}`}
                                onClick={() => setActiveTab('render')}
                            >
                                Settings
                            </button>
                        </div>

                        {/* --- Tab Content Area --- */}
                        <div className="tab-content-area">
                            
                            {/* --- Panel 1: MPR --- */}
                            {activeTab === 'mpr' && (
                                <div className="mpr-panel">
                                    <h3>2D Views</h3>
                                    {volumeInfo && (
                                        <div className="mpr-grid">
                                            <div className="mpr-view">
                                                <label>Axial</label>
                                                <AxialView
                                                    volumeData={volumeInfo.volumeData}
                                                    dimensions={volumeInfo.dimensions}
                                                    sliceIndex={Math.floor(volumeInfo.dimensions[2] / 2)} // Z-axis
                                                />
                                            </div>
                                            <div className="mpr-view">
                                                <label>Sagittal</label>
                                                <SagittalView
                                                    volumeData={volumeInfo.volumeData}
                                                    dimensions={volumeInfo.dimensions}
                                                    sliceIndex={Math.floor(volumeInfo.dimensions[0] / 2)} // X-axis
                                                />
                                            </div>
                                            <div className="mpr-view">
                                                <label>Coronal</label>
                                                <CoronalView
                                                    volumeData={volumeInfo.volumeData}
                                                    dimensions={volumeInfo.dimensions}
                                                    sliceIndex={Math.floor(volumeInfo.dimensions[1] / 2)} // Y-axis
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {(!volumeInfo || isLoading) && (
                                        <div className="image-item-placeholder">
                                            <p>{isLoading ? 'Loading...' : 'Upload data to see 2D views'}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* --- Panel 2: Metadata --- */}
                            {activeTab === 'metadata' && (
                                <div className="metadata-panel">
                                    <h3>Metadata</h3>
                                    <p>Patient ID: 12345</p>
                                    <p>Study Date: 2025-09-30</p>
                                </div>
                            )}

                            {/* --- Panel 3: Render Settings --- */}
                            {activeTab === 'render' && (
                                <div className="render-settings-panel">
                                    <h3>Render Settings</h3>
                                    <p>Brightness: 100%</p>
                                    <p>Contrast: 100%</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default App;