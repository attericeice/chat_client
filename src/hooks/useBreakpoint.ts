import { useState, useEffect } from "react";

export const useBreakpoint = (breakpoint : number) => {
    const [isBreakpoint, setIsBreakpoint] = useState<boolean>(false);
    useEffect(() => {
      const handleUpdateBreakpoint = () => {
         const currentWidth = window.innerWidth;
         if (currentWidth <= breakpoint && !isBreakpoint) {
            setIsBreakpoint(true);
         }
         else if (currentWidth > breakpoint && isBreakpoint) {
            setIsBreakpoint(false);
         }
      }
      handleUpdateBreakpoint();
      window.addEventListener('resize', handleUpdateBreakpoint);
      return window.addEventListener('resize', handleUpdateBreakpoint);
    }, [isBreakpoint, breakpoint]);

    return isBreakpoint;
}