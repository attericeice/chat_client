import { useState, useRef, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa6';
import { AnimatePresence, m } from 'framer-motion';
import cl from './SelectMenu.module.scss';

interface ISelectMenuProps<T> {
    values: T[];
    handleSelect: (value : T) => void;
    currentValue: T;
    getStringValue: (value: T) => string;
    className?: string;
}

function SelectMenu<T>({values, handleSelect, currentValue, getStringValue, className} : ISelectMenuProps<T>) {

  const [selectMenuOpen, setSelectMenuOpen] = useState<boolean>(false);

  const selectMenuRef = useRef<HTMLDivElement>(null);

  const toggleSelectMenuOpen = () => setSelectMenuOpen(prev => !prev);

  useEffect(() => {
   if (!selectMenuRef.current) return;
   const handleClickOutsideSelect = (e : MouseEvent) => {
      if (!selectMenuRef.current?.contains(e.target as HTMLElement)) {
        setSelectMenuOpen(false);
      }
   }
   window.addEventListener('click', handleClickOutsideSelect);
  }, []);

  const selectMenuClassName = className ? [cl.selectMenu, className] : [cl.selectMenu];

  const selectButtonClassName = selectMenuOpen ? [cl.openSelectMenuButton, cl.active] : [cl.openSelectMenuButton];

  return (
    <div ref={selectMenuRef} className={selectMenuClassName.join(' ')}>
    <button onClick={toggleSelectMenuOpen} className={selectButtonClassName.join(' ')}>
    {getStringValue(currentValue)}
    <FaChevronDown />
    </button>
    <AnimatePresence>
    {
        selectMenuOpen && <m.ul
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        exit={{opacity: 0, y: 20}} 
        className={cl.selectMenuDropdown}>
         {
            values.map(value => <li className={cl.selectMenuDropdownItem}
            key={getStringValue(value)}
            onClick={() => handleSelect(value)}
            >
            {getStringValue(value)}
            </li>)
         }
        </m.ul>
    }
    </AnimatePresence>
    </div>
  )
}

export default SelectMenu;