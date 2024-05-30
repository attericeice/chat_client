import { useState, useRef, ChangeEvent, lazy } from 'react';
import { useGetSelfMediaQuery, useAddMediaMutation, useRemoveMediaMutation } from '../../api/userApi';
import { useTypedSelector } from '../../hooks/useTypedStore';
import { UserMedia } from '../../types/User';
import { FaPlus } from 'react-icons/fa6';
import { AnimatePresence, m } from 'framer-motion';
import { LazyImage, LazyComponent, Modal, DotsLoader } from '../../shared/UI';
import { Helmet } from 'react-helmet-async';
import { MEDIA_URL } from '../../shared/constants';
import cl from './SettingsMedia.module.scss';
const SettingsImageEdit = lazy(() => import('../SettingsImageEdit'));
const MediaSlider = lazy(() => import('../MediaSlider'));



const getMediaContent = (media : UserMedia) => {
  switch (media.type) {
    case 'image':
      return <LazyImage blurhash={media.blurhash} src={`${MEDIA_URL}/${media.src}`} />
    case 'video':
      return <video preload="metadata">
        <source src={`${MEDIA_URL}/${media.src}`} />
      </video>
  }
} 

const SettingsMedia = () => {
  
  const { user } = useTypedSelector(state => state.userReducer);

  const { data : media, isLoading, isError} = useGetSelfMediaQuery();

  const [removeMedia, {isLoading : removing, error: removeError, isSuccess: removeSuccess}] = useRemoveMediaMutation();

  const [addMedia, {isLoading: addMediaLoading, isError: addError, isSuccess: addSuccess}] = useAddMediaMutation();

  const [selectedMedia, setSelectedMedia] = useState('');

  const [editCompleted, setEditCompleted] = useState(false);

  const [initialSlide, setInitialSlide] = useState(0);

  const [mediaSliderVisible, setMediaSliderVisible] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectMedia = (e : ChangeEvent<HTMLInputElement>) => {
    
     if (e.target.files && e.target.files.length) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type.startsWith('video')) {
        const mediaFormData = new FormData();
        mediaFormData.append('media', selectedFile);
        mediaFormData.append('type', 'video');
        mediaFormData.append('userId', user.id.toString());
        addMedia(mediaFormData);
      }
      else {
        const reader = new FileReader()
        reader.addEventListener('load', () => {
        setSelectedMedia(reader.result?.toString() || '');
        });
        reader.readAsDataURL(selectedFile);
      }
     }
     e.target.files = null;
     e.target.value = '';
  }

  const handleOpenMediaSlider = (index : number) => {
    setInitialSlide(index);
    setMediaSliderVisible(true);
  }

  const handleRemoveMedia = (id : number, src: string) => {
    removeMedia({userId: Number(user.id), id, src});
  }

  const handleCloseImageEdit = () => {
    setSelectedMedia('');
    setEditCompleted(false);
  }

  const handleAddEditedImage = (image : Blob) => {
    const formData = new FormData();
    formData.append('media', image);
    formData.append('type', 'image');
    formData.append('userId', user.id.toString());
    addMedia(formData);
    handleCloseImageEdit();
  }

  const handleSelectFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  return (
    <m.section
    initial={{opacity: 0}}
    animate={{opacity: 1}}
    exit={{opacity: 0}}
    transition={{duration: 0.4}} 
    className={cl.settingsMedia}>
    <Helmet>
    <title>Медиафайлы пользователя {`${user.name} ${user.surname}`}</title>
    <meta property='og:type' content='media' />
    <meta property='og:description' content={`Медиафайлы пользователя ${user.name} ${user.surname}`} />
    </Helmet>
    <div className={cl.settingsMediaButtons}>
    <button onClick={handleSelectFileClick} className={cl.addNewMedia}><FaPlus /> Добавить</button>
    <input onChange={handleSelectMedia} ref={fileInputRef} type='file' accept='' />
    </div>
    <div className={cl.settingsMediaList}>
    <AnimatePresence initial={false} mode="popLayout">
    {
      !isLoading && media && media.length && media.map((item, i) => {
        return (
          <m.article key={item.id} onClick={() => handleOpenMediaSlider(i)} className={cl.mediaItem}>
          {getMediaContent(item)}
          </m.article>
        )
      })
    }l
    </AnimatePresence>
    </div>
    <AnimatePresence>
      {
        mediaSliderVisible && media && <Modal closeModal={() => setMediaSliderVisible(false)}>
       <LazyComponent loader={<DotsLoader />}>
       <MediaSlider 
        initialSlide={initialSlide}
        media={media}
        removeMedia={handleRemoveMedia}
        fetchError={removeError}
        fetchLoading={removing}
        fetchSuccess={removeSuccess}
        onClose={() => setMediaSliderVisible(false)}
        />
       </LazyComponent>
        </Modal>
      }
    </AnimatePresence>
    <AnimatePresence>
      {
        selectedMedia !== '' && <Modal closeModal={handleCloseImageEdit}>
        <LazyComponent loader={<DotsLoader />}>
        <SettingsImageEdit 
        image={selectedMedia}
        editCompleted={editCompleted}
        handleEditCompleted={() => setEditCompleted(true)}
        cancelImageEdit={handleCloseImageEdit}
        onSelectImage={handleAddEditedImage}
        isError={addError}
        isLoading={addMediaLoading}
        />
        </LazyComponent>
        </Modal>
      }
    </AnimatePresence>
    </m.section>
  )
}

export default SettingsMedia