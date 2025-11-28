import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Book } from 'lucide-react';
import CreamCard from './CreamCard';

const Layout = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen w-full bg-cream-bg relative z-0">
      <div className="p-6 max-w-md mx-auto pb-24">
        {/* 顶部导航 */}
        <div className="flex justify-between items-center mb-6">
          {!isHome ? (
             <Link to="/">
               <CreamCard className="!p-3 !rounded-full active:scale-95 transition-transform">
                 <Home size={20} className="text-cream-text/70" />
               </CreamCard>
             </Link>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-cream-text">Bonjour,</h1>
              <p className="text-cream-text/60">今天学点什么？</p>
            </div>
          )}
          
          {/* 头像 */}
          <div className="w-12 h-12 rounded-full bg-cream-accent overflow-hidden shadow-inner-light border-2 border-white">
             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" />
          </div>
        </div>

        {/* 主要内容区 */}
        <main className="relative z-10 fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;