import { useLayoutEffect, FC } from 'react';
import { Outlet } from 'react-router-dom';
import { useRefreshQuery } from '../api/userApi';
import { useTypedSelector } from '../hooks/useTypedStore';
import { LazyMotion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';



const getMetaTagThemeColor = () => {
  const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-main-color');
  return themeColor;
}

const MainLayout : FC = () => {

   const { theme } = useTypedSelector(state => state.themeReducer);

   const _ = useRefreshQuery(undefined, {skip: !localStorage.getItem('accessToken')});

  useLayoutEffect(() => {
   const theme = localStorage.getItem('theme') || 'light';
   document.documentElement.setAttribute('data-theme', theme);
  }, []);

   return (
   <LazyMotion features={() => import('../shared/helpres/getLazyDomAnimations').then(res => res.default)}>
    <Helmet>
      <meta name="theme-color" content={getMetaTagThemeColor()} />
      <meta name="color-scheme" content={theme} />
    </Helmet>
    <Outlet />
   </LazyMotion>
   )
}

export default MainLayout;