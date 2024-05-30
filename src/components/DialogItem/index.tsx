import { forwardRef } from 'react';
import { IDialog } from '../../types/Dialog';
import { ITypingUsersDialog } from '../DialogList';
import { NavLink, useLocation } from 'react-router-dom';
import { m } from 'framer-motion';
import { MEDIA_URL } from '../../shared/constants';
import cl from './DialogItem.module.scss';


interface IDialogItemProps {
    dialog: IDialog;
    closeMenu: () => void;
    typingUsers: ITypingUsersDialog[];
}

const getLastMessageDialogTime = (date : string) => {
  const currentDate = new Date();
  const dialogDate = new Date(date);
  if (
    currentDate.getFullYear() === dialogDate.getFullYear() &&
    currentDate.getMonth() === dialogDate.getMonth() &&
    currentDate.getDate() === dialogDate.getDate()
  ) {
    const hours = dialogDate.getHours().toString().padStart(2, '0');
    const minutes = dialogDate.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  return dialogDate.toLocaleDateString('ru-RU');
}

const getDialogItemTextContent = (lastMessage : IDialog['messages'][number]) => {
  if (lastMessage.text) return lastMessage.text;
  if (lastMessage.type === 'voice') return 'Голосовое сообщение';
  if (lastMessage.parent?.length) return `${lastMessage.parent.length} пересланных сообщений`;
} 

const getTypingUsersString = (typingUsers : ITypingUsersDialog[]) => {
  return `${typingUsers[0].name} печатает сообщение...`;
}

const DialogItem = forwardRef<HTMLDivElement, IDialogItemProps>(({dialog, closeMenu, typingUsers}, ref) => {

 const { pathname } = useLocation();
  
 const lastMessage = dialog.messages[0];

 const { user } = lastMessage;

 const { user : dialogUser } = dialog.users_in_dialogs[0];
 
  return (
    <m.article
    ref={ref}
    initial={{opacity: 0, y: -10}}
    animate={{opacity: 1, y: 0}}
    exit={{opacity: 0, y: -10}}
    onClick={closeMenu}
    layout
    className={cl.dialogItemContainer}>
    <NavLink to={`/dialog/${dialog.id}`} state={{dialogUser}}>
    <article className={cl.dialogItem}>
      <div className={cl.dialogImage}>
        {dialogUser.status === 'online' && <span className={cl.status} />}
      <img src={`${MEDIA_URL}/${dialogUser.avatar_img}`} alt={`${dialogUser.name} ${dialogUser.surname}`} />
    </div>
    <div className={cl.dialogMessageContent}>
      <h4 className={cl.dialogUser}>{`${dialogUser.name} ${dialogUser.surname}`}</h4>
      <p className={cl.dialogMessageText}>
      {typingUsers.length === 0 && <span className={cl.messageTextUser}>{user?.name}:</span>}
      {
        typingUsers.length > 0
        ? getTypingUsersString(typingUsers)
        : getDialogItemTextContent(lastMessage)
      }
      </p>
    </div>
    <div className={cl.dialogInfo}>
      <span className={cl.lastMessageTime}><time>{getLastMessageDialogTime(lastMessage.createdAt ?? '0')}</time></span>
      {dialog.unread > 0 && <span className={cl.unreadMessages}>{dialog.unread}</span>}
    </div>
    </article>
    </NavLink>
    { pathname === `/dialog/${dialog.id}` && <m.span layoutId='currentDialog' className={cl.activeDialog} />}
    </m.article>
  )
});

export default DialogItem