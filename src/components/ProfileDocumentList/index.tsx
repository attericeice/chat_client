import { memo } from 'react';
import { FaRegFileLines } from "react-icons/fa6";
import { useParams } from "react-router-dom";
import { useGetProfileDialogDocumentsQuery } from "../../api/userApi";
import { AnimatePresence, m } from "framer-motion";
import { ErrorHandler, NoItems } from '../../shared/UI';
import { MEDIA_URL } from '../../shared/constants';
import cl from './ProfileDocumentsList.module.scss';



const ProfileDialogDocuments = () => {
  
  const { link } = useParams();

  const { data : profileDocuments, isLoading, isError } = useGetProfileDialogDocumentsQuery(link || '', {skip: link === undefined});

  const documentListClassList = !isLoading && !profileDocuments?.length 
  ? [cl.profileDocumentsList, cl.noDocuments] 
  : [cl.profileDocumentsList];

  return (
    <div className={documentListClassList.join(' ')}>
    {
      isLoading ? [...new Array(5)].map((_, i) => <div key={i} className={cl.documentItemSkeleton}>
      <m.div animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
      transition={{ease: 'linear', duration: 1, repeat: Infinity}} className={cl.documentItemSkeletonLabel} />
      <m.span animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
      transition={{ease: 'linear', duration: 1, repeat: Infinity}} className={cl.documentItemSkeletonName} />
      </div>)
      : isError ? <ErrorHandler />
      : profileDocuments && profileDocuments.length ?
      <AnimatePresence>
       {
        profileDocuments.map(document => <div key={document.id} className={cl.documentItem}>
            <div className={cl.documentItemLabel}><FaRegFileLines /></div>
            <a 
            href={`${MEDIA_URL}/${document.attachSrc}`} 
            download
            rel='noopener noreferrer'
            target="_blank">
            {document.attachSrc}
            </a>
        </div>)
       }
      </AnimatePresence>
      : <NoItems type="documents" label='У вас нет общих документов' />
    }
    </div>
  )
}

export default memo(ProfileDialogDocuments);