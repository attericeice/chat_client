import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation, Outlet } from "react-router-dom";
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useGetProfileQuery } from "../../api/userApi";
import { useCreateDialogMutation } from '../../api/dialogApi';
import { useTypedSelector } from '../../hooks/useTypedStore';
import { INotification } from '../../types/Notification';
import { CSSProperties } from 'react';
import socket from '../../api/socketApi';
import { FiMoreVertical } from "react-icons/fi";
import { BsFillChatLeftDotsFill } from "react-icons/bs";
import { FaRegImage, FaRegFile, FaXmark, FaCheck, FaUserXmark } from 'react-icons/fa6';
import { AiFillSound } from "react-icons/ai";
import { RiUserAddLine } from 'react-icons/ri';
import { IoTrashBinOutline } from 'react-icons/io5';
import { AnimatePresence, m } from 'framer-motion';
import ProfileSlider from '../../components/ProfileSlider';
import { CircleLoader } from '../../shared/UI';
import { IProfile } from '../../types/User';
import { Helmet } from 'react-helmet-async';
import {ReactComponent as Warning} from '../../assets/images/warning.svg';
import { ReactComponent as NotFound } from '../../assets/images/not-found.svg';
import { MEDIA_URL } from '../../shared/constants';
import cl from './Profile.module.scss';

const getProfileExisted = (isLoading : boolean, profile : IProfile | undefined) => !isLoading && !profile;

