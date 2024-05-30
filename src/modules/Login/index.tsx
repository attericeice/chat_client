import { FC, useState, FormEvent, useLayoutEffect } from 'react';
import { useLoginMutation } from '../../api/userApi';
import AuthForm from '../../components/AuthForm';
import cl from './Login.module.scss';


const Login : FC = () => {

  const [authorize, {isError, isLoading, error }] = useLoginMutation();

  const [email, setEmail] = useState<string>('');
  
  const [password, setPassword] = useState<string>('');

  const handleLoginInDialog = (e : FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    authorize({email, password});
  }

  useLayoutEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      root.classList.add('auth');
    }
    return () => {
      if (root) {
        root.classList.remove('auth')
      }
    }
  }, []);

  return (
    <div className={cl.loginContainer}>
      <h1>Авторизация</h1>
      <AuthForm 
      type='login' 
      email={email}
      emailHandler={setEmail}
      password={password}
      passwordHandler={setPassword}
      submitHandler={handleLoginInDialog}
      error={error}
      isError={isError}
      isLoading={isLoading}
      />
    </div>
  )
}

export default Login;