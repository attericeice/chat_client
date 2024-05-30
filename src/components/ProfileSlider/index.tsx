import { FC, useState, useRef, useEffect } from 'react';
import { IProfile } from '../../types/User';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import { AnimatePresence, m } from 'framer-motion';
import { BlurhashCanvas } from 'react-blurhash';
import { MEDIA_URL } from '../../shared/constants';
import cl from './ProfileSlider.module.scss';



interface IProfileSliderProps {
    media: IProfile['user_media'];
}

const DRAG_LIMIT = 50;

const slideVariants = {
  initial: (direction: number) =>  ({
    x: direction > 0 ? '100%' : '-100%',
  }),
  animate: {
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      x: {duration: 0.3}
    }
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    transition: {
      type: 'spring',
      stiffness: 100,
      x: {duration: 0.3}
    }
  })
}

const sliderButtonsVariants = {
  start: {
    opacity: 0
  },
  visible: {
    opacity: 1,
  },
  hidden: {
    opacity: 0
  }
}


const ProfileSlider : FC<IProfileSliderProps> = ({media}) => {
    
    const [currentSlide, setCurrentSlide] = useState(0);

    const [isAnimating, setIsAnimating] = useState(false);

    const [direction, setDirection] = useState(0);

    const [slideButtonsVisible, setSlideButtonsVisible] = useState(false);

    const [slideImageLoading, setSlideImageLoading] = useState(false);

    const [startX, setStartX] = useState(0);

    const sliderContainerRef = useRef<HTMLDivElement>(null);

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

      const getAnySlide = (slide : number) => {
         if (!isAnimating && currentSlide !== slide) {
            setIsAnimating(true);
            const direct = slide > currentSlide ? 1 : -1;
            setDirection(direct);
            setCurrentSlide(slide);
         }
         else return;
      }

      const toggleSlideButtonsVisible = () => setSlideButtonsVisible(prev => !prev);

        const getSlideContent = () => {
          switch (media[currentSlide].type) {
           case 'image': 
             return  <m.img
             style={slideImageLoading ? {display: 'none'} : undefined}
             onDragStart={onDragStart}
             onDragEnd={onDragEnd}
             drag='x'
             dragConstraints={{left: 0, right: 0}}
             ref={currentSlideImageRef}
             src={`${MEDIA_URL}/${media[currentSlide].src}`}
             key={media[currentSlide].src}
             />
            case 'video':
              return <m.video autoPlay
              onDragEnd={onDragEnd}
              drag='x'
              dragConstraints={{left: 0, right: 0}}
              key={media[currentSlide].src}
              >
              <source src={`${MEDIA_URL}/${media[currentSlide].src}`} />
              </m.video>
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

     useEffect(() => {
     
       if (currentSlideImageRef.current) {
          setSlideImageLoading(true);
          currentSlideImageRef.current.onload = () => {
            setTimeout(() => setSlideImageLoading(false));
          }
       }
     }, [currentSlide, setSlideImageLoading]);
      
    return (
    <div onMouseOver={toggleSlideButtonsVisible} onMouseOut={toggleSlideButtonsVisible} ref={sliderContainerRef} className={cl.profileSlider}>
     <ul
     aria-label={`Навигация по слайдам`} 
     className={cl.slideNavigation}>
     {
      media.map((media, i, list) => <li
      onClick={() => getAnySlide(i)}
      style={{width: `${100 / list.length}%`}}
      aria-label={`Слайд №${i}`} 
      className={cl.slideNavigationItem} 
      key={`slide-link/${media.id}`}>
      {currentSlide === i && <m.span layoutId='currentSlide' className={cl.slideNavigationItemCurrent} />}
      </li>)
     }
     </ul>
     {slideImageLoading && media[currentSlide].blurhash !== null && <BlurhashCanvas hash={media[currentSlide].blurhash} />}
     <AnimatePresence mode="popLayout" custom={direction} initial={false}>
     <m.div
     key={media[currentSlide].src}
     variants={slideVariants}
     initial="initial"
     animate="animate"
     exit="exit"
     layout
     custom={direction}
     onAnimationComplete={() => setIsAnimating(false)}
     className={cl.currentSlide}>
     {getSlideContent()}
     </m.div>
     </AnimatePresence>
     <AnimatePresence>
        {slideButtonsVisible && <>
        <m.button 
        variants={sliderButtonsVariants}
        initial="start"
        animate="visible"
        exit="exit"
        className={cl.sliderButton} 
        onClick={getPrevSlide}>
        <FaChevronLeft />
        </m.button>
        <m.button
        variants={sliderButtonsVariants}
        initial="start"
        animate="visible"
        exit="exit" 
        className={cl.sliderButton} 
        onClick={getNextSlide}>
        <FaChevronRight />
        </m.button>
        </>
        }
     </AnimatePresence>
    </div>
    )
}

export default ProfileSlider;