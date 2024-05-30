import { useEffect, useState, createContext, useCallback, useRef, lazy, useLayoutEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLazyGetDialogMessagesQuery } from '../../api/messageApi';
import { useTypedSelector } from '../../hooks/useTypedStore';
import { useDebaunce } from '../../hooks/useDebaunce';
import { IUser } from '../../types/User';
import { IMessage } from '../../types/Message';
import socket from '../../api/socketApi';
import { getRTKError } from '../../shared/helpres/getRTKError';
import { AnimatePresence, m } from 'framer-motion';
import {ToastContainer, TypeOptions, toast} from 'react-toastify';
import ChatHeader from '../../components/ChatHeader';
import MessageList from '../../components/MessageList';
import ChatMessageForm from '../../components/ChatMessageForm';
import { Modal, DotsLoader, LazyComponent } from '../../shared/UI';
import { Helmet } from 'react-helmet-async';
import { ReactComponent as Warning } from '../../assets/images/warning.svg';
import 'react-toastify/dist/ReactToastify.css';
import cl from './Chat.module.scss';
const ResendDialog = lazy(() => import('../../components/ResendDialog'));


export interface ISelectedMessage extends IMessage {
  isResended: boolean;
}

interface IChatModuleContext {
  answerMessage: IMessage | undefined;
  onAnswerMessage: (message: IMessage) => void;
  onSelectMessage: (message: ISelectedMessage) => void;
  onUnselectMessage: (messageId: IMessage['id']) => void;
  onRemoveForSelf: (message? : ISelectedMessage) => void,
  onRemoveForAll: (message: ISelectedMessage) => void,
  onCancelAnswer: () => void;
  clearSelectedMessages: () => void;
  openResendMenu: () => void;
  startUpdate: (message: IMessage) => void;
  parent: HTMLDivElement | null;
} 

const defaultValue : IChatModuleContext = {
  answerMessage: undefined,
  onAnswerMessage: (message: IMessage) => null,
  onSelectMessage: (message: IMessage) => null,
  onUnselectMessage: (messageId: IMessage['id']) => null,
  onRemoveForSelf: (message? : ISelectedMessage) => null,
  onRemoveForAll: (message: ISelectedMessage) => null,
  onCancelAnswer: () => null,
  clearSelectedMessages: () => null,
  openResendMenu: () => null,
  startUpdate: (message: IMessage) => null,
  parent: null,
}

const showNotify = (message: string, type: TypeOptions, theme: 'dark' | 'light') => {
  toast.success(message, {
    position: 'top-center',
    hideProgressBar: true,
    pauseOnHover: true,
    closeOnClick: true,
    autoClose: 2000,
    draggable: true,
    theme,
    type,
  })
}

export const ChatContext = createContext<IChatModuleContext>(defaultValue);

