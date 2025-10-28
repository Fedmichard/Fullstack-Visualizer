import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';

import './App.css'

import Application from './pages/app';

function App() {
  return (
    <BrowserRouter>
      <div className='App'>
        <div className='navbar-container'>
        </div>

        <div className='application-container'>
          <Routes>
            <Route path='/' element={<Application />} />
          </Routes>
        </div>

        <div className='app-container'>
          <Routes>
            {/* Empty for now, leaving here if I want to add about page */}
          </Routes>
        </div>
        

      </div>
    </BrowserRouter>
  );
}

export default App;
