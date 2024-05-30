import { FC, useState, lazy, memo } from 'react';
import { useAddAttachmentMediaMutation } from '../../api/userApi';
import { useTypedSelector } from '../../hooks/useTypedStore';
import type { MessageAttachment } from '../../types/Message';
import { UserMedia } from '../../types/User';
import AttachmentItem from '../AttachmentItem';
import Modal from '../../shared/UI/Modal';
import { AnimatePresence } from 'framer-motion';
import LazyComponent from '../../shared/UI/LazyComponent';
import cl from './AttachmentList.module.scss';
import DotsLoader from '../../shared/UI/DotsLoader';
const MediaSlider = lazy(() => import('../MediaSlider'));

interface IAttachmentListProps {
    attachments: MessageAttachment[];
}

const AttachmentList : FC<IAttachmentListProps> = ({attachments}) => {

  const { user } = useTypedSelector(state => state.userReducer);

  const [mediaSliderVisible, setMediaSliderVisible] = useState(false);

  const [initialSlide, setInitialSlide] = useState(0);

  const [addAttachmentMedia, {isLoading, isSuccess, error}] = useAddAttachmentMediaMutation();

  const images = attachments.filter(file => file.type === 'image');

  const videos = attachments.filter(file => file.type === 'video');

  const documents = attachments.filter(file => file.type === 'document');

  const imagesClassList = images.length > 1 ? [cl.attachmentsListImages, cl.multiple] : [cl.attachmentsListImages]; 

  const handleAttachmentClick = (type: MessageAttachment['type'], index: number) => {
     const initialSliderIndex = type === 'image' ? index : images.length + index;
     setInitialSlide(initialSliderIndex);
     setMediaSliderVisible(true);
  }

  const onAddMedia = (media: MessageAttachment | UserMedia) => {
      const src = 'src' in media ? media.src : media.attachSrc;
      const type = media.type;
      const userId = Number(user.id);
      const newMedia = {
        src, 
        type: type as UserMedia['type'], 
        userId, 
        isGenerated: false, 
        isAvatar: false, 
        blurhash: media.blurhash
    };
      addAttachmentMedia(newMedia);
  };

  const getImageAttachmentWidth = (i : number) => {
    const row = 3;
    if (images.length <= row) {
        return `${100 / images.length}%`;
    }
    const currentRow = Math.ceil((i + 1) / row);
    if (images.length < currentRow * row) {
       const diff = (currentRow * row) - images.length;
       return `${100 / (row - diff)}%`;
    }
    else {
        return `${100 / 3}%`;
    }
  }
  
  return (
    <div className={cl.attachmentsList}>
        {
           images.length > 0 && <div className={imagesClassList.join(' ')}>
            {images.map((image, i) => <AttachmentItem 
            key={image.id} 
            attachment={image}
            handleMediaClick={() => handleAttachmentClick(image.type, i)}
            isMultiple={imagesClassList.length > 1}
            width={getImageAttachmentWidth(i)} 
            />)}
           </div>
        }
        {
            videos.length > 0 && <div className={cl.attachmentsListVideos}>
                {videos.map((video, i) => <AttachmentItem 
                key={video.id} 
                attachment={video} 
                handleMediaClick={() => handleAttachmentClick(video.type, i)}
                />)}
            </div>
        }
        {
            documents.length > 0 && <div className={cl.attachmentsListDocuments}>
                {documents.map(document => <AttachmentItem key={document.id} attachment={document} />)}
            </div>
        }
     <AnimatePresence>
        {mediaSliderVisible && <Modal closeModal={() => setMediaSliderVisible(false)}>
        <LazyComponent loader={<DotsLoader />}>
        <MediaSlider 
        media={images.concat(videos)} 
        onAddMedia={onAddMedia}
        initialSlide={initialSlide}
        fetchLoading={isLoading}
        fetchError={error}
        fetchSuccess={isSuccess}
        onClose={() => setMediaSliderVisible(false)}
        />
        </LazyComponent>
        </Modal>}
     </AnimatePresence>
    </div>
  )
}

export default memo(AttachmentList);