import { MdErrorOutline } from "react-icons/md";
import { motion } from 'framer-motion';
import cl from './ErrorHandler.module.scss';

const reloadPage = () => window.location.reload();

const ErrorHandler = () => {
    return (
      <motion.div className={cl.errorHandler}>
      <MdErrorOutline />
      <button onClick={reloadPage} 
      aria-label="Перезагрузить страницу" 
      title="Перезагрузить страницу" 
      className={cl.reloadButton}>
       Перезагрузить страницу
      </button>
      </motion.div>
    )
}

export default ErrorHandler;