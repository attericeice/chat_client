import { FC, useState, useLayoutEffect, FormEvent } from 'react';
import { useRegistrationMutation } from '../../api/userApi';
import AuthForm from '../../components/AuthForm';
import cl from './Registration.module.scss';

const Registration : FC = () => {

  const [registration, {isError, isLoading, error}] = useRegistrationMutation();

  const [email, setEmail] = useState<string>('');
  
  const [password, setPassword] = useState<string>('');

  const [passwordAgain, setPasswordAgain] = useState<string>('');

  const [name, setName] = useState<string>('');

  const [surname, setSurname] = useState<string>('');

  const handleRegistration = ( e : FormEvent<HTMLFormElement> ) => {
    e.preventDefault();
    registration({name, surname, email, password});
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
    <div className={cl.registrationContainer}>
    <h1>Регистрация</h1>
    <AuthForm 
    type='registration' 
    email={email}
    password={password}
    passwordAgain={passwordAgain}
    name={name}
    surname={surname}
    passwordHandler={setPassword}
    passwordAgainHandler={setPasswordAgain}
    emailHandler={setEmail}
    nameHandler={setName}
    surnameHandler={setSurname}
    submitHandler={handleRegistration}
    error={error}
    isLoading={isLoading}
    isError={isError}
    />
  </div>
  )
}

export default Registration;