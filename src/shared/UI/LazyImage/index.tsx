import { FC, useState, useEffect, useRef } from 'react';
import { BlurhashCanvas } from 'react-blurhash';
import { m } from 'framer-motion';
import cl from './LazyImage.module.scss';

interface ILazyImageProps {
    src: string;
    blurhash: string;
    className?: string;
}

const imgVariants = {
  visible: {
    opacity: 1
  },
  hidden: {
    opacity: 0
  }
}

const LazyImage : FC<ILazyImageProps> = ({src, blurhash, className}) => {
  
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [imageVisible, setImageVisible] = useState<boolean>(false);

  const observerRef = useRef<HTMLDivElement>(null);

  const imageRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    if (!observerRef.current) return;
    const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          setImageVisible(true);
          observer.disconnect();
        }
    });
    observer.observe(observerRef.current);
    return () => {
      observer.disconnect();
    }
  }, [observerRef])

  useEffect(() => {
  if (!imageVisible || !imageRef.current) return;
     const image = imageRef.current;
     image.onload = () => setTimeout(() => setIsLoading(false));
     image.src = src;
     return () => {
      if (image) {
        image.onload = null;
        image.src = '';
      }
     }
  }, [src, imageVisible, imageRef]);
  
  return (
     <>
     {
      (!imageVisible || isLoading) && <BlurhashCanvas hash={blurhash} />
     }
     <m.img variants={imgVariants} animate={isLoading ? "hidden" : "visible"} ref={imageRef} 
     alt={src}
     />
     <div className={cl.observer} ref={observerRef}></div>
     </>
  )
}

export default LazyImage;