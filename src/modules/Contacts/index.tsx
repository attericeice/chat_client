import { useState, FC, createContext } from 'react';
import { FaXmark } from 'react-icons/fa6';
import UserContacts from '../../components/UserContacts';
import UserSelfRequests from '../../components/UserSelfRequests';
import UserOtherRequests from '../../components/UserOtherRequests';
import SearchContacts from '../../components/SearchContacts';
import { SelectMenu } from '../../shared/UI';
import cl from './Contacts.module.scss';

type ContactsTabType = 'contacts' | 'self' | 'other' | 'search';

interface IContactTab {
  tab: ContactsTabType;
  value: string;
}

const TAB_VALUES : IContactTab [] = [
  {tab: 'contacts', value: 'Контакты'},
  {tab: 'other', value: 'Входящие заявки'},
  {tab: 'self', value: 'Исходящие заявки'},
  {tab: 'search', value: 'Поиск'},
];

type ContactsContext = () => void;


const defaultContactsContextValue : ContactsContext = () => null;

export const ContactsContext = createContext(defaultContactsContextValue);

interface IContactsProps {
    closeHandler: () => void;
}

const Contacts : FC<IContactsProps> = ({closeHandler}) => {

  const [currentPage, setCurrentPage] = useState<IContactTab>(TAB_VALUES[0]);

  const getContactPageContent = () => {
     switch (currentPage.tab) {
      case 'contacts':
        return <UserContacts key='contacts'/>
      case 'self':
        return <UserSelfRequests key='self'/>
      case 'other':
        return <UserOtherRequests key='other'/>
      case 'search':
        return <SearchContacts key='search'/>
     }
  }

  return (
    <div className={cl.contactsContainer}>
     <div className={cl.contactsHeader}>
     <SelectMenu 
     values={TAB_VALUES}
     currentValue={currentPage}
     handleSelect={setCurrentPage}
     getStringValue={(tab) => tab.value}
     />
     <button onClick={closeHandler} className={cl.closeContacts}><FaXmark /></button>
     </div>
     <ContactsContext.Provider value={closeHandler}>
     {getContactPageContent()}
     </ContactsContext.Provider>
    </div>
  )
}

export default Contacts;

