import { useState, useEffect, ChangeEvent } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useGetDialogsQuery } from '../../api/dialogApi';
import { useTypedSelector } from '../../hooks/useTypedStore';
import { m } from 'framer-motion';
import { FaChevronCircleRight } from 'react-icons/fa';
import DialogList from "../../components/DialogList";
import DialogSearchInput from "../../components/DialogSearchInput";
import { ErrorHandler, NoItems } from '../../shared/UI';
import cl from './Dialogs.module.scss';



const Dialogs = () => {

  const { user } = useTypedSelector(state => state.userReducer);

  const [search, setSearch] = useState<string>('');

  const [isSearching, setIsSearching] = useState<boolean>(false);

  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const [widgetIsVisible, setWidgetIsVisible] = useState<boolean>(false);

  const [widgetIsActive, setWidgetIsActive] = useState<boolean>(false);

  const {data: dialogs, isLoading, isError} = useGetDialogsQuery({
    userId: user.id,
    search,
    link: user.link
  }, {skip: user.id === ''});

  const isSmallViewport = useBreakpoint(1179);

  const handleSearch = ( e : ChangeEvent<HTMLInputElement> ) => {
    if (!isSearching) setIsSearching(() => true);
    setSearch(() => e.target.value)
  }

  const cancelSearch = () => setSearch(() => '');

  const dialogMenuClassName = !menuOpen ? [cl.userDialogs] : [cl.userDialogs, cl.active];

  const widgetClassName = !widgetIsActive ? [cl.widget] : [cl.widget, cl.active];

  useEffect(() => {
   if (!search && isSearching) setIsSearching(() => false); 
  }, [search, isSearching]);

  useEffect(() => {
   if (!isSmallViewport) return;
   let startTouchX : number;
   let endTouchX : number;
   function onTouchStart(e : TouchEvent) {
    startTouchX = e.changedTouches[0].pageX;
   }
   function onTouchEnd(e: TouchEvent) {
    endTouchX = e.changedTouches[0].pageX;
    if (startTouchX <= 100 && endTouchX - startTouchX >= 50) setMenuOpen(true);
    if (endTouchX < startTouchX) setMenuOpen(false);
    setWidgetIsActive(false);
    setWidgetIsVisible(false);
   }
   function onTouchMove(e: TouchEvent) {
     if (startTouchX <= 100 && !widgetIsVisible && !menuOpen) setWidgetIsVisible(true);
     if (startTouchX <= 100 && e.changedTouches[0].pageX - startTouchX >= 50 && !widgetIsActive) {
      setWidgetIsActive(true);
     }
   }
   window.addEventListener('touchstart', onTouchStart);
   window.addEventListener('touchmove', onTouchMove);
   window.addEventListener('touchend', onTouchEnd);
   return () => {
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
   }
  }, [isSmallViewport]);

  const dialogsContainerClassName = isLoading || (dialogs && dialogs.length) ? [cl.dialogsContainer] : [cl.dialogsContainer, cl.noDialogs];

  return (
    <m.div
    className={!isSmallViewport ? cl.userDialogs : dialogMenuClassName.join(' ')}>
    <DialogSearchInput search={search} handleSearch={handleSearch} isSearching={isSearching} cancelSearch={cancelSearch} />
    <div className={dialogsContainerClassName.join(' ')}>
    {
         isLoading ? <div className={cl.dialogsLoading}>
           {[...new Array(8)].map((_, i) => <div key={i} className={cl.dialogItemSkeleton}>
          <m.div
          animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
          transition={{ease: 'linear', duration: 3, repeat: Infinity}} 
          className={cl.dialogItemImageSkeleton} />
          <div className={cl.dialogItemInfoSkeleton}>
          <m.span
          animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
          transition={{ease: 'linear', duration: 3, repeat: Infinity}} 
          className={cl.dialogItemInfoSkeletonRow} />
          <m.span
          animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
          transition={{ease: 'linear', duration: 3, repeat: Infinity}}
          className={cl.dialogItemInfoSkeletonRow} />
          </div>
         </div>)}
         </div>
         : isError ? <ErrorHandler key="error" />
         : dialogs && dialogs.length ? 
         <DialogList closeMenu={() => setMenuOpen(false)} dialogs={dialogs} />
         : <NoItems type='dialogs' label='Ничего не найдено' />
     }
    </div>
    {isSmallViewport && widgetIsVisible && <span className={widgetClassName.join(' ')}><FaChevronCircleRight /></span>}
    </m.div> 
  )
}

export default Dialogs;