const Profile = () => {

  const { pathname } = useLocation();

  const { link } = useParams();

  const redirect = useNavigate();

  const { user: currentUser } = useTypedSelector(state => state.userReducer);

  const { data : profile, isLoading } = useGetProfileQuery({
    link: link ?? '', currentUserId: currentUser.id}, 
    {skip: link === '' || currentUser.id === ''});

  const [createDialog, { 
    data : createdDialog, 
    error, 
    isLoading : createDialogLoading, 
    isSuccess: createDialogSuccess
  }] = useCreateDialogMutation();

  const ROOMS  = [ profile?.id, currentUser.id];

  const [profileMenuOpen, setProfileMenuOpen] = useState<boolean>(false);

  const isSmallViewport = useBreakpoint(1199); 

  const profileMenuRef = useRef<HTMLDivElement>(null);

  const isSlider = profile?.user_media && profile.user_media.length > 1;

  const getProfileUserClassName = (className: string) => {
     return isSlider ? [className, cl.slider].join(' ') : className;
  }

  const redirectToDialog = () => {
    if (profile && profile.id && currentUser.id) {
      if (profile.dialog && profile.dialog.id) {
        redirect(`/dialog/${profile.dialog.id}`);
      }
      else {
        createDialog({userId: currentUser.id, interluctorId: profile.id});
      }
    }
  }

  const toggleMenuOpen = () => setProfileMenuOpen(prev => !prev);

  const handleRemoveContact = () => {
    socket.emit('removeContact', {
      rooms: ROOMS,
      userId: currentUser.id, 
      contactId: profile?.id
    });
    const notification : Omit<INotification, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: Number(profile?.id),
      text: 'удалил вас из контактов',
      img: currentUser.avatar_img,
      linkText: `${currentUser.name} ${currentUser.surname}`,
      link: `/profile/${currentUser.link}`
    }
    socket.emit('sendNotification', notification);
  }

  const handleRemoveContactRequest = (type: 'self' | 'profile') => {
    const contactRequest = type === 'profile' ? profile?.sentRequest[0] : profile?.receiverRequest[0];
    socket.emit('removeContactRequest', {rooms: ROOMS, contactRequest});
    if (type === 'profile') {
      const notification : Omit<INotification, 'id' | 'createdAt' | 'updatedAt'> = {
          text: 'Отклонил вашу заявку на добавление в контакты',
          userId: Number(profile?.id),
          img: currentUser.avatar_img,
          link: `/profile/${currentUser.link}`,
          linkText: `${currentUser.name} ${currentUser.surname}`
      }
      socket.emit('sendNotification', notification);
    }
  }

  const handleSendContactRequest = () => {
    socket.emit('sendContactRequest', {
      rooms: ROOMS,
      senderId: currentUser.id, 
      userId: profile?.id
    });
    const notification : Omit<INotification, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: Number(profile?.id),
      text: 'отправил заявку на добавление в контакты',
      img: currentUser.avatar_img,
      linkText: `${currentUser.name} ${currentUser.surname}`,
      link: `/profile/${currentUser.link}`
    }
    socket.emit('sendNotification', notification);
  }

  const handleConfirmContactRequest = () => {
     socket.emit('confirmContactRequest', {
      rooms: ROOMS,
      contactRequest: profile?.sentRequest[0]
     });
     const notification : Omit<INotification, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: Number(profile?.id),
      text: 'принял вашу заявку на добавление в контакты',
      img: currentUser.avatar_img,
      linkText: `${currentUser.name} ${currentUser.surname}`,
      link: `/profile/${currentUser.link}`
    }
    socket.emit('sendNotification', notification);
  }

  const handleAddToBlackList = () => {
     if (profile) {
      socket.emit('addToBlackList', {
        senderId: currentUser.id,
        bannedId: profile.id
        });
     }
  }

  const handleRemoveToBlackList = () => {
    if (profile && profile.blacklist_banned.length > 0) {
      socket.emit('removeBlackList', profile.blacklist_banned[0])
    }
  }

  const getContactStatusButtonContent = () => {
    if (profile?.isContact) {
      return <li className={cl.profileActionsDropdownItem}>
        <button onClick={handleRemoveContact} className={[cl.toggleContactButton, cl.red].join(' ')}>
          <IoTrashBinOutline />
          Удалить контакт
          </button>
      </li>
    }
    else {
      if (profile?.sentRequest.length) {
        return <>
        <li className={cl.profileActionsDropdownItem}>
        <button onClick={handleConfirmContactRequest} className={cl.toggleContactButton}>
          <FaCheck />
          Принять заявку
          </button>
      </li>
      <li className={cl.profileActionsDropdownItem}>
        <button onClick={() => handleRemoveContactRequest('profile')} className={[cl.toggleContactButton, cl.red].join(' ')}>
          <FaXmark />
          Отклонить заявку
          </button>
      </li>
        </>
      }
      if (profile?.receiverRequest.length) {
      return  <li className={cl.profileActionsDropdownItem}>
        <button onClick={() => handleRemoveContactRequest('self')} className={[cl.toggleContactButton, cl.red].join(' ')}>
          <FaXmark />
          Отменить заявку
          </button>
      </li>
      }
      return  <li className={cl.profileActionsDropdownItem}>
      <button onClick={handleSendContactRequest} className={cl.toggleContactButton}>
        <RiUserAddLine />
        Отправить заявку
        </button>
    </li>
    }
  }

  const getBlackListMessage = () => {
    if (profile) {
       if (profile.blacklist_sender.length > 0) {
        return <div className={cl.blacklist}>
       <Warning />
       <span className={cl.blacklistMessage}>
       Пользователь {`${profile.name} ${profile.surname}`} добавил вас в черный список
       </span>
      </div>
       }
       if (profile.blacklist_banned.length > 0) {
        return <div className={cl.blacklist}>
        <Warning />
        <span className={cl.blacklistMessage}>
        Вы добавили пользователя {`${profile.name} ${profile.surname}`} в черный список
        </span>
       </div>
       }
    }
 }

  useEffect(() => {
   if (!profileMenuRef.current) return;
   const handleClickOutsideProfileMenu = (e: MouseEvent) => {
    if (!profileMenuRef.current?.contains(e.target as HTMLElement)) setProfileMenuOpen(false);
   }
   window.addEventListener('click', handleClickOutsideProfileMenu);
   return () => window.removeEventListener('click', handleClickOutsideProfileMenu);
  }, [profileMenuRef]);


  useEffect(() => {
    if (!profile?.id) return;
    socket.emit('join', `profile/${profile?.id}`);
    const handleLeaveProfile = () => socket.emit('leave', `profile/${profile?.id}`);
    window.addEventListener('beforeunload', handleLeaveProfile);
    return () => {
      window.removeEventListener('beforeunload', handleLeaveProfile);
      socket.emit('leave', `profile/${profile?.id}`);
    }
  }, [profile]);

  useEffect(() => {
    if (createdDialog) {
      redirect(`/dialog/${createdDialog.id}`);
    }
  }, [createDialogSuccess, createdDialog]);


 const bannerStyle : CSSProperties = {
  backgroundImage: `url(${MEDIA_URL}/${profile?.banner_img})`,
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover',
  height: !isSmallViewport ? '900px' : '90%',
 } 

  return (
    <m.section
    key="ProfilePage"
    initial={{opacity: 0}}
    animate={{opacity: 1}}
    exit={{opacity: 0}}
    transition={{duration: 0.4}}
    className={!getProfileExisted(isLoading, profile) ? cl.profile : [cl.profile, cl.notFound].join(' ')}>
    {
      getProfileExisted(isLoading, profile) ?
      <div className={cl.userNotFound}>
      <NotFound />
      <span className={cl.userNotFoundLabel}>
       Пользователь не найден
      </span>
      </div>
      : <>
      <Helmet>
     <title>
      {
       getProfileExisted(!isLoading, profile) 
       ? 'Пользователь не найден'
       : `Профиль пользователя ${profile?.name} ${profile?.surname}`
      }
      </title>
     <meta name="description" content={`Профиль пользователя ${profile?.name} ${profile?.surname}`} />
     <meta property='og:title' content={`Профиль пользователя ${profile?.name} ${profile?.surname}`} />
     <meta property='og:description' content={`Профиль пользователя ${profile?.name} ${profile?.surname}`} />
     <meta property='og-type' content='profile' />
     <meta property='og:profile:username' content={`${profile?.name} ${profile?.surname}`} />
     <meta property='og:url' content={`http://dialog/profile/${link}`} />
     <meta property='og:image' content={`${MEDIA_URL}/${profile?.avatar_img}`} />
     <meta property='og:image:width' content="200" />
     <meta property='og:image:height' content="200" />
     <meta property='og:image:alt' content={`${profile?.name} ${profile?.surname}`} />
    </Helmet>
    {profile?.banner_img && <div className={cl.banner} style={bannerStyle}></div>}
    <div className={profile?.banner_img ? [cl.headerContainer, isSlider ? cl.withBannerSlider : cl.withBanner].join(' ') : cl.headerContainer}>
    <div className={getProfileUserClassName(cl.profileUserHeader)}>
     {
      isLoading ? <div className={cl.profileSkeleton}>
        <m.div 
        animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
        transition={{ease: 'linear', duration: 1, repeat: Infinity}}
        className={cl.userImageSkeleton} 
        />
        <div className={cl.userInfoSkeleton}>
        <m.span 
        animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
        transition={{ease: 'linear', duration: 1, repeat: Infinity}}
        className={cl.userInfoSkeletonRow}
        />
        <m.span 
        animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
        transition={{ease: 'linear', duration: 1, repeat: Infinity}}
        className={cl.userInfoSkeletonRow}
        />
        </div>
      </div>
      : <>
       {
      isSlider && <ProfileSlider media={profile.user_media} />
     }
     <div className={getProfileUserClassName(cl.userMenu)}>
     <div className={cl.user}>
      {!isSlider && <div className={cl.userAvatar}>
        <img src={`${MEDIA_URL}/${profile?.avatar_img}`} />
        </div>}
      <div className={cl.userInfo}>
      <span className={cl.username}>{profile?.name} {profile?.surname}</span>
      <span className={cl.status}>
        {
        profile?.status === 'online'
        ? 'Online'
        : profile?.last_online ? 
        `Был(-а) в сети ${new Date(profile.last_online).toLocaleDateString()}`
        : 'Был(-а) в сети недавно'
        }
      </span>
      </div>
     {profile && profile.id !== currentUser.id && (profile.blacklist_banned.length === 0 && profile.blacklist_sender.length === 0) && 
      <div className={cl.profileUserInfoButtons}>
      <button
      title="Перейти к диалогу"
      aria-label="Перейти к диалогу"
      disabled={createDialogLoading} 
      onClick={redirectToDialog} 
      className={cl.sendMessage}>
      {
        createDialogLoading ? <CircleLoader size={30} /> : <BsFillChatLeftDotsFill />
      }
      </button>
     </div>}
     </div>
    {
      profile && profile.id !== currentUser.id && profile.blacklist_sender.length === 0 && <div ref={profileMenuRef} className={cl.profileActions}>
      <button
      title="Открыть меню профиля"
      aria-label="Открыть меню профиля" 
      onClick={toggleMenuOpen} 
      className={cl.openDropdownMenu}>
      <FiMoreVertical />
      </button>
      <AnimatePresence>
        {profileMenuOpen && <m.ul
        initial={{opacity: 0, y: 10}}
        animate={{opacity: 1, y: 0}}
        exit={{opacity: 0, y: 10}} 
        className={cl.profileActionsDropdown}>
       {getContactStatusButtonContent()}
      <li className={cl.profileActionsDropdownItem}>
      <button onClick={profile.blacklist_banned.length > 0 ? handleRemoveToBlackList : handleAddToBlackList} className={[cl.toggleContactButton, cl.red].join(' ')}>
       <FaUserXmark />
       {profile.blacklist_banned.length > 0 ? 'Разблокировать' : 'Заблокировать'}
      </button>
      </li>
      </m.ul>}
      </AnimatePresence>
     </div>
    }
     </div>
      </>
     }
     </div>
    </div>
    {
      profile && (profile.blacklist_banned.length > 0 || profile.blacklist_sender.length > 0) 
      ? getBlackListMessage()
      : <>
      <div className={cl.profileInfoContainer}> 
      <section className={cl.profileUserInfo}>
       <h2 className={cl.profileUserInfoTitle}>Информация</h2>
       <div className={cl.profileInfoList}>
         <div className={cl.profileInfoListItem}>
           <span className={cl.profileInfoColName}>Имя</span>
           {
            isLoading ? <m.span
            animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
            transition={{ease: 'linear', duration: 1, repeat: Infinity}}
            className={cl.profileInfoDataSkeleton} /> 
            : <span className={cl.profileInfoData}>{profile?.name}</span>
           }
         </div>
         <div className={cl.profileInfoListItem}>
           <span className={cl.profileInfoColName}>Фамилия</span>
           {
            isLoading ? <m.span
            animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
            transition={{ease: 'linear', duration: 1, repeat: Infinity}}
            className={cl.profileInfoDataSkeleton} /> 
            : <span className={cl.profileInfoData}>{profile?.surname}</span>
           }
         </div>
         <div className={cl.profileInfoListItem}>
           <span className={cl.profileInfoColName}>Ссылка</span>
           {
            isLoading ? <m.span
            animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
            transition={{ease: 'linear', duration: 1, repeat: Infinity}}
            className={cl.profileInfoDataSkeleton} />
            : <span className={cl.profileInfoData}>{profile?.link}</span>
           }
         </div>
         {
           profile?.email && <div className={cl.profileInfoListItem}>
           <span className={cl.profileInfoColName}>Email</span>
           {
            isLoading ? <m.span
            animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
            transition={{ease: 'linear', duration: 1, repeat: Infinity}}
            className={cl.profileInfoDataSkeleton} />
            : <span className={cl.profileInfoData}>{profile.email}</span>
           }
         </div>
         }
         {
           profile?.user_information?.phone && <div className={cl.profileInfoListItem}>
           <span className={cl.profileInfoColName}>Телефон</span>
           {
            isLoading ? <m.span
            animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
            transition={{ease: 'linear', duration: 1, repeat: Infinity}}
            className={cl.profileInfoDataSkeleton} />
            : <span className={cl.profileInfoData}>{ profile.user_information.phone}</span>
           }
         </div>
         }
       </div>
      </section>
      </div>
      {
       profile && profile.id !== currentUser.id && <div className={cl.container}>
       <ul className={cl.profileTabs}>
       <li className={cl.profileTabsItem}>
       <Link to='.'><FaRegImage />Медиафайлы</Link>
       {pathname === `/profile/${profile.link}` && <m.span className={cl.activeTab} layoutId='profileActiveTab' />}
       </li>
       <li className={cl.profileTabsItem}>
       <Link to='documents'><FaRegFile />Документы</Link>
       {pathname.endsWith('documents') && <m.span className={cl.activeTab} layoutId='profileActiveTab' />}
       </li>
       <li className={cl.profileTabsItem}>
       <Link to='voices'><AiFillSound />Голосовые</Link>
       {pathname.endsWith('voices') && <m.span className={cl.activeTab} layoutId='profileActiveTab' />}
       </li>
       </ul>
       <Outlet />
       </div>
      }
       </>
    }
      </>
    }
    </m.section>
  )
}

export default Profile;