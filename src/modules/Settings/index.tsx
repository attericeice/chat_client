import { Link, Outlet, useLocation } from 'react-router-dom';
import { FaGears, FaRegCircleUser, FaRegImage, FaUserXmark } from 'react-icons/fa6';
import { m } from 'framer-motion';
import cl from './Settings.module.scss';


const Settings = () => {

  const { pathname } = useLocation();
  
  return (
    <div className={cl.settings}>
    <div className={cl.settingsHeader}>
    <h1 className={cl.settingsHeaderTitle}>Настройки аккаунта</h1>
    </div>
    <ul className={cl.settingsTabs}>
    <li className={cl.settingsTabsItem}>
    <Link to='.'><FaRegCircleUser />Личные данные</Link>
    {pathname === '/settings' && <m.span layoutId="currentTab" className={cl.underLine}></m.span>}
    </li>
    <li className={cl.settingsTabsItem}>
      <Link to='params'><FaGears />Параметры</Link>
      {pathname === '/settings/params' && <m.span layoutId="currentTab" className={cl.underLine}></m.span>}
    </li>
    <li className={cl.settingsTabsItem}>
      <Link to='media'><FaRegImage />Медиафайлы</Link>
      {pathname === '/settings/media' && <m.span layoutId="currentTab" className={cl.underLine}></m.span>}
    </li>
    <li className={cl.settingsTabsItem}>
      <Link to='blacklist'><FaUserXmark />Черный список</Link>
      {pathname === '/settings/blacklist' && <m.span layoutId="currentTab" className={cl.underLine}></m.span>}
    </li>
    </ul>
    <Outlet />
    </div>
  )
}

export default Settings