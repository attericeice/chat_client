import Settings from "../modules/Settings";
import { Helmet } from 'react-helmet-async';
import ScrollTopComponent from "../HOC/ScrollTop";

const SettingsPage = () => {
  return (
    <ScrollTopComponent>
    <Helmet>
    <title>Настройки аккаунта</title>
    <meta name="description" content="Настройки аккаунта" />
    <meta property="og:title" content="Диалоги" />
    <meta property="og:url" content="http://dialog/settings" />
    <meta property="og:type" content="settings" />
    </Helmet>
    <Settings />
    </ScrollTopComponent>
  )
}

export default SettingsPage;