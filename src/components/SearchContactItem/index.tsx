import { useState, useRef, useEffect, useContext, FC, ReactNode, memo } from 'react';
import { useTypedSelector } from '../../hooks/useTypedStore';
import { Link } from 'react-router-dom';
import { IUserSearch } from '../../types/User';
import { INotification } from '../../types/Notification';
import { FaChevronDown } from 'react-icons/fa';
import { AnimatePresence, m } from 'framer-motion';
import socket from '../../api/socketApi';
import { ContactsContext } from '../../modules/Contacts';
import { MEDIA_URL } from '../../shared/constants';
import cl from './SearchContactItem.module.scss';



interface ISearchContactItemProps {
    contact: IUserSearch;
}

const getContactStatusContent = (contact : IUserSearch) : ReactNode => {
  if (contact.receiverRequest.length) {
    return 'Заявка отправлена';
  }
  if (contact.sentRequest.length) {
      return 'Принять заявку';
  }
  if (contact.user_contacts.length) {
      return 'У вас в контактах';
  }
  if (contact.blacklist_banned.length) {
      return 'Разблокировать';
  }
  return 'Действия';
}

const SearchContactItem : FC<ISearchContactItemProps> = ({contact}) => {

  const closeHandler = useContext(ContactsContext);

  const { user } = useTypedSelector(state => state.userReducer);

  const [buttonMenuOpen, setButtonMenuOpen] = useState<boolean>(false);

  const statusMenuRef = useRef<HTMLDivElement>(null);

  const ROOMS = [user.id, contact.id];

  const toggleButtonMenuOpen = () => setButtonMenuOpen(prev => !prev);

  const confirmContactRequest = () => {
    socket.emit('confirmContactRequest', {
      rooms: ROOMS,
      contactRequest: contact.sentRequest[0],
    });
    const notification : Omit<INotification, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: Number(contact.id),
      text: 'принял вашу заявку на добавление в контакты',
      img: user.avatar_img,
      linkText: `${user.name} ${user.surname}`,
      link: `/profile/${user.link}`
    }
    socket.emit('sendNotification', notification);
  }

  const removeContactRequest = (type: 'self' | 'other') => {
     const contactRequest = type === 'other' ? contact.sentRequest[0] : contact.receiverRequest[0];
     socket.emit('removeContactRequest', {rooms: ROOMS, contactRequest})
  }

  const sendContactRequest = () => {
     socket.emit('sendContactRequest', {
      rooms: ROOMS,
      senderId: user.id,
      userId: contact.id
     });
     const notification : Omit<INotification, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: Number(contact.id),
      text: 'отправил заявку на добавление в контакты',
      img: user.avatar_img,
      linkText: `${user.name} ${user.surname}`,
      link: `/profile/${user.link}`
    }
    socket.emit('sendNotification', notification);
  }

  const removeContact = () => {
    socket.emit('removeContact', {
      rooms: ROOMS,
      userId: user.id,
      contactId: contact.id
    });
    const notification : Omit<INotification, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: Number(contact.id),
      text: 'удалил вас из списка контактов',
      img: user.avatar_img,
      linkText: `${user.name} ${user.surname}`,
      link: `/profile/${user.link}`
    }
    socket.emit('sendNotification', notification);
  }

  const handleToggleBlackList = () => {
     if (contact.blacklist_banned.length > 0) {
      socket.emit('removeBlackList', contact.blacklist_banned[0]);
     } else {
      socket.emit('addToBlackList', {senderId: user.id, bannedId: contact.id});
     }
  }



  useEffect(() => {
   if (!statusMenuRef.current) return;
   const handleClickOutsideButtonMenu = (e : MouseEvent) => {
      if (!statusMenuRef.current?.contains(e.target as HTMLElement)) {
        setButtonMenuOpen(false);
      }
   }
   window.addEventListener('click', handleClickOutsideButtonMenu);
   return () => {
    window.removeEventListener('click', handleClickOutsideButtonMenu);
   }
  }, []);

  const getContactStatusActionsContent = () : ReactNode => {
    if (contact.receiverRequest.length) {
      return <li className={cl.contactStatusActionsItem}>
        <button onClick={() => removeContactRequest('self')} className={cl.toggleContactStatusActionsButton}>
          Отменить заявку
        </button>
      </li>
    }
    if (contact.sentRequest.length) {
       return <>
       <li className={cl.contactStatusActionsItem}>
       <button onClick={confirmContactRequest} className={cl.toggleContactStatusActionsButton}>
         Принять заявку
       </button>
     </li>
     <li className={cl.contactStatusActionsItem}>
       <button onClick={() => removeContactRequest('other')} className={cl.toggleContactStatusActionsButton}>
         Отклонить заявку
       </button>
     </li>
       </>
    }
    if (contact.user_contacts.length) {
      return <li className={cl.contactStatusActionsItem}>
      <button onClick={removeContact} className={cl.toggleContactStatusActionsButton}>
        Удалить контакт
      </button>
    </li>
    }
    return <li className={cl.contactStatusActionsItem}>
    <button onClick={sendContactRequest} className={cl.toggleContactStatusActionsButton}>
      Отправить заявку
    </button>
  </li>
  }
   
  return (
    <article className={cl.searchContactItem}>
    <div className={cl.searchContactItemUser}>
      <div onClick={closeHandler} className={cl.searchContactItemUserImage}>
        <Link to={`/profile/${contact.link}`}>
        <img src={`${MEDIA_URL}/${contact.avatar_img}`} alt={`${contact.name} ${contact.surname}`} />
        </Link>
      </div>
      <span onClick={closeHandler} className={cl.searchContactItemUsername}>
      <Link to={`/profile/${contact.link}`}>{contact.name} {contact.surname}</Link>
      </span>
    </div>
    <div ref={statusMenuRef} className={cl.searchContactItemButtons}>
    <button onClick={toggleButtonMenuOpen} className={cl.contactStatus}>
    {getContactStatusContent(contact)}
    <FaChevronDown />
    </button>
    <AnimatePresence>
      {
        buttonMenuOpen && <m.ul className={cl.contactStatusActions}>
        {getContactStatusActionsContent()}
        <li className={cl.contactStatusActionsItem}>
       <button onClick={handleToggleBlackList} className={cl.toggleContactStatusActionsButton}>
         {contact.blacklist_banned.length > 0 ? 'Разблокировать' : 'Заблокировать'}
       </button>
     </li>
        </m.ul>
      }
    </AnimatePresence>
    </div>
  </article>
  )
}

export default memo(SearchContactItem);