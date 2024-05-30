import { useEffect, useRef } from 'react';
import { useTypedSelector, useTypedDispatch } from '../../../hooks/useTypedStore';
import { themeSlice } from '../../../store/redusers/themeReducer';
import { flushSync } from 'react-dom';
import { m } from 'framer-motion'
import { ReactComponent as Moon } from '../../../assets/images/moon.svg';
import { ReactComponent as Sun } from '../../../assets/images/sun.svg';
import cl from './ThemeSwitcher.module.scss';

const ThemeSwitcher = () => {

  const { theme } = useTypedSelector(state => state.themeReducer);

  const dispatch = useTypedDispatch();

  const switcherRef = useRef<HTMLDivElement>(null);

  const toggleTheme = async () => {
    if (!document.startViewTransition || !switcherRef.current) {
      dispatch(themeSlice.actions.toggleTheme());
      return;
    }
     await document.startViewTransition(() => {
        flushSync(() => dispatch(themeSlice.actions.toggleTheme()));
     }).ready;

     const {top, left, width, height} = switcherRef.current.getBoundingClientRect();
     
     const right = window.innerWidth - left;
     const bottom = window.innerHeight - top;
     const maxRadius = Math.hypot(Math.max(left, right), Math.max(top, bottom));

     document.documentElement.animate({
       clipPath: [
         `circle(0px at ${left + width / 2}px ${top + height / 2}px)`,
         `circle(${maxRadius + 500}px at ${left + width / 2}px ${top + height / 2}px)`,
       ],
     },
     {
      duration: 700,
      easing: "ease",
      pseudoElement: "::view-transition-new(root)"
     }
     );
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div
    title="Сменить тему"
    role="switch"
    aria-label="Сменить тему оформления"
    aria-checked={theme === 'dark'}
    className={cl.themeSwitcher} 
    onClick={toggleTheme} ref={switcherRef}>
    <m.span
    animate={theme === 'dark' ? {x: 0} : {x: 35}} 
    className={cl.themeToggler}>
    {theme === 'light' ? <Sun /> : <Moon />}
    </m.span>
    </div>
  )
}

export default ThemeSwitcher