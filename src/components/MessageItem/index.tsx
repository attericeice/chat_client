import { FC, useRef, useEffect, useLayoutEffect, useContext, useState, MouseEvent as ReactMouseEvent, memo } from 'react';
import { useTypedSelector } from '../../hooks/useTypedStore';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import socket from '../../api/socketApi';
import { ChatContext } from '../../modules/Chat';
import { IMessage } from '../../types/Message';
import Linkify from 'linkify-react';
import {FaCheck, FaRegCircleCheck } from 'react-icons/fa6';
import { TbChecks } from "react-icons/tb";
import { IoArrowRedo, IoArrowUndo, IoTrashBin } from "react-icons/io5";
import { CiEdit } from "react-icons/ci";
import { Link } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import VoiceMessage from '../VoiceMessage';
import AttachmentList from '../AttachmentList';
import { MEDIA_URL } from '../../shared/constants';
import cl from './MessageItem.module.scss';


interface IMessageItemProps {
    message: IMessage;
    type: 'self' | 'other';  
    parent: HTMLElement | null;
    isSelected: boolean;
    isResend: boolean;
}

const getTimeString = (date : string) => {
  const messageDate = new Date(date);
  return `${messageDate.getHours().toString()}:${messageDate.getMinutes().toString().padStart(2, '0')}`;
}

const getAnswerMessageText = (message : IMessage) => {
  const answerMessage = message.answerMessage;
  if (answerMessage.text) return answerMessage.text;
  if (answerMessage.attachments.length > 0) return `${answerMessage.attachments.length} вложений`;
  if (answerMessage.parent.length > 0) return `${answerMessage.parent.length} пересланных сообщений`;
  return 'error';
}

