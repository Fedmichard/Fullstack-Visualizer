import React, { useState } from 'react'; 
import './style.css';

import MoveBtn from '../../assets/Tools/move-button.png';

const Application = () => {
    const [activeTab, setActiveTab] = useState("Metadata");

    return (
        <main className='app-layout'>
            {/* Toolbar (left) */}
            <section className='toolbar'>
                <div className='tools'>
                    {[...Array(6)].map((_, i) => (
                        <button className='toolbtn' key={i}>
                            <img src={MoveBtn} alt='tool' width='20px'/>
                        </button>
                    ))}
                </div>
            </section>

            {/* Renderer (center) */}
            <section className='renderer'>
                <h1>Renderer Placeholder</h1>
            </section>

            {/* Rightbar (right) */}
            <section className='rightbar'>
                {/* Top with tabs */}
                <div className="rightbar-top">
                    <div className="tabs">
                        <button 
                            className={`tab ${activeTab === "Metadata" ? "active" : ""}`} 
                            onClick={() => setActiveTab("Metadata")}
                        >
                            Metadata
                        </button>
                        <button 
                            className={`tab ${activeTab === "Export" ? "active" : ""}`} 
                            onClick={() => setActiveTab("Export")}
                        >
                            Export
                        </button>
                    </div>
                    <div className="tab-content">
                        {activeTab === "Metadata" && (
                            <div>
                                <h3>Image Metadata</h3>
                                <p>Patient ID: 12345</p>
                                <p>Modality: CT</p>
                                <button>Import New Series</button>
                            </div>
                        )}
                        {activeTab === "Export" && (
                            <div>
                                <h3>Export Settings</h3>
                                <p>Format: OBJ / STL</p>
                                <button>Export 3D Render</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom image grid */}
                <div className="rightbar-bottom">
                    <h3>Image Grid</h3>
                    <div className="image-grid">
                        {[...Array(6)].map((_, i) => (
                            <div className="image-item" key={i}>
                                <p>DICOM {i+1}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    )
}

export default Application;