import React from 'react';
import Door from '@/components/Door';
import Index from './Index';

/**
 * HomePage wraps the existing Index (landing) page with a one-time per-session
 * door entrance animation. This file is intentionally separate so we don't
 * modify `App.tsx` or `main.tsx` directly per the requirement.
 */
const HomePage: React.FC = () => {
  return (
    <>
      <Door />
      <Index />
    </>
  );
};

export default HomePage;