const MessageItem : FC<IMessageItemProps> = memo(({message, type, parent, isSelected, isResend}) => {

  const { 
    onAnswerMessage, 
    onSelectMessage, 
    onUnselectMessage, 
    openResendMenu: onOpenResendMenu, 
    onRemoveForSelf,
    onRemoveForAll,
    startUpdate 
  } = useContext(ChatContext);

  const isMediumViewport = useBreakpoint(679);

  const [messageMenuIsVisible, setMessageMenuIsVisible] = useState<boolean>(false);

  const messageRef = useRef<HTMLDivElement>(null);

  const messageMenuRef = useRef<HTMLDivElement>(null);
   
  const { user } = message;

  const { user : currentUser } = useTypedSelector(state => state.userReducer);

  const msgClassName = type === 'self' ? [cl.message, cl.self] : [cl.message, cl.other];

  const handleToggleMessageMenu = (e: ReactMouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setMessageMenuIsVisible(prev => !prev);
  }

  const stopPropaganation = (e : ReactMouseEvent<HTMLDivElement>) => e.stopPropagation();

  const handleAnswerMessage = () => {
    setMessageMenuIsVisible(false);
    onAnswerMessage(message);
  }

  const handleSelectMessage = () => {
    setMessageMenuIsVisible(false);
    isSelected ? onUnselectMessage(message.id) : onSelectMessage({...message, isResended: isResend});
  }

  const openResendMenu = () => {
    onSelectMessage({...message, isResended: isResend});
    onOpenResendMenu();
    setMessageMenuIsVisible(() => false);
  }

  const handleRemoveForSelf = () => onRemoveForSelf({...message, isResended: isResend});

  const handleRemoveForAll = () => onRemoveForAll({...message, isResended: isResend});

  const handleStartEditingMessage = () => startUpdate(message);

  useEffect(() => {
   if (messageRef.current && message.userId !== currentUser.id && message.status === 'unread' && !isResend) {
     const messageObserver = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        socket.emit('readMessage', {userId: currentUser.id, messageId: message.id, dialogId: message.dialogId});
        messageObserver.disconnect();
      }
     });
     messageObserver.observe(messageRef.current);
     return () => messageObserver.disconnect();
   }
  }, [messageRef, message, currentUser, isResend]); 

  useEffect(() => {
    function handleClickOutsideMenu(e: MouseEvent) {
      if (messageMenuIsVisible && messageMenuRef.current && !messageMenuRef.current.contains(e.target as HTMLElement)) {
        if (!messageRef.current?.contains(e.target as HTMLElement)) setMessageMenuIsVisible(false);
      }
    }
    window.addEventListener('click', handleClickOutsideMenu);
    return () => window.removeEventListener('click', handleClickOutsideMenu);
  }, [messageMenuIsVisible]);

  useLayoutEffect(() => {
    if (messageMenuRef.current && parent && messageMenuIsVisible) {
      const {y : parentY, x: parentX} = parent.getBoundingClientRect();
      const { y: menuY, x: menuX } = messageMenuRef.current.getBoundingClientRect();
      if (parent.offsetWidth + parentX < menuX + messageMenuRef.current.offsetWidth) {
      const currentLeft = parseFloat(getComputedStyle(messageMenuRef.current).getPropertyValue('left'));
      const diff = (menuX + messageMenuRef.current.offsetWidth) - (parent.offsetWidth + parentX);
      messageMenuRef.current.style.setProperty('left', `${currentLeft - diff - 30}px`);
      }
      if (menuX < parentX) {
        const diff = parentX - menuX;
        const currentRight = parseFloat(getComputedStyle(messageMenuRef.current).getPropertyValue('right'));
        messageMenuRef.current.style.setProperty('right', `${currentRight - diff - 30}px`);
      }
       if (parent.offsetHeight < menuY) {
         const diff = menuY - parent.offsetHeight;
         const currentBottom = parseFloat(getComputedStyle(messageMenuRef.current).getPropertyValue('bottom'));
         messageMenuRef.current.style.setProperty('bottom', `${currentBottom + diff + 20}px`);
       }
       if (menuY < parentY) {
         messageMenuRef.current.style.setProperty('bottom', 'unset');
         messageMenuRef.current.style.setProperty('top', '100%');
       }
    }
  }, [messageMenuIsVisible, messageMenuRef, parent]);

  return (
    <m.article
    initial={{opacity: 0}}
    animate={{opacity: 1}}
    exit={{opacity: 0}}
    transition={{duration: 0.2}}
    layout 
    ref={messageRef} 
    className={isSelected ? msgClassName.concat(cl.selected).join(' ') : msgClassName.join(' ')}>
     {
      !isMediumViewport && <div className={cl.messageUserImage}>
      <Link to={`/profile/${message.user.link}`}>
      <img src={`${MEDIA_URL}/${user.avatar_img}`} alt={`${user.name} ${user.surname}`} />
      </Link>
   </div>
     }
     <div onClick={handleToggleMessageMenu} className={cl.messageContent}>
    { message.type === 'voice' && message.voiceSrc ? <VoiceMessage voiceSrc={message.voiceSrc} />
      : <> {'answerMessage' in message && message.answerMessage !== null && <div className={cl.answerMessage}>
        <span className={cl.answerMessageUser}>
        {`${message.answerMessage.user.name} ${message.answerMessage.user.surname}`}
        </span>
        <span className={cl.answerMessageText}>{getAnswerMessageText(message)}</span>
        </div>}
        {message.text !== '' && <Linkify options={{target: '_blank'}} as={'p'} tagName='p'>{message.text}</Linkify>}
          {message.attachments.length > 0 && <AttachmentList attachments={message.attachments} />}
          </>}
        <div className={cl.messageContentInfo}>
          <span className={cl.messageContentInfoTime}>
            <time>{getTimeString(message.createdAt)}</time>
            </span>
          {type === 'self' && <span 
           className={message.status === 'read' ? [cl.messageContentInfoStatus, cl.read].join(' ') : cl.messageContentInfoStatus}>
            {message.status === 'unread' ? <FaCheck /> : <TbChecks />}
            </span>}
        </div>
     </div>
     <AnimatePresence>
      {
        messageMenuIsVisible && <m.div 
        ref={messageMenuRef}
        onClick={stopPropaganation} 
        className={cl.messageMenu}
        initial={{y: 30, opacity: 0}}
        animate={{y: 0, opacity: 1}}
        exit={{y: -30, opacity: 0}}
        transition={{duration: 0.15}}
        >
          <ul aria-hidden={!messageMenuIsVisible} aria-label='Действия с сообщением' className={cl.messageMenuButtons}>
           <li role="button" 
           onClick={handleAnswerMessage} 
           aria-label="Ответить на сообщение" 
           className={cl.messageMenuButton}><IoArrowUndo />Ответить</li>
           {message.userId === currentUser.id && !isResend &&
           <li role="button" onClick={handleStartEditingMessage} aria-label="Изменить сообщение" className={cl.messageMenuButton}><CiEdit />Изменить</li>}
           <li role="button" onClick={openResendMenu} aria-label="Переслать сообщение" className={cl.messageMenuButton}><IoArrowRedo /> Переслать</li>
           <li role="button" 
           onClick={handleSelectMessage} 
           aria-label={isSelected ? 'Отменить выделение' : 'Выделить'} 
           className={cl.messageMenuButton}><FaRegCircleCheck />{isSelected ? 'Отменить выделение' : 'Выделить'}</li>
           <li role="button"
           onClick={handleRemoveForSelf} 
           aria-label="Удалить сообщение для себя"
            className={cl.messageMenuButton}><IoTrashBin />Удалить для себя</li>
           {message.userId === currentUser.id && !isResend &&
           <li role="button"
           onClick={handleRemoveForAll} 
           aria-label="Удалить сообщение для всех" 
           className={cl.messageMenuButton}><IoTrashBin />Удалить для всех</li>}
           {isResend && <li role="button"
            aria-label="Отменить пересылку сообщения"
            className={cl.messageMenuButton}
            >
             <FaRegCircleCheck />
             Отменить пересылку 
            </li> 
          }
          </ul>
        </m.div>
      }
     </AnimatePresence>
    </m.article>
    
  )
});

export default MessageItem;