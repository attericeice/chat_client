import { FC, MouseEvent } from 'react';
import type { MessageAttachment } from '../../types/Message';
import { FaRegFileLines } from 'react-icons/fa6';
import LazyImage from '../../shared/UI/LazyImage';
import { MEDIA_URL } from '../../shared/constants';
import cl from './AttachmentItem.module.scss';



interface IAttachmentItemProps {
    attachment : MessageAttachment;
    isMultiple?: boolean;
    handleMediaClick?: () => void;
    width?: string;
}

const getAttachmentContent = (attachment : MessageAttachment) => {
    switch (attachment.type) {
        case 'image':
            return <LazyImage blurhash={attachment.blurhash} src={`${MEDIA_URL}/${attachment.attachSrc}`} />
        case 'video':
            return (
                <video preload="metadata">
                 <source src={`${MEDIA_URL}/${attachment.attachSrc}`} />
                </video>
            )
        case 'document':
            return <div onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()} className={cl.attachmentItemDocument}>
                <span className={cl.attachmentItemDocumentIcon}><FaRegFileLines /></span>
                <a href={`${MEDIA_URL}/${attachment.attachSrc}`} download>
                    {attachment.attachSrc}
                </a>
            </div>
    }
}


const AttachmentItem : FC<IAttachmentItemProps> = ({attachment, isMultiple, handleMediaClick, width}) => {

const attachmentClassName = isMultiple ? [cl.attachmentItem, cl.multiple] : [cl.attachmentItem];

 const handleAttachmentClick = (e: MouseEvent<HTMLDivElement>) => {
    if (handleMediaClick) {
        e.stopPropagation();
        handleMediaClick();
    }
    return;
 }

  return (
    <div onClick={handleAttachmentClick} style={width ? {width} : {}} className={attachmentClassName.join(' ')}>
      {getAttachmentContent(attachment)}
    </div>
  )
}

export default AttachmentItem;