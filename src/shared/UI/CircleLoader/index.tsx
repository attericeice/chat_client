import { FC } from 'react';
import { m } from 'framer-motion';
import cl from './CircleLoader.module.scss';

interface ICircleLoaderProps {
    size: number;
}

const CircleLoader : FC<ICircleLoaderProps> = ({size}) => {
    return (
        <m.div className={cl.circleLoader}
        initial={{opacity: 0, y: -5}}
        animate={{opacity: 1, y: 0, rotate: 360, transition: {duration: 1, repeat: Infinity, ease: 'linear'}}}
        exit={{opacity: 0, y: -5}}
        style={{width: size, height: size}}
        >
        </m.div>
    )
}

export default CircleLoader;
