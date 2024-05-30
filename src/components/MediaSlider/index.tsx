import { useState, useEffect, useRef } from 'react';
import { useUpdateAvatarMutation } from '../../api/userApi';
import { useTypedSelector } from '../../hooks/useTypedStore';
import { getRTKError } from '../../shared/helpres/getRTKError';
import { MessageAttachment } from '../../types/Message';
import { IUser, UserMedia } from '../../types/User';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { SerializedError } from '@reduxjs/toolkit';
import { AnimatePresence, m  } from 'framer-motion';
import { IoTrashBinOutline } from 'react-icons/io5';
import {FaFileCirclePlus, FaDownload, FaChevronLeft, FaChevronRight, FaRegCircleUser, FaXmark} from 'react-icons/fa6';
import {ToastContainer, toast, TypeOptions} from 'react-toastify';
import CircleLoader from '../../shared/UI/CircleLoader';
import { BlurhashCanvas } from 'react-blurhash';
import { MEDIA_URL } from '../../shared/constants';
import 'react-toastify/dist/ReactToastify.css';
import cl from './MediaSlider.module.scss';



interface IMediaSliderProps<T> {
    media: T[];
    onAddMedia?: (media : T) => void;
    initialSlide: number;
    removeMedia?: (id: number, src: string) => void;
    fetchLoading?: boolean;
    fetchError?: FetchBaseQueryError | SerializedError | undefined;
    fetchSuccess?: boolean;
    onClose: () => void;
}

const getSrc = (media : MessageAttachment | UserMedia) : string => {
  if ('src' in media) {
    return media.src;
  } else if ('attachSrc' in media) {
    return media.attachSrc;
  }
  return '';
}

const isAvatarImage = (media : MessageAttachment | UserMedia, user : IUser) : boolean => {
    if ('src' in media && user.avatar_img === media.src) {
      return true;
    } else if ('attachSrc' in media && user.avatar_img === media.attachSrc) {
      return true;
    }
    return false;
}

const DRAG_LIMIT = 50;

const showNotify = (message: string, type: TypeOptions) => {
  toast.success(message, {
    position: 'top-center',
    hideProgressBar: true,
    pauseOnHover: true,
    closeOnClick: true,
    autoClose: 2000,
    draggable: true,
    theme: 'dark',
    type
  })
}

