import { useTypedSelector } from "../hooks/useTypedStore";
import { useEffect, lazy } from "react";
import { useLogoutMutation, useLazyRefreshQuery } from "../api/userApi";
import socket from "../api/socketApi";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import LazyComponent from "../shared/UI/LazyComponent";
const UserHeader = lazy(() => import('../modules/UserHeader'));

const AuthLayot = () => {

   const location = useLocation();

   const redirect = useNavigate();

   const { user } = useTypedSelector(state => state.userReducer);

   const [logout] = useLogoutMutation();

   const [refresh, {}] = useLazyRefreshQuery();

  useEffect(() => {
   socket.connect();
   socket.on('unauthorized', () => {
      refresh();
   });
   return () => {
    socket.off('unauthorized');
    socket.disconnect();
   }
  }, [logout]);

   
  useEffect(() => {
     if (!localStorage.getItem('accessToken') && location.pathname !== '/account/login') {
       redirect('/account/login', {state: {from: location.pathname}});
     }
  }, [user, location.pathname, redirect])

  useEffect(() => {
    if ( user && user.link) {
      socket.emit('join', user.link);
      const handleLeaveUserPage = () => {
        socket.emit('leave', user.link);
        socket.emit('userOffline', localStorage.getItem('accessToken'));
      }
      window.addEventListener('beforeunload', handleLeaveUserPage);
      return () => {
        socket.emit('leave', user.link);
        window.removeEventListener('beforeunload', handleLeaveUserPage);
      }
    }
  }, [user]);

  return (
    <div className="wrapper">
      <LazyComponent loader={<></>}>
        <UserHeader />
      </LazyComponent>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default AuthLayot