import { ReactNode, FC, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { m } from 'framer-motion';
import cl from './Modal.module.scss';

interface IModalProps {
    children: ReactNode;
    closeModal: () => void;
}

const portal = document.getElementById('modal') as HTMLElement;

const Modal : FC<IModalProps> = ({children, closeModal}) => {
   
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
    document.body.style.overflow = 'hidden';
    if (!modalRef.current) return;
    const modalElem = modalRef.current;
    const handleClickOutsideChildren = (e: MouseEvent) => {
    if (modalElem === e.target) {
        closeModal();
    }
    }
    modalElem.addEventListener('click', handleClickOutsideChildren);
    return () => {
        document.body.style.overflow = "unset";
        if (modalElem) {
            modalElem.removeEventListener('click', handleClickOutsideChildren);
        }
    }
    }, [modalRef, closeModal]);

   return createPortal(<m.div
   initial={{opacity: 0}}
   animate={{opacity: 1}}
   exit={{opacity: 0}} 
   ref={modalRef} className={cl.modal}>
    {children}
   </m.div>, portal)
}

export default Modal