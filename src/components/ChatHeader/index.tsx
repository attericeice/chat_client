import { FC, useRef, useState, useEffect, useContext } from 'react';
import { useTypedSelector } from '../../hooks/useTypedStore';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useClearDialogMutation } from '../../api/dialogApi';
import { ChatContext, ISelectedMessage } from '../../modules/Chat';
import { IUser, BlackList } from '../../types/User';
import { FiMoreVertical } from "react-icons/fi";
import { FaRegCircleUser, FaXmark, FaEraser, FaUserXmark, FaArrowLeftLong } from 'react-icons/fa6';
import { m, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import socket from '../../api/socketApi';
import { MEDIA_URL } from '../../shared/constants';
import cl from './ChatHeader.module.scss';


interface IDialogUser extends IUser {
  blacklist_banned: BlackList[];
  blacklist_sender: BlackList[];
}

interface IChatHeaderProps {
    user: IDialogUser | undefined;
    typingUsers: Pick<IUser, 'id' | 'name'>[];
    isLoading: boolean;
    selectedMessages : ISelectedMessage[];
    dialogId: number;
}

const getTypingUsersString = (typingUsers : IChatHeaderProps['typingUsers']) => {
  return `${typingUsers[0].name} печатает сообщение...`
}

const ChatHeader : FC<IChatHeaderProps> = ({user, dialogId, typingUsers, isLoading, selectedMessages}) => {
   
  const { openResendMenu, clearSelectedMessages, onRemoveForSelf } = useContext(ChatContext);

  const { user : currentUser } = useTypedSelector(state => state.userReducer);

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);

  const [clearDialog, {isSuccess : clearDialogSuccess}] = useClearDialogMutation();

  const redirect = useNavigate();

  const isMobileViewport = useBreakpoint(1200);

  const toggleUserMenu = () => setUserMenuOpen(prev => !prev);

  const handleAddToBlackList = () => {
    if (user !== undefined && currentUser.id) {
       socket.emit('addToBlackList', {senderId: currentUser.id, bannedId: user.id});
    }
  }

  const handleRemoveBlackList = () => {
    if (user && user.blacklist_banned.length > 0) {
      socket.emit('removeBlackList', user.blacklist_banned[0]);
    }
  }

  const handleClearDialog = () => {
    if (dialogId !== 0) {
      clearDialog({dialogId, userId: currentUser.id});
    }
  }

  useEffect(() => {
    if (clearDialogSuccess) {
      redirect('/');
    }
  }, [clearDialogSuccess]);

  useEffect(() => {
   if (!userMenuRef.current) return;
   const handleClickOutsideUserMenu = (e : MouseEvent) => {
    if (!userMenuRef.current?.contains(e.target as HTMLElement)) setUserMenuOpen(false);
   }
   window.addEventListener('click', handleClickOutsideUserMenu);
   return () => window.removeEventListener('click', handleClickOutsideUserMenu);
  }, [userMenuRef]);
  
  const handleRemoveForSelf = () => onRemoveForSelf();

  return (
    <section className={cl.chatHeader}>
    <div className={cl.chatHeaderContainer}>
    <AnimatePresence>
    {selectedMessages.length > 0 && <m.div
    initial={{x: -100, opacity: 0}}
    animate={{x: 0, opacity: 1}}
    exit={{x: -100, opacity: 0}}  
    className={cl.chatHeaderMessageMenu}>
      <button onClick={openResendMenu} className={cl.resendButton}>
        переслать
      <span className={cl.selectedCount}>{selectedMessages.length}</span>
      </button>
      <button onClick={handleRemoveForSelf} className={cl.removeButton}>
        удалить 
        <span className={cl.selectedCount}>{selectedMessages.length}</span>
        </button>
      <button onClick={clearSelectedMessages} className={cl.clearSelectedButton}><FaXmark /></button>
      </m.div>}
      </AnimatePresence>
      {
        isMobileViewport && <span className={cl.mobileNavLink}>
          <Link to='/' aria-label="На главную" title="Главная страница"><FaArrowLeftLong /></Link>
        </span>
      }
    <div className={cl.chatUser}>
      {
        user !== undefined && !isLoading
        ? <>
           <div className={cl.chatUserImage}>
            <Link to={`/profile/${user.link}`}>
              <img src={`${MEDIA_URL}/${user.avatar_img}`} alt={`${user.name} ${user.surname}`} />
            </Link>
        </div>
        <div className={cl.chatUserInfo}>
            <span className={cl.chatUserInfoName}>
            <Link to={`/profile/${user.link}`}>{`${user.name} ${user.surname}`}</Link>
            </span>
            <span className={cl.chatUserInfoStatus}>
              {
                typingUsers.length > 0 ? getTypingUsersString(typingUsers)
                : user.status === 'online' ? 'Online' : `Был(-а) в сети ${new Date(user.last_online ?? '').toLocaleDateString()}`
              }
            </span>
        </div>
        </>
        : <>
          <m.div animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}}
          transition={{ease: 'linear', duration: 1, repeat: Infinity}} 
          className={cl.chatUserImageSkeleton} />
          <div className={cl.chatUserInfoSkeleton}>
            <m.span 
            animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
            transition={{ease: 'linear', duration: 1, repeat: Infinity}} className={cl.chatUserInfoSkeletonRow} />
            <m.span 
            animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
            transition={{ease: 'linear', duration: 1, repeat: Infinity}} className={cl.chatUserInfoSkeletonRow} />
          </div>
          </>
      }
    </div>
    <div ref={userMenuRef} className={cl.chatHeaderMenu}>
    <button
    title="Открыть меню диалога"
    aria-label="Открыть меню диалога"
    onClick={toggleUserMenu} 
    className={cl.chatMenuOpenDropdownButton}>
    <FiMoreVertical />
    </button>
    <AnimatePresence>
      {
         userMenuOpen && <m.ul
         className={cl.chatHeaderMenuUserDropdown}
         initial={{y: 10, opacity: 0}}
         animate={{y: 0, opacity: 1}}
         exit={{y: 10, opacity: 0}}
         >
        <li title="Перейти к профилю"
        role="button"
        aria-label="Перейти к профилю"
        aria-hidden={!userMenuOpen} 
        className={cl.chatHeaderMenuUserDropdownItem}>
        <Link to={`/profile/${user?.link}`}><FaRegCircleUser />Перейти к профилю</Link>
        </li>
        <li title="Очистить историю"
        onClick={handleClearDialog}
        role="button"
        aria-label="Очистить историю"
        aria-hidden={!userMenuOpen} 
        className={cl.chatHeaderMenuUserDropdownItem}>
        <FaEraser /> Очистить историю
        </li>
        <li title="Заблокировать пользователя"
        role="button"
        onClick={user && user.blacklist_banned.length > 0 ? handleRemoveBlackList : handleAddToBlackList}
        aria-label="Заблокировать пользователя"
        aria-hidden={!userMenuOpen} 
        className={[cl.chatHeaderMenuUserDropdownItem, cl.block].join(' ')}>
        <FaUserXmark />
        {
          user && user.blacklist_banned.length > 0 ? 'Разблокировать' : 'Заблокировать'
        }
        </li>
        </m.ul>
      }
    </AnimatePresence>
    </div>
    </div>
    </section>
  )
}

export default ChatHeader