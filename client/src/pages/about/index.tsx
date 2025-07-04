import React from 'react';

import './style.css';

import github from '../../assets/github.png';
import linkedin from '../../assets/linkedin.png';
import pfp from '../../assets/pfp.jpeg';

const About = () => {
    return (
        <main className='about-container'>
            <section className='about-me'>
                <h1>About Me!</h1>
                <img src={pfp}  />
                <a>Fedmichard Francois!</a>
            </section>
            <section className='about-more'>
                <h1>Another Ting!</h1>
            </section>
            <section className='about-tech'>
                <h1>Another Ting!</h1>
            </section>
            <section className='about-roadmap'>
                <h1>Another Ting!</h1>
            </section>
        </main>
    )
}

export default About;