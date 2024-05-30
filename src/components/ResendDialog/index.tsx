import { FC, useState, useEffect, ChangeEvent } from 'react';
import { useGetDialogsQuery } from '../../api/dialogApi';
import { useTypedSelector } from '../../hooks/useTypedStore';
import { FaXmark } from 'react-icons/fa6';
import DialogSearchInput from '../DialogSearchInput';
import { ToastContainer, toast } from 'react-toastify';
import { m } from 'framer-motion';
import { MEDIA_URL } from '../../shared/constants';
import 'react-toastify/dist/ReactToastify.css';
import cl from './ResendDialog.module.scss';


interface IResendDialogProps {
    handleCloseMenu: () => void;
    onResend: (dialogId: number) => void;
}

const showNotify = (message : string) => {
    toast.success(message, {
    position: 'top-center',
    hideProgressBar: true,
    pauseOnHover: true,
    closeOnClick: true,
    autoClose: 2000,
    draggable: true,
    theme: 'dark',
    type: "warning"
    })
}

const ResendDialog : FC<IResendDialogProps> = ({handleCloseMenu, onResend}) => {
 
 const { link, id } = useTypedSelector(state => state.userReducer.user);

 const [search, setSearch] = useState('');

 const [isSearching, setIsSearching] = useState<boolean>(false);
  
 const { data : dialogs } = useGetDialogsQuery({userId: id, search, link});

 const handleSearch = ( e : ChangeEvent<HTMLInputElement> ) => {
   if (!isSearching) setIsSearching(() => true);
   setSearch(() => e.target.value)
 }

 const cancelSearch = () => setSearch(() => '');

 const handleResend = (dialogId : number) => {
    if (dialogs) {
      const currentDialog = dialogs.find(d => d.id === dialogId);
      if (currentDialog) {
        const { blacklist_banned, blacklist_sender } = currentDialog.users_in_dialogs[0].user;
        if (blacklist_banned.length > 0) {
            showNotify('Вы добавили этого пользователя в черный список');
            return;
        } 
        if (blacklist_sender.length > 0) {
            showNotify('Этот пользователь добавил вас в черный список');
            return;
        }
      }
      onResend(dialogId);
    }
 }

 useEffect(() => {
  if (!search && isSearching) setIsSearching(() => false); 
 }, [search]);

 
 return (
 <>
    <ToastContainer />
    <m.div className={cl.ResendDialogModalMenu}>
    <button onClick={handleCloseMenu} className={cl.closeResendDialogModal}><FaXmark /></button>
    <h2 className={cl.title}>Переслать...</h2>
     <DialogSearchInput search={search} handleSearch={handleSearch} cancelSearch={cancelSearch} isSearching={isSearching} />
     <div className={cl.dialogList}>
        {
            dialogs && dialogs.length > 0 && dialogs.map(dialog => 
            <div onClick={() => handleResend(dialog.id)} key={`resend/${dialog.id}`} className={cl.resendDialogItem}>
                <div className={cl.dialogImage}>
                    <img src={`${MEDIA_URL}/${dialog.users_in_dialogs[0].user.avatar_img}`} />
                </div>
                <span className={cl.dialogName}>
                    {dialog.users_in_dialogs[0].user.name} {dialog.users_in_dialogs[0].user.surname}
                </span>
            </div>)
        }
     </div>
    </m.div>
 </>
 )
}

export default ResendDialog;