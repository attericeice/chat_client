import { useContext } from 'react';
import { useGetSelfContactRequestsQuery } from '../../api/userApi';
import { useTypedSelector } from '../../hooks/useTypedStore';
import { Link } from 'react-router-dom'
import { UserContactRequest } from '../../types/User';
import { AnimatePresence, m } from 'framer-motion';
import { IoTrashBinOutline } from "react-icons/io5";
import socket from '../../api/socketApi';
import { ContactsContext } from '../../modules/Contacts';
import { NoItems, ErrorHandler } from '../../shared/UI';
import { MEDIA_URL } from '../../shared/constants';
import cl from './UserSelfRequests.module.scss';


const handleRemoveRequest = (request : UserContactRequest) => {
  socket.emit('removeContactRequest', {
    rooms: [request.senderId, request.userId],
    contactRequest: request,
  });
}

const UserSelfRequests = () => {

  const closeHandler = useContext(ContactsContext);

  const { user } = useTypedSelector(state => state.userReducer);
  
  const {data: selfRequests, isLoading, isError} = useGetSelfContactRequestsQuery(user.id, {skip: user.id === ''});

  const selfRequestsClassName = !isLoading && selfRequests && selfRequests.length === 0 
  ? [cl.userSelfRequests, cl.noRequest]
  : [cl.userSelfRequests];

  return (
    <section className={selfRequestsClassName.join(' ')}>
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
       : selfRequests && selfRequests.length > 0
       ?  <AnimatePresence mode="popLayout" initial={false}>
       {
          selfRequests.map(request => <m.article
          initial={{y: -10, opacity: 0}}
          animate={{y: 0, opacity: 1}}
          exit={{y: -10, opacity: 0}}
          key={request.id}
          className={cl.userSelfRequestsItem}>
              <div className={cl.requestUser}>
                 <div onClick={closeHandler} className={cl.requestUserImage}>
                  <Link to={`/profile/${request.user?.link}`}>
                     <img src={`${MEDIA_URL}/${request.user?.avatar_img}`} alt={`${user?.name} ${user?.surname}`} />
                     </Link>
                 </div>
                 <span onClick={closeHandler} className={cl.requestUsername}>
                 <Link to={`/profile/${request.user?.link}`}>
                  {request.user?.name} {request.user?.surname}
                  </Link>
                  </span>
              </div>
              <div className={cl.requestButtons}>
              <button onClick={() => handleRemoveRequest(request)} className={cl.removeRequestButton}>
              <IoTrashBinOutline />
              </button>
              </div>
             </m.article>)
       }
       </AnimatePresence>
       : <NoItems type="contacts" label="Вы не отправляли запросов" />
    }
    </section>
  )
}

export default UserSelfRequests