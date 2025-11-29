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

export interface RenderSettings {
    windowMin: number;
    windowMax: number;
    contrast: number;
    opacity: number;
    softness: number;
    stepSize: number;
    clipMinX: number; clipMaxX: number;
    clipMinY: number; clipMaxY: number;
    clipMinZ: number; clipMaxZ: number;
}

const DEFAULT_SETTINGS: RenderSettings = {
    windowMin: -500,
    windowMax: 3000,
    contrast: 1.0,
    opacity: 1.0,
    softness: 0.2,
    stepSize: 512,
    clipMinX: 0.0, clipMaxX: 1.0,
    clipMinY: 0.0, clipMaxY: 1.0,
    clipMinZ: 0.0, clipMaxZ: 1.0,
};

type TabID = 'mpr' | 'render';

function App() {
    const [settingsSidebarWidth, setSettingsSidebarWidth] = useState(300);
    
    const [activeTab, setActiveTab] = useState<TabID>('mpr');

    const [resizingPanel, setResizingPanel] = useState<'settings' | null>(null); // Only 'settings' is needed
    const dragInfo = useRef({ initialPos: 0, initialSize: 0 });

    // State for your volume data
    const [volumeInfo, setVolumeInfo] = useState<VolumeInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // state for settings tab
    const [renderSettings, setRenderSettings] = useState<RenderSettings>(DEFAULT_SETTINGS);

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

    const updateSetting = (key: keyof RenderSettings, value: number) => {
        setRenderSettings(prev => ({ ...prev, [key]: value }));
    };

    // The Reset Handler
    const handleReset = () => {
        setRenderSettings(DEFAULT_SETTINGS);
    };

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
                            <div className="loading-bar-container">
                                <div className="loading-bar-fill"></div>
                            </div>
                            <div className="loading-text">LOADING VOLUME...</div>
                        </div>
                    )}
                    {volumeInfo && (
                        <WebGPURenderer
                        volumeInfo={volumeInfo}
                        settings={renderSettings}
                        />
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
                                    <div className="panel-section-title">2D Views</div>
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

                            {/* --- Panel 2: Render Settings --- */}
                            {activeTab === 'render' && (
                                <div className="render-settings-panel">

                                <div className="panel-header-row">
                                    <div className="panel-section-title">Render Settings</div>
                                    <button className="reset-btn" onClick={handleReset}>
                                        Reset
                                    </button>
                                </div>
                                {/* Window Min */}
                                <div className="setting-group">
                                    <div className="setting-header">
                                        <label>Window Min</label>
                                        <span className="setting-value">{renderSettings.windowMin} HU</span>
                                    </div>
                                    <input 
                                        type="range" min="-2000" max="4000" step="10"
                                        value={renderSettings.windowMin}
                                        onChange={(e) => updateSetting('windowMin', Number(e.target.value))}
                                    />
                                </div>

                                {/* Window Max */}
                                <div className="setting-group">
                                    <div className="setting-header">
                                        <label>Window Max</label>
                                        <span className="setting-value">{renderSettings.windowMax} HU</span>
                                    </div>
                                    <input 
                                        type="range" min="-2000" max="4000" step="10"
                                        value={renderSettings.windowMax}
                                        onChange={(e) => updateSetting('windowMax', Number(e.target.value))}
                                    />
                                </div>

                                {/* Contrast Factor */}
                                <div className="setting-group">
                                    <div className="setting-header">
                                        <label>Contrast Factor</label>
                                        <span className="setting-value">{renderSettings.contrast.toFixed(2)}</span>
                                    </div>
                                    <input 
                                        type="range" min="0.1" max="3.0" step="0.1"
                                        value={renderSettings.contrast}
                                        onChange={(e) => updateSetting('contrast', Number(e.target.value))}
                                    />
                                </div>

                                {/* Opacity Strength */}
                                <div className="setting-group">
                                    <div className="setting-header">
                                        <label>Opacity Strength</label>
                                        <span className="setting-value">{renderSettings.opacity.toFixed(2)}</span>
                                    </div>
                                    <input 
                                        type="range" min="0.0" max="2.0" step="0.01"
                                        value={renderSettings.opacity}
                                        onChange={(e) => updateSetting('opacity', Number(e.target.value))}
                                    />
                                </div>

                                {/* Softness */}
                                <div className="setting-group">
                                    <div className="setting-header">
                                        <label>Softness</label>
                                        <span className="setting-value">{renderSettings.softness.toFixed(2)}</span>
                                    </div>
                                    <input 
                                        type="range" min="0.0" max="1.0" step="0.01"
                                        value={renderSettings.softness}
                                        onChange={(e) => updateSetting('softness', Number(e.target.value))}
                                    />
                                </div>

                                {/* Step Size */}
                                <div className="setting-group">
                                    <div className="setting-header">
                                        <label>Step Size</label>
                                        <span className="setting-value">{renderSettings.stepSize.toFixed(2)}</span>
                                    </div>
                                    <input 
                                        type="range" min="0" max="4096" step="64"
                                        value={renderSettings.stepSize}
                                        onChange={(e) => updateSetting('stepSize', Number(e.target.value))}
                                    />
                                </div>

                                <hr className="panel-divider" />
                                <div className="panel-section-title">Ray-Box Clip Settings</div>

                                {/* Ray Box Intersection Clipping */}
                                {/* X-AXIS GROUP */}
                                <div className="axis-group">
                                    <span className="axis-group-label">X AXIS CLIP</span>
                                    
                                    {/* ClipMinX */}
                                    <div className="setting-group" style={{ marginBottom: '0.5rem' }}>
                                        <div className="setting-header">
                                            <label>Min</label>
                                            <span className="setting-value">{renderSettings.clipMinX.toFixed(2)}</span>
                                        </div>
                                        <input 
                                            type="range" min="0.0" max="1.0" step="0.01"
                                            value={renderSettings.clipMinX}
                                            onChange={(e) => updateSetting('clipMinX', Number(e.target.value))}
                                        />
                                    </div>

                                    {/* ClipMaxX */}
                                    <div className="setting-group" style={{ marginBottom: 0 }}>
                                        <div className="setting-header">
                                            <label>Max</label>
                                            <span className="setting-value">{renderSettings.clipMaxX.toFixed(2)}</span>
                                        </div>
                                        <input 
                                            type="range" min="0.0" max="1.0" step="0.01"
                                            value={renderSettings.clipMaxX}
                                            onChange={(e) => updateSetting('clipMaxX', Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                {/* Y-AXIS GROUP */}
                                <div className="axis-group">
                                    <span className="axis-group-label">Y AXIS CLIP</span>
                                    
                                    {/* ClipMinY */}
                                    <div className="setting-group" style={{ marginBottom: '0.5rem' }}>
                                        <div className="setting-header">
                                            <label>Min</label>
                                            <span className="setting-value">{renderSettings.clipMinY.toFixed(2)}</span>
                                        </div>
                                        <input 
                                            type="range" min="0.0" max="1.0" step="0.01"
                                            value={renderSettings.clipMinY}
                                            onChange={(e) => updateSetting('clipMinY', Number(e.target.value))}
                                        />
                                    </div>

                                    {/* ClipMaxY */}
                                    <div className="setting-group" style={{ marginBottom: 0 }}>
                                        <div className="setting-header">
                                            <label>Max</label>
                                            <span className="setting-value">{renderSettings.clipMaxY.toFixed(2)}</span>
                                        </div>
                                        <input 
                                            type="range" min="0.0" max="1.0" step="0.01"
                                            value={renderSettings.clipMaxY}
                                            onChange={(e) => updateSetting('clipMaxY', Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                {/* Z-AXIS GROUP */}
                                <div className="axis-group">
                                    <span className="axis-group-label">Z AXIS CLIP</span>
                                    
                                    {/* ClipMinZ */}
                                    <div className="setting-group" style={{ marginBottom: '0.5rem' }}>
                                        <div className="setting-header">
                                            <label>Min</label>
                                            <span className="setting-value">{renderSettings.clipMinZ.toFixed(2)}</span>
                                        </div>
                                        <input 
                                            type="range" min="0.0" max="1.0" step="0.01"
                                            value={renderSettings.clipMinZ}
                                            onChange={(e) => updateSetting('clipMinZ', Number(e.target.value))}
                                        />
                                    </div>

                                    {/* ClipMaxZ */}
                                    <div className="setting-group" style={{ marginBottom: 0 }}>
                                        <div className="setting-header">
                                            <label>Max</label>
                                            <span className="setting-value">{renderSettings.clipMaxZ.toFixed(2)}</span>
                                        </div>
                                        <input 
                                            type="range" min="0.0" max="1.0" step="0.01"
                                            value={renderSettings.clipMaxZ}
                                            onChange={(e) => updateSetting('clipMaxZ', Number(e.target.value))}
                                        />
                                    </div>
                                </div>
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