function MediaSlider<T extends MessageAttachment | UserMedia>({ 
  media, 
  onAddMedia, 
  initialSlide, 
  removeMedia, 
  fetchError, 
  fetchLoading,
  fetchSuccess,
  onClose
 } : IMediaSliderProps<T>) {

  const [direction, setDirection] = useState(0);

  const [currentSlide, setCurrentSlide] = useState<number>(initialSlide);

  const [slideImageLoading, setSlideImageLoading] = useState<boolean>(false);

  const [isAnimating, setIsAnimating] = useState(false);
  
  const [startX, setStartX] = useState(0);

  const [notificationsHide, setNotificationsHide] = useState<boolean>(true);

  const { user } = useTypedSelector(state => state.userReducer);

  const [updateAvatar, {isLoading, error}] = useUpdateAvatarMutation();

  const currentSlideImageRef = useRef<HTMLImageElement>(null);

 const getNextSlide = () => {
  if (!isAnimating) {
  setIsAnimating(true);
  setDirection(1);
  if (currentSlide === media.length - 1) {
    setCurrentSlide(0);
    return;
  }
  setCurrentSlide(currentSlide + 1);
  }
  else return;
 }

const getPrevSlide = () => {
 if (!isAnimating) {
  setIsAnimating(true);
  setDirection(-1);
  if (currentSlide === 0) {
    setCurrentSlide(media.length - 1);
    return;
  }
  setCurrentSlide(currentSlide - 1);
 }
 else return;
}

  const slideVariants = {
    initial: (direction: number) =>  ({
      x: direction > 0 ? 1000 : -1000,
      opacity: .5
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        opacity: {duration: 0.2},
        x: {duration: 0.2}
      }
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -1000 : 1000,
      opacity: .5,
      transition: {
        type: 'spring',
        stiffness: 100,
        opacity: {duration: 0.2},
        x: {duration: 0.2}
      }
    })
  }

  const handleAddMedia = () => {
    if (onAddMedia) {
       onAddMedia(media[currentSlide]);
       setNotificationsHide(false);
    }
  }

  const handleRemoveMedia = () => {
   if (removeMedia) {
    if (currentSlide === media.length - 1) setCurrentSlide(prev => prev - 1);
    if (currentSlide === media.length) onClose();
    const deletedMedia = media[currentSlide] as UserMedia;
    removeMedia(deletedMedia.id, deletedMedia.src);
   }
  }

  const onDragStart = (e : DragEvent) => {
      setStartX(e.clientX);
  }

  const onDragEnd = (e : DragEvent) => {
    if (startX < e.clientX && e.clientX - startX >= DRAG_LIMIT) {
      getPrevSlide();
  }
  if (startX > e.clientX && startX - e.clientX >= DRAG_LIMIT) {
    getNextSlide();
  }
  }

 

  const handleUpdateAvatar = () => {
    const formData = new FormData();
    formData.append('userId', user.id.toString());
    formData.append('imagePath', getSrc(media[currentSlide]));
    updateAvatar(formData);
  }

  useEffect(() => {
    const error = getRTKError(fetchError);
    if (error.message !== '' && !notificationsHide) {
      showNotify(error.message, 'warning');
      setNotificationsHide(true);
    }
  }, [fetchError, notificationsHide]);

  useEffect(() => {
    if (error && !notificationsHide) {
      showNotify('Произошла ошибка', 'error');
    }
  }, [error, notificationsHide]);

  useEffect(() => {
     if (fetchSuccess && !notificationsHide) {
        const message = onAddMedia ? 'Медиафайл добавлен' : 'Медиафайл удален';
        showNotify(message, 'success');
     }
  }, [fetchSuccess, notificationsHide, onAddMedia, removeMedia]);

  useEffect(() => {
     if (currentSlideImageRef.current) {
       setSlideImageLoading(true);
       currentSlideImageRef.current.onload = () => {
        setTimeout(() => setSlideImageLoading(false));
       } 
     }
  }, [currentSlide, setSlideImageLoading])

 
  return (
    <div className={cl.slider__container}>
    <ToastContainer />
    <div className={cl.slideOverflowContainer}>
    <AnimatePresence initial={false} mode="popLayout" custom={direction}>
    <m.div
    key={getSrc(media[currentSlide])}
    variants={slideVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    custom={direction}
    layout
    onAnimationComplete={() => setIsAnimating(false)}
    className={cl.currentSlide}>
    {slideImageLoading && media[currentSlide].blurhash !== null && <BlurhashCanvas hash={media[currentSlide].blurhash} />}
     {
        media[currentSlide].type === 'image' ?
        <m.img
        style={slideImageLoading ? {display: 'none'} : undefined}
        src={`${MEDIA_URL}/${getSrc(media[currentSlide])}`} 
        key={getSrc(media[currentSlide])}
        drag='x'
        dragConstraints={{right: 0, left: 0}}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        ref={currentSlideImageRef}
        />
        : <m.video preload="metadata" controls
          key={getSrc(media[currentSlide])}
          drag='x'
          dragConstraints={{top: 0, left: 0}}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
            <source src={`${MEDIA_URL}/${getSrc(media[currentSlide])}`} />
        </m.video>
     }
    </m.div>
    </AnimatePresence>
    </div>
    <div className={cl.sliderButtons}>
    {
      isLoading ? <CircleLoader size={16} />
      : <button
        disabled={media[currentSlide].type !== 'image' || isAvatarImage(media[currentSlide], user)}
        title="Сделать главной"
        aria-label="Сделать главной"
        onClick={handleUpdateAvatar}
        className={cl.updateAvatarButton}>
        <FaRegCircleUser />
      </button>
    }
   {
    fetchLoading 
    ? <CircleLoader size={20} />
    : removeMedia  
    ? <button disabled={isAvatarImage(media[currentSlide], user)} onClick={handleRemoveMedia} className={cl.removeToMediaButton}>
      <IoTrashBinOutline />
    </button>
    : <button onClick={handleAddMedia} className={cl.addToAccountButton} 
    title={media[currentSlide].type === "image" 
    ? "Добавить в мои фотографии" 
    : "Добавить в мои видеозаписи"}
    aria-label={media[currentSlide].type === "image"
    ? "Добавить в мои фотографии" 
    : "Добавить в мои видеозаписи"}
    >
     <FaFileCirclePlus />
    </button>
   }
    <div className={cl.sliderPageButtons}>
    <button className={cl.changeSlideButton}
    onClick={getPrevSlide}
    title="Предыдущий слайд"
    aria-label="Предыдущий слайд"
    >
    <FaChevronLeft />
    </button>
    <span className={cl.currentSlideInfo}>
    <AnimatePresence mode="popLayout">
    <m.span
    >
    {currentSlide + 1}
    </m.span>
    </AnimatePresence>
    {`/${media.length}`}
    </span>
    <button
    onClick={getNextSlide}
    title="Следующий слайд"
    aria-label="Следующий слайд"
    className={cl.changeSlideButton}>
    <FaChevronRight />
    </button>
    </div>
    <a 
    title={media[currentSlide].type === "image" 
    ? "Скачать изображение" 
    : "Скачать видео"}
    aria-label={media[currentSlide].type === "image"
    ? "Скачать изображение" 
    : "Скачать видео"} 
    href={`${MEDIA_URL}/${getSrc(media[currentSlide])}`}
    target="_blank"
    rel="noopener noreferrer"
    download
    className={cl.downloadButton}>
    <FaDownload />
    </a>
    <button onClick={onClose} className={cl.closeSliderButton}><FaXmark /></button>
    </div>
    </div>
  )
}

export default MediaSlider;