import { useRef, FC, MouseEvent, memo } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useWavesurfer } from '@wavesurfer/react';
import {FaPlay, FaPause} from 'react-icons/fa6';
import { MEDIA_URL } from '../../shared/constants';
import cl from './VoiceMessage.module.scss';


interface IVoiceMessageProps {
    voiceSrc: string;
}

const VoiceMessage : FC<IVoiceMessageProps> = ({voiceSrc}) => {

   const isSmallViewport = useBreakpoint(449);

   const isMediumViewport = useBreakpoint(992);

   const handleStopPropagation = (e: MouseEvent<HTMLDivElement>) => e.stopPropagation();

   const waveRef = useRef<HTMLDivElement>(null);

   const getVoiceMessageWidth = () : number => {
      if (!isMediumViewport) return 250;
      if (isMediumViewport && !isSmallViewport) return 200;
      else return 100;
   }

   const {wavesurfer, isPlaying } = useWavesurfer({
      container: waveRef,
      waveColor: 'white',
      progressColor: 'blue',
      url: `${MEDIA_URL}/${voiceSrc}`,
      width: getVoiceMessageWidth(),
      height:30,
      backend: 'WebAudio',
      barWidth: isMediumViewport ? 1 : 2,
      barHeight: isMediumViewport ? 1 : 2,
   });

   const handleTogglePlayButton = () => {
    wavesurfer && wavesurfer.playPause();
   }

   return (
   <div className={cl.voiceMessagePlayer}>
    <button onClick={handleTogglePlayButton} className={cl.playerButton}>
    {isPlaying ? <FaPause /> : <FaPlay />}
    </button>
    <div onClick={handleStopPropagation} ref={waveRef} className={cl.waveforms}></div>
   </div>
   )
}

export default memo(VoiceMessage);