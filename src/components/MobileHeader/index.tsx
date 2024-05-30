import { useState, useEffect, useRef, FC } from 'react';
import { IHeaderProps } from '../../modules/UserHeader';
import { NavLink, useNavigate  } from 'react-router-dom';
import { FaChevronDown, FaRegCircleUser, FaPalette, FaBars, FaXmark } from 'react-icons/fa6';
import { LuMessagesSquare } from "react-icons/lu";
import { IoSettingsSharp } from "react-icons/io5";
import { RiContactsFill } from "react-icons/ri";
import { IoExitOutline } from 'react-icons/io5';
import { IoMdNotificationsOutline } from "react-icons/io";
import ThemeSwitcher from '../../shared/UI/ThemeSwitcher';
import { MEDIA_URL } from '../../shared/constants';
import { AnimatePresence, m } from 'framer-motion';
import cl from './MobileHeader.module.scss';

const headerButtonVariants = {
    initial: {
        opacity: 0,
        x: 100
    },
    visible: {
        opacity: 1,
        x: 0,
    },
    hidden: {
        opacity: 0,
    }
}

const headerVariants = {
    initial: {
        x: '100%'
    },
    visible: {
        x: 0,
    },
    hidden: {
        x: '100%',
        transition: {delay: .3}
    }
}

type UserHeaderModalPage = 'contacts' | 'notifications';

