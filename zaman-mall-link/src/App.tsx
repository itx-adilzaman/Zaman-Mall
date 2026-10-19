/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Contact from './components/Contact';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="relative min-h-screen overflow-x-hidden selection:bg-gold selection:text-black bg-luxury-black">
      <Navbar />
      
      <main className="relative">
        <Hero />
        
        {/* Decorative divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent my-12" />
        
        <Contact />
      </main>

      <Footer />
    </div>
  );
}
