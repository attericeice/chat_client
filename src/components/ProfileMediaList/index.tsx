import { useState, memo } from 'react';
import { useGetProfileDialogMediaQuery } from "../../api/userApi"
import { useParams } from "react-router-dom";
import { MessageAttachment } from '../../types/Message';
import MediaSlider from "../MediaSlider";
import { LazyImage, LazyComponent, Modal, DotsLoader, ErrorHandler, NoItems } from '../../shared/UI';
import { AnimatePresence, m } from 'framer-motion';
import { MEDIA_URL } from '../../shared/constants';
import cl from './ProfileMediaList.module.scss';


const getProfileMediaItemContent = (media : MessageAttachment) => {
    switch (media.type) {
        case 'image':
            return <LazyImage blurhash={media.blurhash} src={`${MEDIA_URL}/${media.attachSrc}`} />
        case 'video':
            return <video>
                <source src={`${MEDIA_URL}/${media.attachSrc}`} />
            </video>
        default: 
          return null;
    }
}

const ProfileMediaList = () => {

  const { link } = useParams();
  
  const [initialSlide, setInitialSlide] = useState<number>(0);

  const [sliderIsOpen, setSliderIsOpen] = useState<boolean>(false);

  const {data : profileMedia, isLoading, isError } = useGetProfileDialogMediaQuery(link || '', {skip: link === ''});

  const handleOpenSlider = (index : number) => {
     setInitialSlide(index);
     setSliderIsOpen(true);
  }

  const handleCloseSlider = () => setSliderIsOpen(false);

  const profileMediaListClassName = () => {
     if (isLoading) return [cl.profileMediaList, cl.loading].join(' ');
     else {
        if (profileMedia && profileMedia.length > 0) return cl.profileMediaList;
        else return [cl.profileMediaList, cl.noMedia].join(' ');
     }
  }

  return (
    <div className={profileMediaListClassName()}>
    {
        isLoading ? [...new Array(8)].map((_, i) => <m.div key={i}
        animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
        transition={{ease: 'linear', duration: 1, repeat: Infinity}} 
        className={cl.profileMediaListSkeleton} 
        />)
        : isError ? <ErrorHandler />
        : profileMedia && profileMedia.length ?
        <AnimatePresence>
            {
                profileMedia.map((media, i) => <div 
                className={cl.profileMediaListItem}
                onClick={() => handleOpenSlider(i)} 
                key={media.id}>
                {getProfileMediaItemContent(media)}
                </div>)
            }
        </AnimatePresence>
        : <NoItems type="media" label='У вас нет общих медиафайлов'/>
    }
    <AnimatePresence>
        {
            sliderIsOpen && profileMedia && profileMedia.length &&  <Modal closeModal={handleCloseSlider}>
             <LazyComponent loader={<DotsLoader />}>
             <MediaSlider 
              media={profileMedia}
              initialSlide={initialSlide}
              onClose={handleCloseSlider}
             />
             </LazyComponent>
            </Modal>
        }
    </AnimatePresence>
    </div>
  )
}

export default memo(ProfileMediaList);