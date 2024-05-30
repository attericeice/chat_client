import { useRef, useEffect, FC, useContext } from 'react';
import { useTypedSelector } from '../../hooks/useTypedStore';
import socket from '../../api/socketApi';
import { IMessage, ResendMessages } from '../../types/Message';
import { ChatContext, ISelectedMessage } from '../../modules/Chat';
import { FaXmark} from 'react-icons/fa6';
import MessageItem from '../MessageItem';
import { m } from 'framer-motion';
import cl from './ResendMessages.module.scss';


interface IResendMessagesProps {
    resendMessages: ResendMessages[];
    parentMessage: IMessage;
    type: 'self' | 'other';
    parent: HTMLElement | null;
    selectedMessages: ISelectedMessage[];
}

const ResendMessagesList : FC<IResendMessagesProps> = ({resendMessages, type, parent, parentMessage, selectedMessages}) => {

  const resendMessageRef = useRef<HTMLDivElement>(null);

  const { user } = useTypedSelector(state => state.userReducer);
  
  const { onRemoveForSelf, onRemoveForAll } = useContext(ChatContext);

  const handleCancelResend = () => onRemoveForAll({...parentMessage, isResended: false});
  
  const handleRemoveForSelf = () => onRemoveForSelf({...parentMessage, isResended: false});
  
  useEffect(() => {
   if (!resendMessageRef.current) return;
   const resendMessagesElem = resendMessageRef.current;
   const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && parentMessage.status === 'unread' && parentMessage.userId !== user.id) {
         socket.emit('readMessage', {userId: user.id, messageId: parentMessage.id, dialogId: parentMessage.dialogId});
      }
      observer.disconnect();
   });
   observer.observe(resendMessagesElem);
   return () => {
     if (resendMessagesElem) observer.unobserve(resendMessagesElem);
     observer.disconnect();
   }
  }, [resendMessageRef, parentMessage, user]);

  return (
    <div ref={resendMessageRef} className={type === 'self' ? cl.resendMessages : [cl.resendMessages, cl.other].join(' ')}>
            <h3 className={cl.resendMessagesTitle}>Пересланные сообщения</h3>
            <div className={cl.resendMessagesList}>
            {
              resendMessages.map(resendMessage => <MessageItem key={`resend${resendMessage.resends.id}`}
              message={resendMessage.resends}
              isSelected={selectedMessages.findIndex(selectedMessage => selectedMessage.id === resendMessage.resends.id) >= 0}
              type={type}
              parent={parent}
              isResend={true}
              />)
             }
            </div>
            <div className={cl.resendMessagesButtons}>
             {
              type === 'self'
              ?  <m.button
              title="Отменить пересылку"
              aria-label="Отменить пересылку"
              whileTap={{scale: 1.2}}
              whileHover={{scale: 1.05}}
              className={cl.selectMessageButton} onClick={handleCancelResend}>
               <FaXmark />
              </m.button>
              :  <m.button
              title="Удалить для себя"
              aria-label="Удалить для себя"
              whileTap={{scale: 1.2}}
              whileHover={{scale: 1.05}}
              className={cl.selectMessageButton} onClick={handleRemoveForSelf}>
               <FaXmark />
              </m.button>
             }
            </div>
          </div>
  )
}

export default ResendMessagesList;