import { FC } from 'react';
import { FaXmark, FaRegImage, FaRegFileLines, FaRegFileVideo, FaRegFileAudio } from "react-icons/fa6";
import { IoTrashBinOutline } from "react-icons/io5";
import { AnimatePresence, m } from 'framer-motion';
import cl from './AttachmentEditMenu.module.scss';

interface IAttachmentEditMenuProps {
    attachments: File[];
    onDeleteAttachment: (filename: string) => void;
    handleCloseMenu: () => void;
    ariaHidden: boolean;
    ariaLabel: string;
}

const SIZES = ['B', 'Kb', 'Mb', 'Gb'];

const getFileIcon = (type: string) => {
    if (type.startsWith('image')) return <FaRegImage />
    if (type.startsWith('video')) return <FaRegFileVideo />
    if (type.startsWith('audio')) return <FaRegFileAudio />
    return <FaRegFileLines />
}

const getFileSizeFormat = (size: File['size']) => {
   if (size === 0) return '0 B';
   const i = Math.floor(Math.log(size) / Math.log(1024));
   return `${(size / Math.pow(1024, i)).toFixed(2)} ${SIZES[i]}`;
}

const showFileContent = (file : File) => {
    const url = URL.createObjectURL(file);
    window.open(url);
}

const AttachmentEditMenu : FC<IAttachmentEditMenuProps> = ({attachments, onDeleteAttachment, ariaHidden, ariaLabel, handleCloseMenu}) => {
return (
    <m.div
    initial={{opacity: 0, y: -30}}
    animate={{opacity: 1, y: 0, transition: {when: 'beforeChildren'}}}
    exit={{y: -30, opacity: 0}}
    aria-hidden={ariaHidden} 
    aria-label={ariaLabel} 
    className={cl.AttachmentEditMenu}>
    <button aria-hidden={ariaHidden} 
    aria-label='Закрыть окно просмотра вложений'
    onClick={handleCloseMenu}
    className={cl.exitAttachmentMenuButton}>
      <FaXmark />
      </button>
    <h2>Вложения</h2>
    <m.div 
    transition={{staggerChildren: 0.5}}
    className={cl.attachmentsList}>
    <AnimatePresence mode="popLayout">
     {
      attachments.map(file => <m.div
      initial={{opacity: 0}}
      animate={{opacity: 1, transition: {delay: 0.3}}}
      exit={{opacity: 0, x: -10}}
      layout
      key={file.name} className={cl.attachmentsListItem}>
       <span className={cl.attachmentsListItemIcon}>{getFileIcon(file.type)}</span>
       <div className={cl.attachmentsListItemInfo}>
        <span onClick={() => showFileContent(file)} className={cl.filename}>{file.name}</span>
        <span className={cl.fileSize}>{getFileSizeFormat(file.size)}</span>
       </div>
       <button onClick={() => onDeleteAttachment(file.name)} className={cl.attachmentRemoveButton}>
        <IoTrashBinOutline />
        </button>
      </m.div>)
     }
     </AnimatePresence>
    </m.div>
  </m.div>
)
    }   
  


export default AttachmentEditMenu;