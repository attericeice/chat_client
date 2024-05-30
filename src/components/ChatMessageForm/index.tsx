import { FC, ChangeEvent, useState, useRef, useCallback, useContext, useEffect, lazy, MouseEvent as ReactMouseEvent } from 'react';
import { useTypedSelector } from '../../hooks/useTypedStore';
import socket from '../../api/socketApi';
import { IMessage } from '../../types/Message';
import { FaPaperclip, FaRegPaperPlane, FaPlus, FaRegFileLines, FaXmark, FaMicrophone, FaCheck } from "react-icons/fa6";
import { IoArrowUndo } from 'react-icons/io5';
import { MdOutlineEmojiEmotions } from "react-icons/md";
import AttachmentEditMenu from '../AttachmentEditMenu';
import { AnimatePresence, m } from 'framer-motion';
import {EmojiClickData, Theme}  from 'emoji-picker-react';
import { ChatContext } from '../../modules/Chat';
import { Modal, LazyComponent, CircleLoader } from '../../shared/UI';
import cl from './ChatMessageForm.module.scss';
const EmojiPicker = lazy(() => import('emoji-picker-react'));



interface IChatMessageFormProps {
  messageText: string;
  updatingMessage: IMessage | undefined;
  handleUpdateMessage: (message: string, isEmoji: boolean) => void;
  messageTextHandler: (message : string, isEmoji: boolean) => void;
  onSendMessage: (attachments : File[], voiceSrc?: File) => void;
  cancelUpdateMessage: () => void;
  updateMessage: () => void;
  scrollBottom: () => void;
}

const ChatMessageForm : FC<IChatMessageFormProps> = ({
  messageText, 
  messageTextHandler, 
  onSendMessage, 
  updatingMessage, 
  handleUpdateMessage,
  cancelUpdateMessage,
  updateMessage,
  scrollBottom
}) => {

const { theme } = useTypedSelector(state => state.themeReducer);

const { user } = useTypedSelector(state => state.userReducer);

const { answerMessage, onCancelAnswer } = useContext(ChatContext);

const [attachments, setAttachments] = useState<File[]>([]);

const [attachmentListOpen, setAttachmentsListOpen] = useState<boolean>(false);

const [attachmentsMenuOpen, setAttachmentsMenuOpen] = useState<boolean>(false);

const [emojiPickerVisible, setEmojiPickerVisible] = useState<boolean>(false);

const [isRecording, setIsRecording] = useState<boolean>(false);

const [permission, setPermisson] = useState<boolean>(false);

const [process, setProcess] = useState<boolean>(false);

const fileInputRef = useRef<HTMLInputElement>(null);

const recorderRef = useRef<MediaRecorder | null>(null);

const attachmentMenuRef = useRef<HTMLDivElement>(null);

const formButtonsRef = useRef<HTMLDivElement>(null);

const handleTypeMessage = ( e : ChangeEvent<HTMLTextAreaElement> ) => {
  updatingMessage 
  ? handleUpdateMessage(e.target.value, false)
  : messageTextHandler(e.target.value, false);
}

const openFileDialog = () => {
  if (attachmentsMenuOpen) setAttachmentsMenuOpen(() => false);
  fileInputRef.current?.click();
}

const handleOpenAttachmentList = () => {
  if (attachmentsMenuOpen) setAttachmentsMenuOpen(() => false);
  setAttachmentsListOpen(prev => !prev);
}

const handleOpenAttachmentMenu = () => setAttachmentsMenuOpen(prev => !prev);

const handleSelectFiles = (e : ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files.length) {
    const fileList : File[] = [];
    for (let i = 0; i < e.target.files.length; i++) fileList.push(e.target.files[i]);
    setAttachments(prev => [...prev, ...fileList]);
  }
  e.target.value = '';
  e.target.files = null;
}

const handleRemoveFiles = (filename: string) => {
  setAttachments(prev => prev.filter(file => file.name !== filename));
}

const handleSendMessage = useCallback(() => {
  setProcess(true);
  onSendMessage(attachments);
  setAttachments([]);
}, [attachments, onSendMessage, setProcess]);

const onSelectEmoji = ( emojiObject : EmojiClickData) => {
    updatingMessage 
    ? handleUpdateMessage(emojiObject.emoji, true) 
    : messageTextHandler(emojiObject.emoji, true);
}

const handleOpenEmojiPicker = (e : ReactMouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
  setEmojiPickerVisible(prev => !prev);
}

