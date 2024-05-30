import { useGetBlackListQuery } from '../../api/userApi';
import { AnimatePresence, m } from 'framer-motion';
import socket from '../../api/socketApi';
import { BlackList } from '../../types/User';
import { ErrorHandler } from '../../shared/UI';
import { MEDIA_URL } from '../../shared/constants';
import cl from './SettingsBlackList.module.scss';



const SettingsBlackList = () => {

  const { data : blacklist, isLoading, isError } = useGetBlackListQuery();
  
  const blackListClassName = !isLoading && blacklist && blacklist.length === 0 || isError 
   ? [cl.blacklist, cl.empty]
   : [cl.blacklist];

  const handleRemoveBlackList = (blacklist : BlackList) => {
    socket.emit('removeBlackList', blacklist);
  }
  
  
  return (
    <m.section className={blackListClassName.join(' ')}>
      {
        isLoading
        ? [...new Array(8)].map((_, i) => <div key={i} className={cl.blacklistItemSkeleton}>
          <m.div className={cl.blacklistItemSkeletonImage} />
          <m.span className={cl.blacklistItemSkeletonName} />
        </div>)
        : isError 
        ? <ErrorHandler />
        : blacklist && blacklist.length > 0
        ? <AnimatePresence mode="popLayout" initial={false}>
          {
            blacklist.map(item => <m.article key={item.id} layout
            initial={{opacity: 0, y: 10}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: 10}}
            className={cl.blacklistItem}
            >
           <div className={cl.blacklistItemImage}>
            <img src={`${MEDIA_URL}/${item.banned?.avatar_img}`} />
            </div>
           <span className={cl.blacklistItemName}>{item.banned?.name} {item.banned?.surname}</span>
           <button title="Убрать из списка"
           aria-label="Убрать из списка"
           onClick={() => handleRemoveBlackList(item)}
           className={cl.removeToBlackListButton}
           >
           Убрать из списка
           </button> 
          </m.article>)
          }
        </AnimatePresence>
        : <h1>Черный список пуст</h1>
      }
    </m.section>
  )
}

export default SettingsBlackList