import {useRef, useEffect, useState, useCallback, FC} from 'react';
import { useGetNotificationsQuery } from '../../api/notificationApi';
import { useTypedSelector } from '../../hooks/useTypedStore';
import { FaXmark, FaBars } from 'react-icons/fa6';
import { IoTrashBinOutline } from 'react-icons/io5';
import { AnimatePresence, m } from 'framer-motion';
import socket from '../../api/socketApi';
import NotificationItem from '../../components/NotificationItem';
import { CircleLoader, SelectMenu, ErrorHandler } from '../../shared/UI';
import cl from './Notifications.module.scss';

type Sort = 'ASC' | 'DESC';

interface ISort {
  sort: Sort,
  value: string;
}

const SELECT_VALUES : ISort[] = [
 {sort: 'ASC', value: 'Сначала старые'},
 {sort: 'DESC', value: 'Сначала новые'},
];

interface INotificationsProps {
  closeHandler: () => void;
}

const Notifications : FC<INotificationsProps> = ({closeHandler}) => {

  const { user } = useTypedSelector(state => state.userReducer);
   
  const [sort, setSort] = useState<ISort>({sort: 'DESC', value: 'Сначала новые'});

  const [page, setPage] = useState<number>(0);

  const [notificationsMenu, setNotificationsMenuOpen] = useState<boolean>(false);

  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);

  const notificationMenuRef = useRef<HTMLDivElement>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const { data : notifications, isLoading, isFetching, isError } = useGetNotificationsQuery(
    {userId: user.id, page, sort: sort.sort},
    {skip: user.id === '', refetchOnMountOrArgChange: true}
  );

  const handleNotificationMenuOpen = () => setNotificationsMenuOpen(prev => !prev);

  const removeNotifications = () => {
    socket.emit('removeNotifications', selectedNotifications);
    setSelectedNotifications([]);
  }

  const handleSelectNotification = useCallback((id : number, type: 'select' | 'unselect') => {
    if (type === 'select') {
      setSelectedNotifications(prev => [...prev, id]);
    }
    else {
      setSelectedNotifications(prev => prev.filter(notificationId => notificationId !== id));
    }
}, []);

  const handleSelectAll = () => {
    if (notifications && notifications.rows.length) {
      setSelectedNotifications(notifications.rows.map(n => n.id));
    }
  }

  const handleUnselectAll = () => setSelectedNotifications([]);

  const notificationListClassList = notifications && notifications.count > 0 ? [cl.notificationsList] : [cl.notificationsList, cl.empty];

  const getSelectedStatus = (id : number) => selectedNotifications.includes(id);

  const getObserverSetPagePermission = () => {
    return !isLoading && !isFetching && notifications && notifications.count >= 0 
    && notifications.rows.length < notifications.count;
  }

  useEffect(() => {
    setPage(0);
  }, [sort]);

  useEffect(() => {
   if (!notificationMenuRef.current) return;
  
   const handleClickOutsideNotificationMenu = (e : MouseEvent) => {
     if (!notificationMenuRef.current?.contains(e.target as HTMLElement)) setNotificationsMenuOpen(false);
   }
   window.addEventListener('click', handleClickOutsideNotificationMenu);
   return () => {
    window.removeEventListener('click', handleClickOutsideNotificationMenu);
   }
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    const scrollObserber = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && getObserverSetPagePermission()) {
        console.log('intersecting')
        setPage(prev => prev + 1);
      }
    }, {threshold: 0.5});
     scrollObserber.observe(scrollRef.current);
     return () => scrollObserber.disconnect();
  }, [notifications, isFetching, isLoading]);

  return (
    <section className={cl.notifications}>
    <div className={cl.notificationsHeader}>
    <SelectMenu 
    values={SELECT_VALUES}
    currentValue={sort}
    handleSelect={setSort}
    getStringValue={(value) => value.value}
    />
    <button className={cl.closeNotifications} onClick={closeHandler}><FaXmark /></button>
    </div>
   <div className={cl.notificationsButtons}>
    <button onClick={removeNotifications}
    disabled={selectedNotifications.length === 0}
    className={cl.removeNotificationsButton}>
    <IoTrashBinOutline />
    </button>
   <div ref={notificationMenuRef} className={cl.notificationsMenu}>
    <button onClick={handleNotificationMenuOpen} className={cl.openNotificationsMenu}>
      <FaBars />
    </button>
    <AnimatePresence>
      {
        notificationsMenu && <m.ul
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        exit={{opacity: 0, y: 20}}
        transition={{duration: 0.1}} 
        className={cl.notificationsMenuList}>
        <li className={cl.notificationsMenuListItem} 
        onClick={handleSelectAll}
        role='button' 
        aria-label='Выделить все уведомления' 
        aria-hidden={!notificationsMenu}>Выделить все</li>
        <li className={cl.notificationsMenuListItem}
        onClick={handleUnselectAll} 
        role='button' 
        aria-label='Убрать выделение со всех уведомлений' 
        aria-hidden={!notificationsMenu}>Отменить выделение</li>
        </m.ul>
      }
    </AnimatePresence>
    </div>
   </div>
    <div className={notificationListClassList.join(' ')}>
     {
       isLoading ? <CircleLoader size={50} />
       : isError ? <ErrorHandler />
       : notifications && notifications.count ? 
       <AnimatePresence mode="popLayout" initial={false}>
       {
        notifications.rows.map(notification => <NotificationItem key={notification.id}
        notification={notification}
        onSelect={handleSelectNotification}
        isSelected={getSelectedStatus(notification.id)}
        closeHandler={closeHandler}
        />)
       }
       </AnimatePresence>
       : <h1 style={{textAlign: 'center', fontSize: '16px'}}>У вас нет уведомлений</h1>
     }
     <div ref={scrollRef} className={cl.scrollObserver}></div>
    </div>
    </section>
  )
}

export default Notifications;




