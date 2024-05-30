import { useEffect, useRef, useState, useMemo, useContext, forwardRef, memo, ReactNode } from 'react';
import { useTypedSelector } from '../../hooks/useTypedStore';
import { IMessage } from '../../types/Message';
import { IUser } from '../../types/User';
import { ChatContext, ISelectedMessage } from '../../modules/Chat';
import { FaChevronDown } from 'react-icons/fa';
import MessageItem from '../MessageItem';
import { CircleLoader } from '../../shared/UI';
import ResendMessagesList from '../ResendMessages';
import { AnimatePresence, m } from 'framer-motion';
import BgDark from '../../assets/images/bg-dark.jpeg';
import BgLight from '../../assets/images/bg-light.jpeg';
import cl from './MessageList.module.scss';


interface IMessageListProps {
    messages : IMessage[];
    currentUser: IUser;
    count: number;
    isLoading: boolean;
    isError: boolean;
    nextPageLoading: boolean;
    handleNextPage: () => void;
    dialogId : string | undefined;
    scrollBottom: () => void;
    selectedMessages: ISelectedMessage[];
}

const scrollButtonVariants = {
  visible: {
     y: 0,
     opacity: 1,
  },
  hidden: {
    y: 10,
    opacity: 0,
  },
}

let currentDate : string | null = null;

const getDateTabulation = (date : string) => {
   const dateTabulator = new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
   });
   if (dateTabulator !== currentDate) {
    currentDate = dateTabulator;
    return dateTabulator;
   }
   return null;
}

const MessageWrapper = ({children} : {children: ReactNode}) => <>{children}</>

const MessageList = forwardRef<HTMLDivElement, IMessageListProps>((
  {
  scrollBottom, 
  messages, 
  currentUser, 
  count, 
  handleNextPage, 
  isLoading, 
  isError,
  nextPageLoading, 
  dialogId,
  selectedMessages
}, 
  ref
  ) => {

  const { theme } = useTypedSelector(state => state.themeReducer);

  const { parent } = useContext(ChatContext);

  const infiniteScrollRef = useRef<HTMLDivElement>(null);

  const [allMessagesLoaded, setAllMessageLoaded] = useState(false);

  const otherUnreadMessages = useMemo(() => {
    return messages.filter(m => m.status === 'unread' && m.userId !== Number(currentUser.id)).length;
  }, [messages, currentUser]);

  useEffect(() => {
     if (messages.length >= count && !isLoading) setAllMessageLoaded(true);
     else setAllMessageLoaded(false);
  }, [messages, count, isLoading]);

  useEffect(() => {
    scrollBottom();
  }, [isLoading, dialogId]);

  useEffect(() => {
    if (infiniteScrollRef.current) {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !isLoading) {
        if (allMessagesLoaded) {
          observer.disconnect();
          return;
        }
        handleNextPage();
      }
    }, {threshold: 0.5});
    observer.observe(infiniteScrollRef.current);

    return () => observer.disconnect();
  }
  }, [allMessagesLoaded, isLoading, handleNextPage, infiniteScrollRef]);

  const background = theme === 'light' ? BgLight : BgDark;

  return (
    <section ref={ref} className={cl.messages} style={{backgroundImage: `url(${background})`}}>
       {(isLoading || nextPageLoading) && <div style={{alignSelf:'center'}}><CircleLoader size={20}/></div>}
     <div ref={infiniteScrollRef} className={cl.scrollObserver}></div>
     <AnimatePresence initial={false}>
     {
      messages.length > 0 && messages.map(message => {
        const dateTabulator = getDateTabulation(message.createdAt);
        return <MessageWrapper key={message.id}>
        {
          dateTabulator !== null && <span className={cl.tabulator} key={dateTabulator}>{dateTabulator}</span>
        }
        {
            !message.parent || message.parent.length === 0 ?
              <MessageItem 
                key={message.id} 
                message={message} 
                type={currentUser.id === message.userId ? 'self' : 'other'}
                parent={parent}
                isSelected={selectedMessages.findIndex(selectedMessage => selectedMessage.id === message.id) >= 0}
                isResend={false}
                />
                :<ResendMessagesList 
                resendMessages={message.parent}
                key={`resendsBlock${message.id}`}
                parent={parent}
                parentMessage={message}
                type={currentUser.id === message.userId ? 'self' : 'other'}
                selectedMessages={selectedMessages}
                />
              
        }
       </MessageWrapper>
      })
     }
     </AnimatePresence>
    <AnimatePresence>
    {
      otherUnreadMessages > 0 &&
      <m.div
      variants={scrollButtonVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className={cl.scrollBottom}>
      <span className={cl.unreadCount}>
      {otherUnreadMessages}
      </span>
      <button
      title="К началу"
      aria-label="Перейти к последним сообщениям"
      aria-hidden={otherUnreadMessages === 0}
      onClick={scrollBottom}
      className={cl.scrollBottomButton}><FaChevronDown /></button>
      </m.div>
    }
    </AnimatePresence>
    </section>
  )
});

export default memo(MessageList);