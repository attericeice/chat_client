import { memo, forwardRef } from 'react';
import { INotification } from '../../types/Notification';
import { m } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MEDIA_URL } from '../../shared/constants';
import cl from './NotificationItem.module.scss';

interface INotificationItemProps {
    isSelected: boolean;
    notification: INotification;
    onSelect: (id : INotification['id'], type: 'select' | 'unselect') => void;
    closeHandler: () => void;
}

const NotificationItem = forwardRef<HTMLDivElement, INotificationItemProps>(({notification, isSelected, onSelect, closeHandler}, ref) => {

  const handleSelected = () => {
    const type = isSelected ? 'unselect' : 'select';
    onSelect(notification.id, type);
  }

  const notificationItemClassName = isSelected ? [cl.notificationItem, cl.selected] : [cl.notificationItem]; 
  
  return (
    <m.article
    ref={ref}
    initial={{opacity: 0, y: -20}}
    animate={{opacity: 1, y: 0}}
    exit={{opacity: 0, y: -20}}
    onClick={handleSelected} className={notificationItemClassName.join(' ')}>
      <div onClick={closeHandler} className={cl.notificationItemImage}>
        <img src={`${MEDIA_URL}/${notification.img}`} />
      </div>
      <p className={cl.notificationItemText}>
      {
        notification.link && <Link onClick={closeHandler} to={notification.link}>{notification.linkText}</Link>
      }
      {notification.text}
      </p>
    </m.article>
  )
});

export default memo(NotificationItem);