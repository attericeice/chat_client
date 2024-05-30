import Dialogs from "../modules/Dialogs";
import { Helmet } from 'react-helmet-async';
import { Outlet } from "react-router-dom";


const DialogPage = () => {
  return (
    <section
    className="chatPage">
    <Helmet>
    <title>Диалоги</title>
    <meta name="og:title" content="Диалоги" />
    <meta name="og:url" content="/" />
    <meta name="og:type" content="chat" />
    </Helmet>
    <Dialogs />
    <Outlet />
    </section>
  )
}

export default DialogPage