import { useState, useRef, useEffect, FC, SyntheticEvent } from 'react';
import { useDebaunce } from '../../hooks/useDebaunce';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import { canvasPreview } from '../../shared/helpres/canvasPreview';
import { m } from 'framer-motion';
import { FaXmark } from 'react-icons/fa6';
import { CircleLoader } from '../../shared/UI';
import 'react-image-crop/dist/ReactCrop.css';
import cl from './SettingsAvatarEdit.module.scss';

interface ISettingsImageEdit {
  image: string;
  onSelectImage: (cropImage : Blob) => void;
  editCompleted: boolean;
  handleEditCompleted: () => void;
  cancelImageEdit: () => void;
  isLoading: boolean;
  isError: boolean;
}

const SettingsImageEdit : FC<ISettingsImageEdit> = ({
  image, 
  onSelectImage, 
  editCompleted, 
  handleEditCompleted, 
  cancelImageEdit,
  isLoading,
  isError
}) => {

  const [crop, setCrop] = useState<Crop>();

  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  const [width, setWidth] = useState<number>(0);

  const [height, setHeight] = useState<number>(0);

  const imgRef = useRef<HTMLImageElement>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isSmallViewport = useBreakpoint(601);

  const onImageLoad = (e : SyntheticEvent<HTMLImageElement>) => {
     setWidth(e.currentTarget.width);
     setHeight(e.currentTarget.height);
     setCompletedCrop({x: 0, y: 0, height: e.currentTarget.height, width: e.currentTarget.width, unit: 'px'});
  } 

  const debauncedCanvasPreview = useDebaunce(() => {
   if (completedCrop?.height && completedCrop.width && imgRef.current && canvasRef.current) {
     canvasPreview(imgRef.current, canvasRef.current, completedCrop);
   }
  }, 100);
   
  const getCropBuffer = async () => {
    const image = imgRef.current;
    const previewCanvas = canvasRef.current;
    if (!image || !previewCanvas || !completedCrop) {
      throw new Error('Crop canvas does not exist');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const offscreen = new OffscreenCanvas(
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
    );
    const ctx = offscreen.getContext('2d')
    if (!ctx) {
      throw new Error('No 2d context')
    }
    ctx.drawImage(
      previewCanvas,
      0,
      0,
      previewCanvas.width,
      previewCanvas.height,
      0,
      0,
      offscreen.width,
      offscreen.height,
    );
    const blob = await offscreen.convertToBlob({
      type: 'image/jpeg',
    });
    onSelectImage(blob);
  }

  const handleUpdateImage = () => handleEditCompleted();

  useEffect(() => {
   if (completedCrop && imgRef.current && canvasRef.current) {
    debauncedCanvasPreview();
   }
  }, [completedCrop, imgRef, canvasRef]);
 
  useEffect(() => {
    if (editCompleted) {
      getCropBuffer();
    }
  }, [editCompleted]);
  
  return (
    <m.div
    key="avatarEdit"
    initial={{opacity: 0}}
    animate={{opacity: 1}}
    exit={{opacity: 0}} 
    className={cl.avatarEdit}>
    <div className={cl.avatarEditHeader}>
    <h2 className={cl.avatarEditTitle}>Редактирование изображения</h2>
    <button onClick={cancelImageEdit} className={cl.closeImageEditButton}><FaXmark /></button>
    </div>
    <div className={cl.avatarEditImages}>
    <ReactCrop
    crop={crop}
    style={{
    margin: 0, 
    maxWidth: isSmallViewport ? '100%' : 'calc(100% - 150px)', 
    maxHeight: isSmallViewport ? 'auto' : 'calc(80vh - 150px)'
  }}
    onChange={c => setCrop(c)}
    onComplete={e => {
     if (!e.height || !e.width) {
      setCompletedCrop({x: 0, y: 0, width, height, unit: 'px'});
     }
     else {
      setCompletedCrop(e);
     }
    }}
    >
    <img ref={imgRef} style={{
      objectFit: 'cover',
      objectPosition: 'center',
      maxWidth: '100%',
      maxHeight: '100%',
      borderRadius: '6px'
    }} 
      src={image}
      alt={`edited image`} 
      onLoad={onImageLoad} 
      />
    </ReactCrop>
    <canvas ref={canvasRef}></canvas>
    </div>
    <div className={cl.avatarEditButtons}>
    <button disabled={isLoading} onClick={handleUpdateImage} className={cl.updateImage}>
    Загрузить
    {isLoading && <CircleLoader size={16} />}
    </button>
    <button onClick={cancelImageEdit} className={cl.cancelUpdateImage}>Отмена</button>
    </div>
    </m.div>
  )
}

export default SettingsImageEdit