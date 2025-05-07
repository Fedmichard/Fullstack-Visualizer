import React from 'react'
import './style.css'

const Home = () => {
    return (
        <main className='home-container'>
            <section className='app-info'>
                <h1>Home Page!</h1>
                <h2><a href='/Application'>Click here to test my app!</a></h2>
            </section>
            <section className='more-info'>
                <h1>Next Stop!</h1>
                <h2>And another thing!</h2>
            </section>
        </main>
    )
}

export default Home;