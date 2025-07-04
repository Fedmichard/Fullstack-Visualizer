import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';

import './App.css'

import NavBar from './components/NavBar/NavBar';
import Footer from './components/Footer/Footer';

import Home from './pages/home';
import About from './pages/about';
import Application from './pages/app';

function App() {
  return (
    <BrowserRouter>
      <div className='App'>
        
        {/* Header + Pages */}
        <div className='app-container'>
          <NavBar />
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/About' element={<About />} />
          </Routes>
        </div>
        {/* Renderer */}
        <div className='application-container'>
          <Routes>
            <Route path='/Application' element={<Application />} />
          </Routes>
        </div>
        {/* Footer */}
        <div className='app-container'>
          <Footer />
        </div>
        

      </div>
    </BrowserRouter>
  );
}

export default App;
