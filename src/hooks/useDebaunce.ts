import { useRef } from "react";

export function useDebaunce<A extends any[]>(callback : (...args : A) => any, delay : number) {
     const timerRef = useRef<ReturnType<typeof setTimeout>>();

     function debauncedCallback(...args : A) : any {
       if (timerRef.current) clearTimeout(timerRef.current);

       timerRef.current = setTimeout(async () => {
         await callback(...args);
       }, delay);
     }
    
     return debauncedCallback;
}