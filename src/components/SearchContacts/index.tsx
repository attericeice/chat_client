import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useDebaunce } from '../../hooks/useDebaunce';
import { useGetUserSearchQuery } from '../../api/userApi';
import { useTypedSelector } from '../../hooks/useTypedStore';
import { FaSearch } from 'react-icons/fa';
import { FaXmark } from "react-icons/fa6";
import SearchContactItem from '../SearchContactItem';
import { NoItems } from '../../shared/UI';
import { m } from 'framer-motion';
import cl from './SearchContacts.module.scss';


const SearchContacts = () => {

  const [search, setSearch] = useState<string>('');

  const [isSearching, setIsSearching] = useState<boolean>(false);

  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  const [page, setPage] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);

  const { user } = useTypedSelector(state => state.userReducer);

  const debouncedSetSearch = useDebaunce(() => {
    setDebouncedSearch(search);
    setIsSearching(false);
  }, 500);

  const {data: searchContacts, isLoading, isFetching } = useGetUserSearchQuery({
    userId: user.id, 
    search: debouncedSearch,
    page,
  }, 
    {
    skip: user.id === '' || debouncedSearch === ''
  });

  const handleTypeSearch = (e: ChangeEvent<HTMLInputElement>) => {
    if (!isSearching) setIsSearching(true);
    setSearch(e.target.value);
  }

  const handleClickSearchButton = () => {
    if (!search) return;
    setSearch('');
  }

  const loadNewPageStatus = () => {
    return !isSearching && debouncedSearch && !isLoading && !isFetching && searchContacts 
    && searchContacts.rows.length >= 1 && searchContacts.rows.length < searchContacts.count;
  }

  const searchResultsClassName = !isLoading && !isFetching && searchContacts && searchContacts.count === 0 
  ? [cl.searchResults, cl.noResults]
  : [cl.searchResults];

  useEffect(() => {
    debouncedSetSearch();
  }, [search]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const scrollObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && loadNewPageStatus()) {
          setPage(prev => prev + 1);
      }
    });
    scrollObserver.observe(scrollRef.current);
    return () => scrollObserver.disconnect();
  }, [isFetching, isLoading, debouncedSearch, isSearching]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  return (
    <section className={cl.searchContacts}>
      <div className={cl.contactsSearchInput}>
        <input 
        type='text' 
        value={search} 
        onChange={handleTypeSearch} 
        placeholder='Укажите имя, фамилию или личную ссылку'
        name='contact_search'/>
        <button onClick={handleClickSearchButton} className={cl.searchButton}>
          {search ? <FaXmark /> : <FaSearch />}
        </button>
      </div>
      <div className={searchResultsClassName.join(' ')}>
        {
          isSearching || !search ? null 
          : isLoading || isFetching ? <>
          {
            [...new Array(6)].map((_, i) => <div key={i} className={cl.searchContactSkeleton}>
            <div className={cl.searchContactSkeletonUser}>
            <m.div 
            animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
            transition={{ease: 'linear', duration: 1, repeat: Infinity}}
            className={cl.searchContactSkeletonUserImage} />
            <m.span
            animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
            transition={{ease: 'linear', duration: 1, repeat: Infinity}} 
            className={cl.searchContactSkeletonUserName} />
            </div>
            <m.span
            animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
            transition={{ease: 'linear', duration: 1, repeat: Infinity}} 
            className={cl.searchContactSkeletonButton} />
            </div>)
          }
          </>
          : searchContacts && searchContacts.rows.length
          ? searchContacts.rows.map(contact => <SearchContactItem key={contact.id} contact={contact}/>)
          : <NoItems type="contacts" label="Ничего не найдено" />
        }
        <div ref={scrollRef}></div>
      </div>
    </section>
  )
}

export default SearchContacts;