const MobileHeader : FC<IHeaderProps> = ({
  userMenuOpen,
  setUserMenuOpen,
  setPage,
  setModalPageOpen,
  user,
  userLoading,
  notifications,
  logout
}) => {

    const [headerVisible, setHeaderVisible] = useState<boolean>(false);

    const [headerButtonVisible, setHeaderButtonVisible] = useState<boolean>(false);

    const [headerAnimating, setHeaderAnimating] = useState<boolean>(false);

    const [startX, setStartX] = useState<number>(0);

    const [menuMouseSwipe, setMenuMouseSwipe] = useState<boolean>(false);

    const headerRef = useRef<HTMLHeadingElement>(null);

    const userMenuRef = useRef<HTMLDivElement>(null);

    const navListRef = useRef<HTMLUListElement>(null);

    const redirect = useNavigate();

    const closeHeader = () => {
        setHeaderButtonVisible(false);
        setHeaderVisible(false);
        setMenuMouseSwipe(false);
    }

    const toggleUserMenuOpen = () => setUserMenuOpen(prev => !prev);

    const handleModalOpen = (page: UserHeaderModalPage) => {
        setPage(page);
        setModalPageOpen(true);
      }
    
      const handleLogout = () => {
        logout();
      }
    
      const handleRedirectToProfile = () => redirect(`/profile/${user.link}`);

    useEffect(() => {
     function onMouseDown (e : MouseEvent) {
       if (!headerVisible) {
        if (window.innerWidth - e.clientX <= 80) {
            setStartX(e.clientX);
            setMenuMouseSwipe(true);
        }
       }
     } 
     function onMouseMove(e : MouseEvent) {
        if (!headerVisible) {
            if (menuMouseSwipe && startX - e.clientX >= 50) {
                setHeaderButtonVisible(true);
            }
        }
     }
     function onMouseUp(e : MouseEvent){
       if (!headerVisible && menuMouseSwipe) {
        if (startX <= e.clientX) {
            setMenuMouseSwipe(false);
            setHeaderButtonVisible(false);
        } else {
            setMenuMouseSwipe(false);
            setHeaderAnimating(true);
            setHeaderVisible(true);
        }
       }
     }
     window.addEventListener('mousedown', onMouseDown);
     window.addEventListener('mousemove', onMouseMove);
     window.addEventListener('mouseup', onMouseUp);
     return () => {
        window.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
     }
    }, [startX, menuMouseSwipe, headerVisible]);


    useEffect(() => {
       function onTouchStart(e : TouchEvent) {
        if (!headerVisible) {
            if (window.innerWidth - e.touches[0].clientX <= 80) {
                setStartX(e.touches[0].clientX);
                setMenuMouseSwipe(true);
            }
           }
       }
       function onTouchMove(e : TouchEvent) {
        if (!headerVisible) {
            if (menuMouseSwipe && startX - e.changedTouches[0].clientX >= 50) {
                setHeaderButtonVisible(true);
            }
        }
       }
       function onTouchEnd(e : TouchEvent) {
        if (!headerVisible && menuMouseSwipe) {
            if (startX <= e.changedTouches[0].clientX) {
                setMenuMouseSwipe(false);
                setHeaderButtonVisible(false);
            } else {
                setMenuMouseSwipe(false);
                setHeaderVisible(true);
            }
           }
       }
       window.addEventListener('touchstart', onTouchStart);
       window.addEventListener('touchmove', onTouchMove);
       window.addEventListener('touchend', onTouchEnd);
       return () => {
        window.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
       }
    }, [startX, headerButtonVisible, menuMouseSwipe, headerVisible]); 

    useEffect(() => {
    if (!headerRef.current) return;
    const header = headerRef.current;
    function handleClickOutsideHeader(e : MouseEvent) {
        if (!header.contains(e.target as HTMLElement) && !headerAnimating) {
            closeHeader();
        }
    }
    window.addEventListener('click', handleClickOutsideHeader);
    return () => {
        if (header) {
            window.removeEventListener('click', handleClickOutsideHeader);
        }
    }
    }, [headerRef, headerAnimating]);

    useEffect(() => {
        if (!userMenuRef.current) return;
        const handleClickOutsideUserMenu = (e: MouseEvent) => {
         if (!userMenuRef.current?.contains(e.target as HTMLElement)) setUserMenuOpen(false);
        }
        window.addEventListener('click', handleClickOutsideUserMenu);
        return () => window.removeEventListener('click', handleClickOutsideUserMenu);
     }, [userMenuRef]);

     useEffect(() => {
       if (!navListRef.current) return;
       const navList = navListRef.current;
       function handleClickOnNavListButton(e : MouseEvent) {
        const target = e.target as HTMLElement;
        if (target.closest(`.${cl.headerNavListItem}`)) {
          closeHeader();
        }
       }
       navList.addEventListener('click', handleClickOnNavListButton);
       return () => {
        if (navList) {
          navList.removeEventListener('click', handleClickOnNavListButton);
        }
       }
     }, [navListRef]);


    const userMenuButtonClassName = userMenuOpen ? [cl.userMenuButton, cl.active] : [cl.userMenuButton];

    return (
    <>
    <AnimatePresence>
    {
        headerButtonVisible && <m.button 
        variants={headerButtonVariants}
        initial="initial"
        animate="visible"
        exit="hidden"
        onClick={closeHeader}
        className={cl.headerWidgetButton}>
        {headerVisible ? <FaXmark /> : <FaBars />}
        </m.button>
    }
    </AnimatePresence>
    <m.header
    variants={headerVariants} 
    ref={headerRef}
    initial="hidden"
    animate={headerVisible ? "visible" : "hidden"}
    onAnimationComplete={() => setHeaderAnimating(false)}
    className={cl.mobileHeader}>
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
    <nav className={cl.headerNav}>
    <ul ref={navListRef} className={cl.headerNavList}>
    <li title="Диалоги" aria-label="Перейти на к диалогам" className={cl.headerNavListItem}>
    <NavLink to='/'><LuMessagesSquare />Диалоги</NavLink>
    </li>
   <li title="Контакты"
   aria-label="Открыть меню контактов"
   onClick={() => handleModalOpen('contacts')}
   role="button"
   className={cl.headerNavListItem}>
   <RiContactsFill />
   Контакты
   </li>
   <li title="Настройки"
   aria-label="Перейти к настройкам"
   className={cl.headerNavListItem}
   >
  <NavLink to="/settings"><IoSettingsSharp />Настройки</NavLink>
   </li>
   <li title="Уведомления"
   role="button"
   aria-label="Открыть меню уведомлений"
   onClick={() => handleModalOpen('notifications')} 
   className={cl.headerNavListItem}>
   <div className={cl.notifications}>
          <IoMdNotificationsOutline />
          {
            notifications && notifications > 0
            ? <span className={cl.notificationsCount}>{notifications}</span>
            : null
          }
          </div>
          Уведомления
        </li>
    </ul>
    </nav>
    </m.header>
    </>
    )
}

export default MobileHeader;