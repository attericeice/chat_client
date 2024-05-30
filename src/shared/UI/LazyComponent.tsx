import { Suspense, FC, ReactNode } from 'react';


interface ILazyComponentProps {
    children: ReactNode;
    loader: ReactNode;
}


const LazyComponent : FC<ILazyComponentProps> = ({children, loader}) => {
    return <Suspense fallback={loader}>{children}</Suspense>
}

export default LazyComponent;