import { useState, useRef, useEffect, lazy, FC } from 'react';
import { IHeaderProps } from '../../modules/UserHeader';
import { NavLink, useNavigate  } from 'react-router-dom';
import { FaChevronDown, FaRegCircleUser, FaPalette } from 'react-icons/fa6';
import { LuMessagesSquare } from "react-icons/lu";
import { IoSettingsSharp } from "react-icons/io5";
import { RiContactsFill } from "react-icons/ri";
import { IoExitOutline } from 'react-icons/io5';
import { IoMdNotificationsOutline } from "react-icons/io";
import { m, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import ThemeSwitcher from '../../shared/UI/ThemeSwitcher';
import { MEDIA_URL } from '../../shared/constants';
import cl from './DesktopHeader.module.scss';

type UserHeaderModalPage = 'contacts' | 'notifications';

const headerVariants = {
  visible: {
    opacity: 1,
    y: 0,
  },
  hidden: {
    opacity: 0,
    y: -100
  }
}

const DesktopHeader : FC<IHeaderProps> = ({
  userMenuOpen,
  setUserMenuOpen,
  setPage,
  setModalPageOpen,
  user,
  userLoading,
  notifications,
  logout
}) => {
    
  const [headerVisible, setHeaderVisible] = useState(false);

  const menuRef = useRef<HTMLUListElement>(null);

  const userMenuRef = useRef<HTMLDivElement>(null);

  const headerRef = useRef<HTMLHeadingElement>(null);

  const redirect = useNavigate();

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
      const previous = scrollY.getPrevious();
    if ((previous && latest > previous && latest > 150) || latest === 0) {
      setHeaderVisible(false);
    } 
    else {
      setHeaderVisible(true);
    }
  });

  const toggleUserMenuOpen = () => setUserMenuOpen(prev => !prev);

  const handleModalOpen = (page: UserHeaderModalPage) => {
    setPage(page);
    setModalPageOpen(true);
  }

  const handleLogout = () => {
    logout();
  }

  const handleRedirectToProfile = () => redirect(`/profile/${user.link}`);

  const userMenuButtonClassName = userMenuOpen ? [cl.userMenuButton, cl.active] : [cl.userMenuButton];

  useEffect(() => {
     if (!userMenuRef.current) return;
     const handleClickOutsideUserMenu = (e: MouseEvent) => {
      if (!userMenuRef.current?.contains(e.target as HTMLElement)) setUserMenuOpen(false);
     }
     window.addEventListener('click', handleClickOutsideUserMenu);
     return () => window.removeEventListener('click', handleClickOutsideUserMenu);
  }, [userMenuRef]);

  useEffect(() => {
    if (!headerRef.current) return;
    const handleMouseMoveOnHeader = (e: MouseEvent) => {
      if (headerRef.current && e.pageY - window.scrollY <= 10 && !headerVisible) {
        setHeaderVisible(true);
      }
    }
    window.addEventListener('mousemove', handleMouseMoveOnHeader);
    return () => window.removeEventListener('mousemove', handleMouseMoveOnHeader);
  }, [headerVisible, headerRef]);

  useEffect(() => {
    if (!headerRef.current) return;
    const header = headerRef.current;
    const handleHeaderMouseOut = () => {
      if (headerVisible) setHeaderVisible(false);
      if (userMenuOpen) setUserMenuOpen(false);
    }
    header.addEventListener('mouseleave', handleHeaderMouseOut);
    return () => header.removeEventListener('mouseleave', handleHeaderMouseOut);
  }, [headerRef, headerVisible, userMenuOpen]);

  return (
     <m.header
     ref={headerRef}
     variants={headerVariants}
     animate={headerVisible ? "visible" : "hidden"} 
     className={cl.profile}>
    <nav ref={menuRef} className={cl.profileLinks}>
    <ul className={cl.linkList}>
    <li title="Диалоги" aria-label="Перейти на к диалогам" className={cl.linkItem}>
    <NavLink to='/'><LuMessagesSquare /></NavLink>
    </li>
    <li title="Контакты"
    role="button" 
    aria-label="Открыть список контактов" 
    onClick={() => handleModalOpen('contacts')} 
    className={cl.linkItem}>
    <RiContactsFill />
    </li>
    <li title="Настройки"
    aria-label="Перейти к настройкам"
    className={cl.linkItem}>
    <NavLink to="/settings"><IoSettingsSharp /></NavLink>
    </li>
   <li title="Уведомления"
   role="button"
   aria-label="Открыть меню уведомлений"
   onClick={() => handleModalOpen('notifications')} 
   className={cl.linkItem}>
   <div className={cl.notifications}>
          <IoMdNotificationsOutline />
          {
            notifications && notifications > 0 
            ? <span className={cl.notificationsCount}>{notifications}</span>
            : null
          }
          </div>
        </li>
      </ul>
    </nav>
    <div ref={userMenuRef} className={cl.userMenu}>
      <div className={cl.userAvatar}>
        <img src={`${MEDIA_URL}/${user.avatar_img}`} alt={`${user.name} ${user.surname}`} />
      </div>
      <button title="Открыть меню пользователя"
      onClick={toggleUserMenuOpen}
      aria-label="Открыть меню пользователя" 
      className={userMenuButtonClassName.join(' ')}>
      {`${user?.name} ${user.surname}`} 
      <FaChevronDown />
      </button>
    <AnimatePresence>
      {
        userMenuOpen && <m.ul
        initial={{opacity: 0, y: -20}}
        animate={{opacity: 1, y: 0}}
        exit={{opacity: 0, y: -20}}
        aria-label="Меню пользователя"
        aria-hidden={!userMenuOpen} 
        className={cl.userDropdownMenu}>
        <li title="Перейти в профиль"
        onClick={handleRedirectToProfile}
        role="button"
        aria-label="Перейти в профиль" 
        className={cl.userDropdownMenuItem}>
          <FaRegCircleUser />
          Профиль
          </li>
          <li title="Сменить тему"
          className={cl.userDropdownMenuItem}>
          <FaPalette />
          <ThemeSwitcher />
        </li>
        <li title="Выйти из аккаунта"
        onClick={handleLogout}
        role="button"
        aria-label="Выйти из аккаунта"
        className={[cl.userDropdownMenuItem, cl.exit].join(' ')}>
          <IoExitOutline />
          Выйти
          </li>
        </m.ul>
      }
    </AnimatePresence>
    </div>
    </m.header>
  )
}

export default DesktopHeader;
