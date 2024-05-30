import { FC, ChangeEvent } from 'react';
import { FaSearch } from 'react-icons/fa';
import { FaXmark } from "react-icons/fa6";
import cl from './DialogSearchInput.module.scss';

interface IDialogSearchInputProps {
   search: string;
   isSearching: boolean;
   handleSearch: (e : ChangeEvent<HTMLInputElement>) => void;
   cancelSearch: () => void;
}

const DialogSearchInput : FC<IDialogSearchInputProps> = ({search, isSearching, handleSearch, cancelSearch}) => {

  const handleSearchButtonClick = () => {
    if (!isSearching) return;
    cancelSearch();
  }

  return (
    <div className={cl.searchInput}>
      <input type='text' placeholder='Найти...' value={search} onChange={handleSearch}/>
      <button onClick={handleSearchButtonClick} className={cl.dialogSearchButton}>
        {isSearching ? <FaXmark /> : <FaSearch />}
      </button>
    </div>
  )
}

export default DialogSearchInput