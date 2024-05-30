import { ReactComponent as DotsLoaderImg } from '../../../assets/images/bouncing-circles.svg';
import cl from './DotsLoader.module.scss';

const DotsLoader = () => {
  return (
   <DotsLoaderImg className={cl.dotsLoader} />
  )
}

export default DotsLoader