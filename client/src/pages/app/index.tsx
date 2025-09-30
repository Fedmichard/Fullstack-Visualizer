import React, { useState, useEffect, useCallback, useRef } from 'react';
import './style.css';

// Import the icons from your assets folder
import githubIcon from '../../assets/github.png';
import linkedinIcon from '../../assets/linkedin.png';

const TopBar = () => {
    return (
        <header className="top-bar">
            <div className="top-bar-left">
                <span className="app-title">DICOMIZER</span>
                <button className="top-bar-btn">Upload DICOM</button>
                <button className="top-bar-btn">Export Render</button>
            </div>
            <div className="top-bar-right">
                {/* Updated links with images */}
                <a href="https://github.com/Fedmichard/Fullstack-Visualizer" target="_blank" rel="noopener noreferrer" className="top-bar-link">
                    <img src={githubIcon} alt="GitHub Repository" />
                </a>
                <a href="https://www.linkedin.com/in/fedmichard/" target="_blank" rel="noopener noreferrer" className="top-bar-link">
                    <img src={linkedinIcon} alt="LinkedIn Profile" />
                </a>
            </div>
        </header>
    );
};

function App() {
    // State for panel dimensions
    const [settingsSidebarWidth, setSettingsSidebarWidth] = useState(280);
    const [imageSidebarWidth, setImageSidebarWidth] = useState(300);
    const [metadataPanelHeight, setMetadataPanelHeight] = useState(250);

    // ... (The rest of the App component remains unchanged) ...
    const [resizingPanel, setResizingPanel] = useState<'image' | 'settings' | 'vertical' | null>(null);
    const dragInfo = useRef({ initialPos: 0, initialSize: 0 });

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, panel: 'image' | 'settings' | 'vertical') => {
        e.preventDefault();
        setResizingPanel(panel);
        
        if (panel === 'vertical') {
            dragInfo.current.initialPos = e.clientY;
            dragInfo.current.initialSize = metadataPanelHeight;
        } else {
            dragInfo.current.initialPos = e.clientX;
            dragInfo.current.initialSize = panel === 'image' ? imageSidebarWidth : settingsSidebarWidth;
        }
    };

    const handleMouseUp = useCallback(() => {
        setResizingPanel(null);
    }, []);
    
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!resizingPanel) return;

        if (resizingPanel === 'vertical') {
            const delta = e.clientY - dragInfo.current.initialPos;
            const newHeight = dragInfo.current.initialSize + delta;
            if (newHeight >= 100 && newHeight <= 600) {
                setMetadataPanelHeight(newHeight);
            }
        } else {
            const delta = e.clientX - dragInfo.current.initialPos;
            const newWidth = dragInfo.current.initialSize - delta;
            if (resizingPanel === 'image') {
                if (newWidth >= 100 && newWidth <= 300) {
                    setImageSidebarWidth(newWidth);
                }
            } else if (resizingPanel === 'settings') {
                if (newWidth >= 280 && newWidth <= 600) {
                    setSettingsSidebarWidth(newWidth);
                }
            }
        }
    }, [resizingPanel]);

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

    return (
        <div className="visualizer-container">
            <TopBar />
            
            <main className='app-layout'>
                <section className='renderer'>
                    <h1>Renderer Placeholder</h1>
                </section>

                <section className='image-sidebar' style={{ width: `${imageSidebarWidth}px` }}>
                    <div className="resizer" onMouseDown={(e) => handleMouseDown(e, 'image')}></div>
                    <h3>Image Slices</h3>
                    <div className="image-grid">
                        {[...Array(24)].map((_, i) => (
                            <div className="image-item" key={i}>
                                <p>Img {i+1}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className='rightbar' style={{ width: `${settingsSidebarWidth}px` }}>
                    <div className="resizer" onMouseDown={(e) => handleMouseDown(e, 'settings')}></div>
                    <div className="rightbar-content">
                        <div className="metadata-panel" style={{ height: `${metadataPanelHeight}px` }}>
                            <h3>Metadata</h3>
                            <p>Patient ID: 12345</p>
                            <p>Study Date: 2025-09-30</p>
                        </div>

                        <div className="resizer-horizontal" onMouseDown={(e) => handleMouseDown(e, 'vertical')}></div>

                        <div className="render-settings-panel">
                            <h3>Render Settings</h3>
                            <p>Brightness: 100%</p>
                            <p>Contrast: 100%</p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default App;