import { FC } from 'react';
import Login from '../modules/Login';
import { Helmet } from 'react-helmet-async';

const LoginPage : FC = () => {
  return (
    <>
    <Helmet>
      <title>Авторизация</title>
      <meta name='description' content="Регистрация в месседжере" />
    </Helmet>
    <Login />
    </>
  )
}

export default LoginPage;