const getSendMessageButtonStatus = () => !messageText;

const getAnswerMessageContent = () => {
  if (answerMessage?.text) return answerMessage.text;
  if (answerMessage?.attachments.length) return `${answerMessage.attachments.length} вложений`;
  if (answerMessage?.parent.length) return `${answerMessage.parent.length} пересланных сообщений`;
  if (answerMessage?.type === 'voice') return 'Голосовое сообщение';
}

  const startRecording = () => {
    recorderRef.current?.start();
  }

  const stopRecording = () => {
   recorderRef.current?.stop();
  }

  const handleToggleRecording = () => isRecording ? stopRecording() : startRecording();

  const updateMessageHandler = useCallback(() => {
    setProcess(true);
    updateMessage();
  }, [setProcess, updateMessage]);

  useEffect(() => {
    async function getPermission() {
      try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});
      setPermisson(true);
      recorderRef.current = new MediaRecorder(stream);
      recorderRef.current.onstart = () => setIsRecording(true);
      recorderRef.current.onstop = () => setIsRecording(false);
      recorderRef.current.ondataavailable = (e: BlobEvent) => {
        const voiseMessage = new File([e.data], 'audio.ogg');
        onSendMessage([], voiseMessage);
        setAttachments([]);
      }
      }
      catch(e) {
      console.log(e);
      setPermisson(false);
      }
    }
      getPermission();
      return () => {
        if (recorderRef.current instanceof MediaRecorder) {
          recorderRef.current.stop();
          recorderRef.current.stream.getAudioTracks()[0].stop();
        }
      }
    
  }, [user, onSendMessage]);

  useEffect(() => {
    const handleClickEnter = (e : KeyboardEvent) => {
       if (updatingMessage) {
        if (e.key === 'Enter' && updatingMessage.text?.trim() !== '' && !process) updateMessageHandler();
       } else {
        if (e.key === 'Enter' && messageText.trim() && !process) {
          if (e.shiftKey) {
            messageTextHandler(messageText + '\n', false);
          } else {
            handleSendMessage();
          }
        }
       }
    }
    window.addEventListener('keydown', handleClickEnter);
    return () => window.removeEventListener('keydown', handleClickEnter);
  }, [messageText, handleSendMessage, updatingMessage, updateMessageHandler, process]);

  useEffect(() => {
    if (!attachmentMenuRef.current || !formButtonsRef.current) return;
    const handleClickOutsideAttachmentMenu = (e : MouseEvent) => {
      if (!attachmentMenuRef.current?.contains(e.target as HTMLElement)) {
        setAttachmentsMenuOpen(false);
      }
    }
    const handleClickOutsideFormButtons = (e: MouseEvent) => {
      if (!formButtonsRef.current?.contains(e.target as HTMLElement)) {
        setEmojiPickerVisible(false);
      }
    }
    window.addEventListener('click', handleClickOutsideAttachmentMenu);
    window.addEventListener('click', handleClickOutsideFormButtons);
    return () => {
      window.removeEventListener('click', handleClickOutsideAttachmentMenu);
      window.removeEventListener('click', handleClickOutsideFormButtons);
    }
  }, [attachmentMenuRef, formButtonsRef]);

  useEffect(() => {
   const handleActionSuccess = () => {
    setProcess(false);
    scrollBottom();
   }
   socket.on('actionSuccess', handleActionSuccess);
   return () => {
    socket.off('actionSuccess', handleActionSuccess);
   }
  }, []);

  return (
   <>
   <section className={cl.chatMessageFormContainer}>
    <div className={cl.chatMessageForm}>
      <AnimatePresence>
        {
          answerMessage !== undefined && <m.div
          initial={{x: -100, opacity: 0}}
          animate={{x: 0, opacity: 1}}
          exit={{x: -100, opacity: 0}} 
          className={cl.answerMessage}>
          <IoArrowUndo />
          <div className={cl.answerMessageInfo}>
            <span className={cl.answerMessageInfoUser}>Ответ на {answerMessage.user.name}</span>
            <span className={cl.answerMessageInfoContent}>
              {
                getAnswerMessageContent()
              }
            </span>
          </div>
           <button aria-hidden={answerMessage === undefined}
           onClick={onCancelAnswer}
           aria-label='Отменить ответ на сообщение'
           className={cl.cancelAnswer}
           >
           <FaXmark />
           </button>
          </m.div>
        }
      </AnimatePresence>
     <div ref={attachmentMenuRef} className={cl.attachmentMenu}>
      <input type='file' className={cl.attachmentMenuInput} ref={fileInputRef} onChange={handleSelectFiles} multiple />
        <button onClick={handleOpenAttachmentMenu} className={cl.attachmentMenuButton}><FaPaperclip /></button>
        <AnimatePresence>
          {
            attachments.length > 0 && <m.span
             key="attachmentsCount"
             initial={{scale: 0}}
             animate={{scale: [1.5, 1], rotate: [0, 360]}}
             exit={{scale: [1.5, 0]}}
            className={cl.attachmentsCount}>
              {attachments.length}
              </m.span>
          }
        </AnimatePresence>
       <AnimatePresence>
       {attachmentsMenuOpen && 
          <m.div
          key="attachmentsMenu"
          initial={{y: -25, opacity: 0}}
          animate={{y: 0, opacity: 1}}
          exit={{y: -25, opacity: 0}}
          transition={{ease: 'easeInOut', duration: 0.2}}
          className={cl.attachmentMenuDropDown}>
          <ul className={cl.attachmentMenuDropDownList}>
            <li role="button" onClick={openFileDialog} className={cl.listItem}><FaPlus /> Выбрать файл</li>
            <li role="button" onClick={handleOpenAttachmentList} className={cl.listItem}><FaRegFileLines /> Показать вложения</li>
          </ul>
        </m.div>
          }
       </AnimatePresence>
     </div>
     <AnimatePresence mode="popLayout">
     {
      isRecording ? <m.span
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}} 
      className={cl.recordingStatus}>Для отмены отпустите клавишу микрофона</m.span>
      : <m.textarea
      autoFocus={false}
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}} 
      value={updatingMessage ? updatingMessage.text : messageText} 
      onChange={handleTypeMessage} 
      placeholder='Написать сообщение...' />
     }
     </AnimatePresence>
     <div ref={formButtonsRef} className={cl.chatMessageFormButtons}>
     <AnimatePresence>
      {emojiPickerVisible && <m.div
      initial={{opacity: 0, y: 20}}
      animate={{opacity: 1, y: 0}}
      exit={{opacity: 0, y: 20}} 
      className={cl.emojiPickerMenu}>
      <LazyComponent loader={<div className={cl.emojiLoader}><CircleLoader size={40}/></div>}>
      <EmojiPicker onEmojiClick={onSelectEmoji}
        width={'100%'} 
        height={'400px'}
        theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
        autoFocusSearch={false}
        searchPlaceHolder='Найти...'
        className={cl.chatFormEmojiPicker}
        />
      </LazyComponent>
        </m.div>}
        </AnimatePresence>
     <button title='Открыть меню эмодзи'
     aria-label='Открыть меню эмодзи'
     tabIndex={0}
     onClick={handleOpenEmojiPicker} className={cl.selectEmojiButton}>
      <MdOutlineEmojiEmotions />
     </button>
    {
      process ? <CircleLoader size={25} />
      : updatingMessage ? <>
      <button onClick={updateMessageHandler} title="Обновить сообщение"
      aria-label="Обновить сообщение" 
      className={cl.updateMessageButton}>
      <FaCheck />
      </button>
      <button onClick={cancelUpdateMessage} title="Отменить редактирование"
      aria-label="Отменить редактирование сообщения" 
      className={cl.cancelUpdateButton}>
       <FaXmark />
      </button>
      </>
      :  
        messageText !== '' ? <button
        title='Отправить сообщение'
        aria-label='Отправить сообщение'
        aria-hidden={!getSendMessageButtonStatus()} 
        disabled={getSendMessageButtonStatus()} 
        onClick={handleSendMessage} 
        className={cl.sendMessageButton}>
       <FaRegPaperPlane />
       </button>
       : <button onClick={handleToggleRecording}
       className={cl.sendVoiceMessageButton} disabled={!permission}>
        <FaMicrophone />
       </button>
    }
     </div>
    </div>
    </section>
    <AnimatePresence>
    {attachmentListOpen && <Modal closeModal={() => setAttachmentsListOpen(false)}>
      <AttachmentEditMenu 
    attachments={attachments} 
    onDeleteAttachment={handleRemoveFiles} 
    handleCloseMenu={handleOpenAttachmentList}
    ariaHidden={!attachmentListOpen}
    ariaLabel='Просмотр прикрепленных файлов'
    />
    </Modal>}
    </AnimatePresence>
   </>
  )
}

export default ChatMessageForm;