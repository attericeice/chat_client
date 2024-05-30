import { useEffect, FC, FormEvent, ChangeEvent } from 'react';
import { useTypedSelector } from '../../hooks/useTypedStore';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getRTKError } from '../../shared/helpres/getRTKError';
import classes from './Auth.module.scss';

interface IAuthFormProps {
   type: 'login' | 'registration';
   email : string;
   password: string;
   passwordAgain?: string;
   name?: string;
   surname?: string;
   emailHandler: (email : string) => void;
   passwordHandler: (password : string) => void;
   submitHandler: (e : FormEvent<HTMLFormElement>) => void;
   passwordAgainHandler?: (passwordAgain : string) => void;
   nameHandler?: (name: string) => void;
   surnameHandler?: (surname: string) => void;
   error: any;
   isError: boolean;
   isLoading: boolean;
}

const AuthForm : FC<IAuthFormProps> = (props) => {

  const {type, email, password, passwordAgain, name, surname } = props;

  const {error, isError, isLoading} = props;

  const {emailHandler, passwordHandler, passwordAgainHandler, nameHandler, surnameHandler, submitHandler} = props;

  const redirect = useNavigate();

  const location = useLocation();

  const { isAuth } = useTypedSelector(state => state.userReducer);

  const typeEmail = (e : ChangeEvent<HTMLInputElement>) => emailHandler(e.target.value);

  const typePassword = (e : ChangeEvent<HTMLInputElement>) => passwordHandler(e.target.value);

  const typeName = (e : ChangeEvent<HTMLInputElement>) => nameHandler && nameHandler(e.target.value);

  const typeSurname = (e : ChangeEvent<HTMLInputElement>) => surnameHandler && surnameHandler(e.target.value);

  const typePasswordAgain = (e : ChangeEvent<HTMLInputElement>) => passwordAgainHandler && passwordAgainHandler(e.target.value);

  const getErrorMessage = (field : string) => {
     if (toastedError.fieldError === field) return toastedError.message;
     const fieldErrorIndex = toastedError.errors.findIndex(error => error.path === field);
     if (fieldErrorIndex >= 0) return toastedError.errors[fieldErrorIndex].msg;
     return '';
  }

  const getSubmitButtonDisabledState = () : boolean => {
    switch (type) {
    case 'registration':
      if (!isLoading && email && password && passwordAgain && name && surname && password === passwordAgain) {
        return false;
      }
      return true;
    case 'login':
      if (!isLoading && email && password) return false;
      return true;
    }
    }
    
  const toastedError = getRTKError(error);

  console.log(getRTKError(toastedError));

  useEffect(() => {
    if (isAuth) {
      const url = location.state?.from || '/';
      redirect(url);
    }
  }, [isAuth]);

  return (
   <form onSubmit={submitHandler} id="login__form" className={classes.authForm}>
    <div className={classes.inputContainer}>
      <label htmlFor="email">Почта</label>
      <input className={classes.authFormInput}
      aria-label="Ввести электронную почту" 
      id="email" 
      name="email" 
      type='email' 
      value={email}
      onChange={typeEmail}
      placeholder='Адрес электронной почты' />
      {isError && <span className={classes.errorMessage}>
        {getErrorMessage('email')}
      </span>}
    </div>
    <div className={classes.inputContainer}>
      <label htmlFor="password">Пароль</label>
      <input className={classes.authFormInput}
      aria-label="Ввести пароль" 
      id="password" 
      name="password" 
      type='password'
      value={password}
      onChange={typePassword}
      placeholder='Введите пароль' />
     {isError && <span className={classes.errorMessage}>
        {getErrorMessage('password')}
      </span>}
    </div>
    {
      type === 'registration' && 
      <>
       <div className={classes.inputContainer}>
      <label htmlFor="name">Повторите пароль</label>
      <input className={classes.authFormInput}
      aria-label="Повторить пароль" 
      id="passwordAgain" 
      name="passwordAgain" 
      type='password'
      value={passwordAgain}
      onChange={typePasswordAgain}
      placeholder='Пароль' />
      {password !== passwordAgain && <span className={classes.errorMessage}>
        Пароли не совпадают
        </span>}
    </div>
      <div className={classes.inputContainer}>
      <label htmlFor="name">Имя</label>
      <input className={classes.authFormInput}
      aria-label="Указать имя" 
      id="name" 
      name="name" 
      type='text'
      value={name}
      onChange={typeName}
      placeholder='Ваше имя' />
      <span className={classes.errorMessage}>
        {getErrorMessage('name')}
      </span>
    </div>
    <div className={classes.inputContainer}>
      <label htmlFor="surname">Фамилия</label>
      <input className={classes.authFormInput}
      aria-label="Указать фамилию" 
      id="surname" 
      name="surname" 
      type='text'
      value={surname}
      onChange={typeSurname}
      placeholder='Ваша фамилия' />
      <span className={classes.errorMessage}>
        {getErrorMessage('surname')}
      </span>
    </div>
      </>
    }
    <button disabled={getSubmitButtonDisabledState()} className={classes.authFormButton}>
      {type === "login" ? 'Войти' : 'Регистрация'}
      </button>
    <p className={classes.formLink}>
      <Link to={type === 'login' ? '/account/registration' : '/account/login'}>
        {type === 'login' ? 'Еще нет аккаунта?' : 'Уже есть аккаунт?'}
      </Link>
    </p>
   </form>
  )
}

export default AuthForm;