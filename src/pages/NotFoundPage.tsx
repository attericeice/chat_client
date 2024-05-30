
import { ReactComponent as NotFound } from '../assets/images/not-found.svg';
import { RxReload } from 'react-icons/rx';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
    return (
        <section className='notFound'>
            <NotFound />
            <span className='notFoundLabel'>
                Страница не найдена
            </span>
            <Link
            to='/'
            aria-label="Перейти на главную страницу" 
            className='notFoundLink'>
            <RxReload />
            На главную страницу
            </Link>
        </section>
    )
}

export default NotFoundPage;