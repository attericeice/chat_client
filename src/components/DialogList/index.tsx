import { useState, useEffect, FC } from 'react';
import socket from '../../api/socketApi';
import { IUser } from '../../types/User';
import { IDialog } from '../../types/Dialog';
import { AnimatePresence } from 'framer-motion';
import DialogItem from '../DialogItem';
import cl from './DialogList.module.scss';


interface IDialogListProps {
  dialogs: IDialog[];
  closeMenu: () => void;
}

export interface ITypingUsersDialog {
  id: IUser['id'];
  name: IUser['name'];
  dialogId: IDialog['id'];
}

const getDialogTypingUsers = (typingUsers : ITypingUsersDialog[], dialogId : IDialog['id']) => {
   return typingUsers.filter(typingUser => Number(typingUser.dialogId) === dialogId);
}

const DialogList : FC<IDialogListProps> = ({ dialogs, closeMenu }) => {

 const [typingUsers, setTypingUsers] = useState<ITypingUsersDialog[]>([]);

 console.log(typingUsers);

 useEffect(() => {
   socket.on('startTypingDialogList', (typingUser : ITypingUsersDialog) => {
       setTypingUsers(prev => [...prev, typingUser]);
   });
    socket.on('endTypingDialogList', (typingUser: ITypingUsersDialog) => {
      setTypingUsers(prev => prev.filter(user => user.dialogId != typingUser.dialogId));
    });
    return () => {
      socket.off('startTypingDialogList');
      socket.off('endTypingDialogList');
    }
 }, []);

 return (
    <section className={cl.dialogContainer}>
    <AnimatePresence mode="popLayout">
      {
         dialogs.map(dialog => <DialogItem 
          closeMenu={closeMenu} 
          key={dialog.id} 
          dialog={dialog}
          typingUsers={getDialogTypingUsers(typingUsers, dialog.id)}
          />)
      }
    </AnimatePresence>
    </section>
  )
}

export default DialogList