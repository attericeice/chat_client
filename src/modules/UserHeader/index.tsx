import { useState, useCallback, lazy, Dispatch, SetStateAction } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { useTypedSelector } from '../../hooks/useTypedStore';
import { useGetNotificationCountQuery } from '../../api/notificationApi';
import { useLogoutMutation } from '../../api/userApi';
import { IUser } from "../../types/User";
import { AnimatePresence } from "framer-motion";
import { Modal, LazyComponent, DotsLoader } from '../../shared/UI';
import DesktopHeader from "../../components/DesktopHeader";
import MobileHeader from "../../components/MobileHeader";
const Notifications = lazy(() => import('../../modules/Notifications'));
const Contacts = lazy(() => import('../../modules/Contacts'));

type UserHeaderModalPage = 'contacts' | 'notifications';

const getModalContent = (closeHandler : () => void, page : UserHeaderModalPage) => {
  switch (page) {
    case 'contacts':
      return <LazyComponent loader={<DotsLoader />}><Contacts closeHandler={closeHandler}/></LazyComponent>
    case 'notifications':
      return <LazyComponent loader={<DotsLoader />}><Notifications closeHandler={closeHandler}/></LazyComponent>
  }
}

export interface IHeaderProps {
  userMenuOpen: boolean;
  setUserMenuOpen: Dispatch<SetStateAction<boolean>>;
  setPage: Dispatch<SetStateAction<UserHeaderModalPage>>;
  setModalPageOpen: Dispatch<SetStateAction<boolean>>;
  user: IUser;
  userLoading: boolean;
  notifications: number | undefined;
  logout: () => void;
}

const UserHeader = () => {

  const isMobileViewport = useBreakpoint(1200);

  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
 
  const [page, setPage] = useState<UserHeaderModalPage>('contacts');

  const [modalPageOpen, setModalPageOpen] = useState<boolean>(false);

  const { user, isLoading : userLoading } = useTypedSelector(state => state.userReducer);

  const { data: count } = useGetNotificationCountQuery(user.id, {skip: user.id === ''}); 

  const [logout] = useLogoutMutation();

  const closeModalHandler = useCallback(() => setModalPageOpen(false), []);

  return (
    <>
    {
      isMobileViewport 
      ? <MobileHeader 
         setPage={setPage}
         userMenuOpen={userMenuOpen}
         setUserMenuOpen={setUserMenuOpen}
         setModalPageOpen={setModalPageOpen}
         user={user}
         userLoading={userLoading}
         notifications={count}
         logout={logout}
        />
      : <DesktopHeader 
         setPage={setPage}
         userMenuOpen={userMenuOpen}
         setUserMenuOpen={setUserMenuOpen}
         setModalPageOpen={setModalPageOpen}
         user={user}
         userLoading={userLoading}
         notifications={count}
         logout={logout}
         />
    }
    {
       <AnimatePresence>
       {
         modalPageOpen && <Modal closeModal={closeModalHandler}>
           {getModalContent(closeModalHandler, page)}
         </Modal>
       }
     </AnimatePresence>
    }
    </>
  )
}

export default UserHeader;

