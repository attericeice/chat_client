import { useContext } from 'react';
import { useGetUserContactsQuery } from '../../api/userApi';
import { useTypedSelector } from '../../hooks/useTypedStore';
import { Link } from 'react-router-dom';
import { UserContact } from '../../types/User';
import { INotification } from '../../types/Notification';
import socket from '../../api/socketApi';
import { ContactsContext } from '../../modules/Contacts';
import { IoTrashBinOutline } from "react-icons/io5";
import { NoItems, ErrorHandler } from '../../shared/UI';
import { AnimatePresence, m } from 'framer-motion';
import { MEDIA_URL } from '../../shared/constants';
import cl from './UserContacts.module.scss';




const UserContacts = () => {
  
  const { user } = useTypedSelector(state => state.userReducer);

  const closeHandler = useContext(ContactsContext);

  const {data: contacts, isLoading, isError } = useGetUserContactsQuery(user.id, {skip: user.id === ''});

  const handleRemoveContact = (contact: UserContact) => {
      socket.emit('removeContact', {
        rooms: [contact.userId, contact.contactId],
        userId: contact.userId,
        contactId: contact.contactId
      });
      const notification : Omit<INotification, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: Number(contact.contact.id),
        text: 'удалил вас из списка контактов',
        img: user.avatar_img,
        linkText: `${user.name} ${user.surname}`,
        link: `/profile/${user.link}`
      }
      socket.emit('sendNotification', notification);
  }

  const contactListClassName = !isLoading && contacts && contacts.length < 1 
  ? [cl.userContactsList, cl.noContacts] 
  : [cl.userContactsList];

  return (
    <section className={contactListClassName.join(' ')}>
      {
        isLoading
        ? [...new Array(6)].map((_, i) => <div key={i} className={cl.userContactSkeleton}>
          <m.div
          animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
          transition={{ease: 'linear', duration: 1, repeat: Infinity}} 
          className={cl.userContactSkeletonImage} />
          <m.span
          animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
          transition={{ease: 'linear', duration: 1, repeat: Infinity}} 
          className={cl.userContactSkeletonName} />
        </div>)
        : isError
        ? <ErrorHandler />
        : contacts && contacts.length
        ? <AnimatePresence mode="popLayout" initial={false} >
         {
          contacts.map(contact => <m.article
          initial={{y: -10, opacity: 0}}
          animate={{y: 0, opacity: 1}}
          exit={{y: -10, opacity: 0}}
          key={contact.id} className={cl.userContactsListItem}>
            <div className={cl.contactUser}>
             <div onClick={closeHandler} className={cl.contactImage}>
               {contact.contact.status === 'online' && <span className={cl.status} />}
            <Link to={`/profile/${contact.contact.link}`}>
            <img src={`${MEDIA_URL}/${contact.contact.avatar_img}`} alt={`${user?.name} ${user?.surname}`} />
            </Link>
             </div>
            <span onClick={closeHandler} className={cl.contactUsername}>
            <Link to={`/profile/${contact.contact.link}`}>
              {contact.contact.name} {contact.contact.surname}
              </Link>
              </span>
            </div>
            <div className={cl.contactButtons}>
            <button onClick={() => handleRemoveContact(contact)} className={cl.deleteContact}><IoTrashBinOutline /></button>
            </div>
            </m.article>)
         }
        </AnimatePresence>
          : <NoItems type="contacts" label="У вас еще нет контактов" />
      }
    </section>
  )
}

export default UserContacts;

