import React from 'react';
import { Outlet } from 'react-router-dom';
import CookieConsent from '../components/CookieConsent';

const AppLayout = () => {
  return (
    <>
      <Outlet />
      <CookieConsent />
    </>
  );
};

export default AppLayout;