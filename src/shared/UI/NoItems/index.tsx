import { FC } from 'react';
import { m } from 'framer-motion';
import { ReactComponent as Notification } from '../../../assets/images/notification.svg';
import { ReactComponent as Contact } from '../../../assets/images/contact.svg';
import { ReactComponent as Dialog } from '../../../assets/images/dialog.svg';
import { ReactComponent as Media } from '../../../assets/images/media.svg';
import { ReactComponent as Documents } from '../../../assets/images/documents.svg';
import { ReactComponent as Voices } from '../../../assets/images/voices.svg';
import cl from './NoItems.module.scss';

interface INoItemsProps {
    type: 'media' | 'documents' | 'voices' | 'dialogs' | 'contacts' | 'notifications';
    label: string;
}

const getNoItemsIcon = (type: INoItemsProps['type']) => {
   switch (type) {
    case 'notifications':
        return <Notification />
    case 'contacts':
        return <Contact />
    case 'dialogs':
        return <Dialog />
    case 'documents':
        return <Documents />
    case 'media':
        return <Media />
    case 'voices':
        return <Voices />
   }
}

const NoItems : FC<INoItemsProps> = ({type, label}) => {
  return (
    <m.div
    initial={{opacity: 0}}
    animate={{opacity: 1}}
    exit={{opacity: 0}} 
    className={cl.noItemsContainer}>
    {getNoItemsIcon(type)}
    <span className={cl.noItemsLabel}>{label}</span>
    </m.div>
  )
}

export default NoItems