const Chat = () => {

  const [messageText, setMessageText] = useState<string>('');

  const [page, setPage] = useState<number>(1);

  const [difference, setDifference] = useState<number>(0);

  const [typingUsers, setTypingUsers] = useState<Pick<IUser, 'name' | 'id'>[]>([]);

  const [answerMessage, setAnswerMessage] = useState<IMessage | undefined>();

  const [updatingMessage, setUpdatingMessage] = useState<IMessage>();

  const [selectedMessages, setSelectedMessages] = useState<ISelectedMessage[]>([]);

  const [currentUserTyping, setCurrentUserTyping] = useState<boolean>(false);

  const [resendMenuOpen, setResendMenuOpen] = useState<boolean>(false);

  const [chatError, setChatError] = useState<boolean>(false);

  const [refetch, forceRefetch] = useState<number>(0);

  const { user } = useTypedSelector(state => state.userReducer);

  const { theme } = useTypedSelector(state => state.themeReducer);

  const { id : dialogId } = useParams();

  const [getMessages, {data: messages, isLoading, isFetching, isError, error}] = useLazyGetDialogMessagesQuery();

  const messageListRef = useRef<HTMLDivElement>(null);

  const scrollHeightRef = useRef<number>(0);

  const scrollBottom = useCallback(() => {
    if (messageListRef.current && !isLoading && !isFetching) {
      messageListRef.current.scrollTo({top: messageListRef.current.scrollHeight});
    }
  }, [isLoading, isFetching, messageListRef]);

  
  const sendMessage = (attachments : File[], voiceSrc: File | undefined) => {
   if (messageText.length === 0 && !voiceSrc) return;
   let message : {[key: string]: any} = { type: 'default', text: messageText, userId: user.id, dialogId };
   if (answerMessage !== undefined) {
      message.isAnswer = true;
      message.answerMessageId = answerMessage.id;
      setAnswerMessage(undefined);
   }
   if (voiceSrc) {
     message.type = 'voice';
   }
   const socketMessage = {data: message, attachments, voiceSrc}
   socket.emit('message', socketMessage);
   setMessageText('');
  }

  const resendMessages = (dialogId: number) => {
    const filteredSelectedMessages = selectedMessages.filter(message => message.text !== null || message.voiceSrc !== null);
    if (filteredSelectedMessages.length > 0) {
      const message = {type: 'default', userId: user.id, dialogId};
      socket.emit('message', {data: message, resendMessages: filteredSelectedMessages.map(message => message.id)});
      showNotify('Сообщение отправлено', 'success', theme);
    }
    else showNotify('Выбранные сообщения не пересылаются', 'warning', theme);
    handleClearSelectedMessages();
    closeResendMenu(); 
  }

  const removeMessagesForSelf = (message?: ISelectedMessage) => {
      const filteredSelectedMessages = selectedMessages.filter(m => m.isResended === false && message?.id !== m.id);
      if (message && message.isResended === false) filteredSelectedMessages.push(message);
      if (filteredSelectedMessages.length > 0) {
        socket.emit('removeMessagesForSelf', {
          messagesIds: filteredSelectedMessages.map(message => message.id),
          userId: user.id,
          room: dialogId
        });
      }
      setDifference(prev => prev - filteredSelectedMessages.length);
      handleClearSelectedMessages();
  }

  const removeMessageForAll = (message: ISelectedMessage) => {
     const filteredSelectedMessages = selectedMessages.filter(m => m.userId === Number(user.id) 
     && m.isResended === false && m.id !== message.id);
     filteredSelectedMessages.push(message);
     socket.emit('removeMessagesForAll', {
      messagesIds: filteredSelectedMessages.map(m => m.id),
      room: dialogId,
      userId: user.id,
     });
     setDifference(prev => prev - filteredSelectedMessages.length);
     handleClearSelectedMessages();
  }

  const handleAnswerMessage = useCallback((message: IMessage) => setAnswerMessage(() => message), []);

  const handleSelectMessage = useCallback((message: ISelectedMessage) => {
    setSelectedMessages(prev => [...prev, message]);
  }, []);

  const handleCancelAnswer = useCallback(() => setAnswerMessage(undefined), []);

  const handleUnselectMessage = useCallback((messageId: IMessage['id']) => {
  setSelectedMessages(prev => prev.filter(message => message.id !== messageId));
  }, []);

  const handleClearSelectedMessages = useCallback(() => setSelectedMessages([]), []);

  const handleStartUpdateMessage = useCallback((message : IMessage) => setUpdatingMessage(message), []);

  const handleCancelUpdateMessage = () => setUpdatingMessage(undefined);

  const handleUpdateMessage = useCallback(() => {
    socket.emit('updateMessage', {
     message: updatingMessage,
     room: dialogId
    });
    handleCancelUpdateMessage();
  }, [updatingMessage, dialogId]);

  const openResendMenu = useCallback(() => setResendMenuOpen(prev => !prev), []);

  const closeResendMenu = useCallback(() => setResendMenuOpen(() => false), []);

  const handleNextPage = useCallback(() => setPage(prev => prev + 1), []);

  const handleEndUserTyping = useDebaunce(() => {
    socket.emit('endTyping', {rooms: [dialogId, messages?.dialogUser.link], id: user.id, name: user.name});
    setCurrentUserTyping(() => false);
  }, 1000);

  const handleTypeMessage = (message: string, isEmoji: boolean) => {
    if (!currentUserTyping) {
      socket.emit('startTyping', {rooms: [dialogId, messages?.dialogUser.link], id: user.id, name: user.name});
      setCurrentUserTyping(() => true);
    }
     isEmoji ? setMessageText(prev => prev + message) : setMessageText(message);
     handleEndUserTyping();
  }

  const handleChangeUpdatingMessageText = (message: string, isEmoji: boolean) => {
     if (isEmoji) {
       setUpdatingMessage(prev => {
        if (prev) {
          const currentText = prev.text ?? '';
          return ({...prev, text: currentText + message});
        }
        return prev;
       });
     } else {
         setUpdatingMessage(prev => {
           if (prev) {
             return ({...prev, text: message});
           }
           return prev;
         });
     }
  }

  useEffect(() => {
    socket.on('startTypingChat', typingUser => setTypingUsers(prev => [...prev, typingUser]));
    socket.on('endTypingChat', ({name, id}) => setTypingUsers(prev => prev.filter(user => user.id !== id)));
    return () => {
      socket.off('startTypingChat');
      socket.off('endTypingChat');
    } 
  }, []);

  useEffect(() => {
    socket.emit('join', dialogId);
    const handleLeaveChat = () => socket.emit('leave', dialogId);
    window.addEventListener('beforeunload', handleLeaveChat);
    return () => {
    handleLeaveChat();
    window.removeEventListener('beforeunload', handleLeaveChat);
    }
  }, [dialogId]);

  useEffect(() => {
   const handleIncrementDifference = () => setDifference(prev => prev + 1);
   socket.on('newMessage', handleIncrementDifference);
   return () => {
    socket.off('newMessage', handleIncrementDifference);
   }
  }, []);

  const getDialogId = () => dialogId;

  const getDiff = () => difference;

  useEffect(() => {
   if (user.id !== '') {
    if (messageListRef.current) {
      scrollHeightRef.current = messageListRef.current.scrollHeight - messageListRef.current.scrollTop;
    }
    getMessages({userId: user.id, page, dialogId: getDialogId(), difference: getDiff()});
   }
  }, [messageListRef, scrollHeightRef, page, user, refetch]);

  useEffect(() => {
    setPage(1);
    forceRefetch(Math.random());
  }, [dialogId]);

  useEffect(() => {
    if (!isLoading && !isFetching && messages) {
      if (messages.count > 0 && messages.dialogMessages.length === 0) {
        setPage(1);
        forceRefetch(Math.random());
      }
    }
  }, [messages, isLoading, isFetching]);

  
  useEffect(() => {
    if (error) {
      const toastedError = getRTKError(error);
    if (toastedError.status === 403) {
      setChatError(true);
    }
    }
    return () => {
      setChatError(false);
    }
  }, [error, setChatError]);
   

  useLayoutEffect(() => {
    if (messageListRef.current && scrollHeightRef.current) {
       const prevScroll = messageListRef.current.scrollHeight - scrollHeightRef.current;
       messageListRef.current.scrollTop = prevScroll;
    }
  }, [page, scrollHeightRef, messageListRef]);

  
  const getBlackListMessage = () => {
    if (messages) {
      if (messages.dialogUser.blacklist_banned.length > 0) {
        return <div className={cl.blacklist}>
        <Warning />
        <span className={cl.blacklistMessage}>
        Вы добавили пользователя {`${messages.dialogUser.name} ${messages.dialogUser.surname}`} в черный список
        </span>
        </div>
      }
      if (messages.dialogUser.blacklist_sender.length > 0) {
        return <div className={cl.blacklist}>
        <Warning />
        <span className={cl.blacklistMessage}>
        {`${messages.dialogUser.name} ${messages.dialogUser.surname}`} добавил вас в черный список
        </span>
        </div>
      }
    }
  }

 
  return (
    <m.div
    key={dialogId}
    initial={{opacity: 0}}
    animate={{opacity: 1}}
    exit={{opacity: 0}}
    transition={{duration: .4}} 
    className={cl.chatContainer}>
    <ToastContainer closeOnClick={true} />
    <>
    {
      chatError ? <div className={cl.notFound}>
        Страница не найдена
      </div>
      : <ChatContext.Provider value={{
        parent: messageListRef.current,
        answerMessage, 
        onAnswerMessage: handleAnswerMessage,
        onSelectMessage: handleSelectMessage,
        onUnselectMessage: handleUnselectMessage,
        onRemoveForSelf: removeMessagesForSelf,
        onRemoveForAll: removeMessageForAll,
        onCancelAnswer: handleCancelAnswer,
        clearSelectedMessages: handleClearSelectedMessages,
        openResendMenu: openResendMenu,
        startUpdate: handleStartUpdateMessage,
        }}>
        <Helmet>
        <title>{`Диалог с пользователем ${messages?.dialogUser.name} ${messages?.dialogUser.surname}`}</title>
        <meta name="description" content={`Диалог с пользователем ${messages?.dialogUser.name} ${messages?.dialogUser.surname}`} />
        <meta property='og:description' content={`Диалог с пользователем ${messages?.dialogUser.name} ${messages?.dialogUser.surname}`} />
        <meta property='og:url' content={`http://ichat-line/dialog/${dialogId}`} />
        <meta property='og:type' content="dialog" />
        <meta property='og:image' content={`http://localhost:7000/media/${messages?.dialogUser.avatar_img}`} />
        <meta property='og:image:width' content="200" />
        <meta property='og:image:height' content="200" />
        </Helmet>
        <ChatHeader
        dialogId={dialogId ? Number(dialogId) : 0} 
        user={messages?.dialogUser} 
        isLoading={isLoading} 
        typingUsers={typingUsers}
        selectedMessages={selectedMessages} 
        />
        <MessageList
        ref={messageListRef} 
        isLoading={isLoading}
        isError={isError}
        nextPageLoading={isFetching}
        messages={messages?.dialogMessages ?? []}
        count={messages?.count || 0} 
        currentUser={user}
        handleNextPage={handleNextPage}
        dialogId={dialogId}
        scrollBottom={scrollBottom}
        selectedMessages={selectedMessages}
        />
       {
         messages && (messages.dialogUser.blacklist_banned.length > 0 || messages.dialogUser.blacklist_sender.length > 0)
         ? getBlackListMessage()
         :<ChatMessageForm 
         messageText={messageText} 
         messageTextHandler={handleTypeMessage} 
         onSendMessage={sendMessage}
         updatingMessage={updatingMessage}
         handleUpdateMessage={handleChangeUpdatingMessageText}
         cancelUpdateMessage={handleCancelUpdateMessage}
         updateMessage={handleUpdateMessage}
         scrollBottom={scrollBottom}
         />
       }
        <AnimatePresence>
          {resendMenuOpen && <Modal closeModal={() => setResendMenuOpen(false)}>
            <LazyComponent loader={<DotsLoader />}>
            <ResendDialog handleCloseMenu={closeResendMenu} onResend={resendMessages}/>
            </LazyComponent>
            </Modal>}
        </AnimatePresence>
        </ChatContext.Provider>
    }
    </>
    </m.div>
  )
}

export default Chat;