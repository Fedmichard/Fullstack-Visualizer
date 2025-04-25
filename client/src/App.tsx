import React from 'react';
import logo from './logo.svg';

import './App.css';

import NavBar from './components/NavBar';
import Footer from './components/Footer';

import About from './pages/about';

function App() {
  return (
    <div className="App">
      <NavBar />
      <About />
      <Footer />
    </div>
  );
}

export default App;
