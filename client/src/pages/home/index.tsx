import React from "react";
import "./style.css";

import heroShot from "../../assets/photo.png";
import logo from "../../assets/dicompose.png";
import pfp from "../../assets/pfp.jpeg";

const Home = () => {
  return (
    <main className="home">
      {/* Hero */}
      <section className="hero container">
        <div className="hero__copy">
          <h1>
            Visualize <span className="accent">DICOM</span> in 3D.
          </h1>
          <p className="subhead">
            A WebGPU-powered visualizer for radiology workflows—built for clarity,
            performance, and accessibility.
          </p>
          <div className="cta-row">
            <a className="btn btn-primary" href="/Application">Try it now →</a>
            <a className="btn btn-ghost" href="#features">Explore features</a>
          </div>
          <ul className="hero__bullets">
            <li>3D volume & surface rendering</li>
            <li>Slice viewer with window/level</li>
            <li>.NET 8 backend • Postgres</li>
          </ul>
        </div>
        <figure className="hero__media">
          <img src={heroShot} alt="3D medical volume preview" />
          <figcaption>Real-time volume preview (sample)</figcaption>
        </figure>
      </section>

      {/* Value props */}
      <section id="features" className="features container">
        <h2>Key capabilities</h2>
        <div className="grid">
          <article className="card">
            <h3>3D Model Navigation</h3>
            <p>Rotate, pan, and zoom smooth 60+ FPS with WebGPU.</p>
          </article>
          <article className="card">
            <h3>Window / Level</h3>
            <p>Clinical presets and fine control for HU visualization.</p>
          </article>
          <article className="card">
            <h3>Slice Viewer</h3>
            <p>Linked axial/coronal/sagittal slicing with snapping.</p>
          </article>
          <article className="card">
            <h3>DICOM In / Out</h3>
            <p>Upload studies, convert to volumes, export models.</p>
          </article>
          <article className="card">
            <h3>Surface Extraction</h3>
            <p>Voxel volume → Marching Cubes meshes for sharing.</p>
          </article>
          <article className="card">
            <h3>Project-Ready</h3>
            <p>.NET 8 API, Postgres storage, auth-ready layout.</p>
          </article>
        </div>
      </section>

      {/* How it works */}
      <section className="flow container">
        <h2>How it works</h2>
        <ol className="steps">
          <li>
            <span>1</span>
            <div>
              <h4>Upload DICOM series</h4>
              <p>Studies are validated and queued for processing.</p>
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              <h4>Volume building</h4>
              <p>Backend assembles voxel volume & normalizes spacing.</p>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <h4>Render & explore</h4>
              <p>WebGPU renders the volume or extracted surface in real time.</p>
            </div>
          </li>
          <li>
            <span>4</span>
            <div>
              <h4>Export</h4>
              <p>Save images, slices, or meshes for sharing and review.</p>
            </div>
          </li>
        </ol>
      </section>

      {/* About within home */}
      <section className="about container">
        <div className="about__media">
          <img src={pfp} alt="Profile" />
        </div>
        <div className="about__copy">
          <h2>About the project</h2>
          <p>
            Hi, I’m <strong>Fedmichard Francois</strong>. I’m building a focused,
            clinician-friendly 3D DICOM visualizer. The goal: fast interaction,
            clear visuals, and simple exporting—without heavyweight installs.
          </p>
          <ul className="tags">
            <li>React + TypeScript</li>
            <li>WebGPU</li>
            <li>.NET 8 (C# 12)</li>
            <li>Postgres</li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="cta container">
        <div className="cta__box">
          <img className="cta__logo" src={logo} alt="Logo" />
          <div>
            <h3>Ready to explore your studies in 3D?</h3>
            <p>Upload a DICOM series and start navigating in seconds.</p>
          </div>
          <a className="btn btn-primary" href="/Application">Launch Visualizer</a>
        </div>
      </section>
    </main>
  );
};

export default Home;