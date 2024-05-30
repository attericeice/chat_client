import { useTypedSelector } from '../../hooks/useTypedStore';
import { m } from 'framer-motion'
import BgLight from '../../assets/images/bg-light.jpeg';
import BgDark from '../../assets/images/bg-dark.jpeg';
import cl from './EmptyChat.module.scss';

const EmptyChat = () => {
  
  const { theme } = useTypedSelector(state => state.themeReducer);

  const background = theme === 'dark' ? BgDark : BgLight;

  return (
   <m.div
   initial={{opacity: 0}}
   animate={{opacity: 1}}
   exit={{opacity: 0}}
   transition={{duration: .4}}
   className={cl.emptyChatContainer}>
    <div className={cl.emptyChat} style={{backgroundImage: `url(${background})`}}>
    <p>Выберите, кому хотели бы написать</p>
    </div>
   </m.div>
  )
}

export default EmptyChat