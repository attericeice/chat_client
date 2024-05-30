import { FC } from 'react';
import Registration from '../modules/Registration';
import { Helmet } from 'react-helmet-async';

const RegistrationPage : FC = () => {
  return (
    <>
    <Helmet>
      <title>Регистрация</title>
      <meta name='description' content="Регистрация в месседжере" />
      <meta property='og:description' content='Регистрация в месседжере' />
      <meta property='og:type' content='registration' />
    </Helmet>
    <Registration />
    </>
  )
}

export default RegistrationPage;