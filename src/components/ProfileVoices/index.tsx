import { memo } from 'react';
import { useGetProfileDialogVoicesQuery } from '../../api/userApi';
import { m } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { FaCheck } from 'react-icons/fa6';
import { TbChecks } from 'react-icons/tb';
import { ErrorHandler, NoItems } from '../../shared/UI';
import VoiceMessage from '../VoiceMessage';
import { MEDIA_URL } from '../../shared/constants';
import cl from './ProfileVoices.module.scss';

const getMessageDate = (date : string) => {
   const messageDate = new Date(date).toLocaleDateString('ru-Ru', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
   });
   return messageDate;
}

const ProfileVoices  = () => {

  const { link } = useParams();

  const { data : voices, isLoading, isError } = useGetProfileDialogVoicesQuery(link || '', {skip: link === undefined});

  const messageVoicesClassList = !isLoading && (!voices || !voices.length) 
  ? [cl.messageVoicesList, cl.empty] 
  : [cl.messageVoicesList];

  return (
    <div className={messageVoicesClassList.join(' ')}>
      {
         isLoading 
         ? [...new Array(5)].map((_, i) => <div key={i} className={cl.voiceItemSkeleton}>
          <m.div animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
          transition={{ease: 'linear', duration: 1, repeat: Infinity}} className={cl.voiceItemSkeletonUser} />
          <m.div animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
          transition={{ease: 'linear', duration: 1, repeat: Infinity}} className={cl.voiceItemSkeletonVoice} />
         </div>)
         : isError
         ? <ErrorHandler />
         : voices && voices.length
         ? voices.map(message => <div key={message.id} className={cl.voiceMessageItem}>
          <div className={cl.voiceMessageItemUser}>
          <img src={`${MEDIA_URL}/${message.user.avatar_img}`} alt={`${message.user.name} ${message.user.surname}`} />
          </div>
          <VoiceMessage voiceSrc={message.voiceSrc ?? ''} />
          <div className={cl.messageStatus}>
          <span className={cl.messageDate}><time>{getMessageDate(message.createdAt)}</time></span>
          <span className={message.status === 'read' ? [cl.messageReadStatus, cl.read].join(' ') : cl.messageReadStatus}>
          {message.status === 'read' ? <TbChecks /> : <FaCheck />}
          </span>
          </div>
         </div>)
         : <NoItems type="voices" label="У вас нет общих голосовых сообщений"/>
      }
    </div>
  )
}

export default memo(ProfileVoices);