import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { useApp } from '../../AppContext';
import { Tab } from '../../types';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { activeTab, setActiveTab } = useApp();
  const [direction, setDirection] = useState(0);

  const TABS: Tab[] = ['notes', 'expenses', 'habits', 'calendar'];

  const handleDragEnd = (_: any, info: any) => {
    const threshold = 50; 
    const currentIndex = TABS.indexOf(activeTab);
    
    if (info.offset.x > threshold) {
      setDirection(-1);
      const prevIndex = (currentIndex - 1 + TABS.length) % TABS.length;
      setActiveTab(TABS[prevIndex]);
    } else if (info.offset.x < -threshold) {
      setDirection(1);
      const nextIndex = (currentIndex + 1) % TABS.length;
      setActiveTab(TABS[nextIndex]);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.98
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0,
      scale: 0.98
    })
  };

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden select-none relative font-sans">
      <Header />

      <main className="flex-1 relative overflow-hidden bg-gray-50/50">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={activeTab}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.4}
            dragDirectionLock
            onDragEnd={handleDragEnd}
            className="absolute inset-0 overflow-hidden touch-pan-y"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
};
