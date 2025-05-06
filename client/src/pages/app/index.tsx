import React from 'react'; 

import './style.css';

import MoveBtn from '../../assets/Tools/move-button.png'

const Application = () => {
    return (
        <main className='flexbox'>
            <section className='toolbar'>
                <div className='tools'>
                    <button className='toolbtn'>
                        <img src={MoveBtn} alt='' width='20px'/>
                    </button>
                    <button className='toolbtn'>
                        <img src={MoveBtn} alt='' width='20px'/>
                    </button>
                    <button className='toolbtn'>
                        <img src={MoveBtn} alt='' width='20px'/>
                    </button>
                    <button className='toolbtn'>
                        <img src={MoveBtn} alt='' width='20px'/>
                    </button>
                    <button className='toolbtn'>
                            <img src={MoveBtn} alt='' width='20px'/>
                    </button>
                    <button className='toolbtn'>
                            <img src={MoveBtn} alt='' width='20px'/>
                    </button>
                </div>
            </section>
            <section className='renderer'>
                <h1>Application</h1>
            </section>
            <section className='rightbar'>
                <h1>Rightbar</h1>
            </section>
        </main>
    )
}

export default Application;