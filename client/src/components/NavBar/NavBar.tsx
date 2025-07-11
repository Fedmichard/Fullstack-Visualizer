import React from "react";

import './style.css'

import logo from '../../assets/dicompose.png';
import github from '../../assets/github.png';
import linkedin from '../../assets/linkedin.png';

const NavBar = () => {
    return (
        <header className="header">
            <div className="nav-left">
                <a href="/"><img src={logo} alt="My logo" width="150em"/></a>
            </div>

            <nav className="nav-center">
                <ul className="nav-list">
                    <li className="nav-list-item">
                        <a href="/"> Home </a>
                    </li>
                    <li className="nav-list-item">
                        <a href="/About"> About </a>
                    </li>
                    <li className="nav-list-item">
                        <a href="https://www.linkedin.com/in/fedmichard/"> LinkedIn </a>
                    </li>
                    <li className="nav-list-item">
                        <a href="https://github.com/Fedmichard"> GitHub </a>
                    </li>
                </ul>
            </nav>

            <div className="nav-right">
                <a href="/Application">
                    <button> Try Now → </button>
                </a>
            </div>
        </header>
    )
}

export default NavBar;