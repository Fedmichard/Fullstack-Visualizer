import React from 'react'
import './style.css'

import photo from '../../assets/photo.png';

const Home = () => {
    return (
        <main className='home-container'>
            <section className='app-info'>
                <h3>Visualize Medical Imaging in 3D Like Never Before</h3>
                <h1>A WebGPU-powered, real-time medical imaging visualizer built for accessibility, performance, and clarity.</h1>
                <a href='/Application'>Try it out!</a>
            </section>
            <section className='screenshot'>
                <img src={photo} width="600px"></img>
            </section>
            <section className='key-features'>
                <ul className='feature-list'>
                    <li>🔍 3D Model Navigation</li>
                    <li>🎚️ Window/Level Controls</li>
                    <li>🧠 Slice Viewer</li>
                    <li>🚀 Powered by WebGPU</li>
                    <li>⚙️ .NET 8 Backend Integration</li>
                </ul>
            </section>
            <section className='use-case'>
                <h1>Next Stop!</h1>
                <h2>And another thing!</h2>
            </section>
        </main>
    )
}

export default Home;