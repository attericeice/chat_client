import { useLayoutEffect, ReactNode, FC } from 'react';

interface IScrollTopProps {
    children: ReactNode;
}

const ScrollTopComponent : FC<IScrollTopProps> = ({children}) => {
    useLayoutEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return children;
}

export default ScrollTopComponent;