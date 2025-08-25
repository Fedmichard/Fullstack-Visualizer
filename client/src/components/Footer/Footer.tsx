import React from "react";
import './style.css'

const Footer = () => {
    return (
        <footer className="footer">
        <p>© {new Date().getFullYear()} Dicompose — Built with React, .NET, and WebGPU</p>
        <div className="footer-links">
            <a href="https://www.linkedin.com/in/fedmichard/">LinkedIn</a> · 
            <a href="https://github.com/Fedmichard">GitHub</a>
        </div>
        </footer>
    )
}

export default Footer;