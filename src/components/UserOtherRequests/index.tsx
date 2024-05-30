import { useContext } from 'react';
import { useGetOtherContactRequestsQuery } from '../../api/userApi';
import { useTypedSelector } from '../../hooks/useTypedStore';
import { IUser, UserContactRequest } from '../../types/User';
import { INotification } from '../../types/Notification';
import { FaCheck, FaXmark } from 'react-icons/fa6';
import socket from '../../api/socketApi';
import { ContactsContext } from '../../modules/Contacts';
import { MEDIA_URL } from '../../shared/constants';
import { Link } from 'react-router-dom'
import { AnimatePresence, m } from 'framer-motion';
import { NoItems, ErrorHandler } from '../../shared/UI';
import cl from './UserOtherRequests.module.scss';


const confirmContactRequest = (request : UserContactRequest, user : IUser) => {
  socket.emit('confirmContactRequest', {
    rooms: [request.senderId, request.userId],
    contactRequest: request
  });
  const notification : Omit<INotification, 'id' | 'createdAt' | 'updatedAt'> = {
    userId: Number(user.id),
    text: 'принял вашу заявку на добавление в контакты',
    img: user.avatar_img,
    linkText: `${user.name} ${user.surname}`,
    link: `/profile/${user.link}`
  }
  socket.emit('sendNotification', notification);
}

const cancelContactRequest = (request : UserContactRequest) => {
   socket.emit('removeContactRequest', {
     rooms: [request.senderId, request.userId],
     contactRequest: request
   });
}


const UserOtherRequests = () => {

  const closeHandler = useContext(ContactsContext);

  const { user } = useTypedSelector(state => state.userReducer);
  
  const {data: otherRequests, isLoading, isError} = useGetOtherContactRequestsQuery(user.id, {skip: user.id === ''});

  const userOtherRequestsClassName = !isLoading && otherRequests && otherRequests.length < 1
  ? [cl.userOtherRequests, cl.noRequest]
  : [cl.userOtherRequests];

  return (
    <section className={userOtherRequestsClassName.join(' ')}>
    {
      isLoading
      ? [...new Array(6)].map((_, i) => <div key={i} className={cl.userRequestSkeleton}>
        <m.div
        animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
        transition={{ease: 'linear', duration: 1, repeat: Infinity}} 
        className={cl.userRequestSkeletonImage} />
        <m.span
        animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
        transition={{ease: 'linear', duration: 1, repeat: Infinity}} 
        className={cl.userRequestSkeletonName} />
      </div>)
      : isError
      ? <ErrorHandler />
      : otherRequests && otherRequests.length ? <AnimatePresence mode="popLayout" initial={false}>
       {
        otherRequests.map((request, i) => {
          const user = otherRequests[i].user ? otherRequests[i].user : otherRequests[i].sender;
          return (
        <m.article
        initial={{y: -10, opacity: 0}}
        animate={{y: 0, opacity: 1}}
        exit={{y: -10, opacity: 0}}
        key={request.id}
        className={cl.userOtherRequestsItem}>
            <div className={cl.requestUser}>
               <div onClick={closeHandler} className={cl.requestUserImage}>
                <Link to={`/profile/${user?.link}`}>
                   <img src={`${MEDIA_URL}/${user?.avatar_img}`} alt={`${user?.name} ${user?.surname}`} />
                   </Link>
               </div>
               <span onClick={closeHandler} className={cl.requestUsername}>
               <Link to={`/profile/${user?.link}`}>
                {user?.name} {user?.surname}
                </Link>
                </span>
            </div>
            <div className={cl.requestButtons}>
            <button onClick={() => user ? confirmContactRequest(request, user) : undefined} className={cl.confirmRequestButton}>
            <FaCheck />
            </button>
            <button onClick={() => cancelContactRequest(request)} className={cl.cancelRequestButton}>
             <FaXmark />
            </button>
            </div>
           </m.article>
          )
        })
       }
      </AnimatePresence>
      : <NoItems type="contacts" label="У вас нет входящих заявок" />
    }
    </section>
  )
}

export default UserOtherRequests;
