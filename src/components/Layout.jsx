import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import CreamCard from './CreamCard';

const Layout = ({ children, showHomeBtn = false }) => {
  return (
    <div className="min-h-screen p-6 max-w-md mx-auto pb-24 relative">
      <div className="flex justify-between items-center mb-8">
        {showHomeBtn ? (
           <Link to="/">
             <CreamCard className="!p-3 !rounded-full">
               <Home size={20} className="text-cream-text/70" />
             </CreamCard>
           </Link>
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-cream-text">Bonjour,</h1>
            <p className="text-cream-text/60">开始今天的法语积累吧</p>
          </div>
        )}
        <div className="w-12 h-12 rounded-full bg-cream-accent overflow-hidden shadow-inner-light border-2 border-white">
           <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" />
        </div>
      </div>
      <main>{children}</main>
    </div>
  );
};

export default Layout;