import React from 'react';

import './App.css'

import NavBar from './components/NavBar/NavBar';
import Footer from './components/Footer/Footer';

import About from './pages/about';

function App() {
  return (
    <div className="App">
      <div className="app-container">
      <NavBar />
      <About />
      <Footer />
    </div>
  </div>
  );
}

export default App;
