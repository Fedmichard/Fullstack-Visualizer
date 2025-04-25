import React from "react";

import './style.css'

import logo from '../../assets/TypeVisMedical.png';
import github from '../../assets/github.png';
import linkedin from '../../assets/linkedin.png';

const NavBar = () => {
    return (
        <header className="header">
            <img src={logo} alt="My logo" height="60em"/>
            <nav>
                <ul className="nav-list">
                    <li className="nav-list-item">About</li>
                    <li className="nav-list-item">
                        <a href="https://www.linkedin.com/in/fedmichard/">
                            <img src={linkedin} alt="Fedmichard Francois" width="25em" />
                        </a>
                    </li>
                    <li className="nav-list-item">
                        <a href="https://github.com/Fedmichard">
                            <img src={github} alt="Fedmichard" width="25em" />
                        </a>
                    </li>
                </ul>
            </nav>
        </header>
    )
}

export default NavBar;