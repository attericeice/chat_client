import { useState, useEffect } from 'react';
import { useGetSelfSettingsQuery, useUpdateSettingsMutation } from '../../api/userApi';
import { SelectMenu, CircleLoader } from '../../shared/UI';
import { m } from 'framer-motion';
import cl from './SettingsParams.module.scss';

type FieldAccess = 'everyone' | 'nobody' | 'contacts only';

interface IAccessOptions {
   value: FieldAccess;
   label: string;
}

interface IBooleanAccessOptions {
  value: boolean;
  label: 'Показывать' | 'Не показывать';
}

const BOOLEAN_OPTIONS : IBooleanAccessOptions[] = [
  {value: false, label: 'Не показывать'},
  {value: true, label: 'Показывать'},
];

const ACCESS_OPTIONS : IAccessOptions[] = [
  {value: 'contacts only', label: 'Только контактам'},
  {value: 'nobody', label: 'Никому'},
  {value: 'everyone', label: 'Всем'},
];

const SettingsParams = () => {

  const [showEmail, setShowEmail] = useState<IAccessOptions>({label: 'Всем', value: 'everyone'});

  const [showNumber, setShowNumber] = useState<IAccessOptions>({label: 'Всем', value: 'everyone'});

  const [showLastOnline, setShowLastOnline] = useState<IBooleanAccessOptions>({label: 'Показывать', value: true});

  const [messageWithoutContact, setMessageWithoutContact] = useState<IBooleanAccessOptions>({label: 'Показывать', value: true});

  const [reset, setReset] = useState<number>(0);
 
  const {data : settings, isLoading } = useGetSelfSettingsQuery();

  const [updateSettings, {isLoading : updating, isError : updatingError}] = useUpdateSettingsMutation();

  const handleSelectAccessOptions = (option : IAccessOptions['value']) => {
       const selectedOption = ACCESS_OPTIONS.find(item => item.value === option);
       return selectedOption;
  }

  const handleSelectBooleanOption = (option : IBooleanAccessOptions['value']) => {
    const selectedOption = BOOLEAN_OPTIONS.find(item => item.value === option);
    return selectedOption;
  }

  const handleCancelUpdates = () => setReset(Math.random());

  const handleSaveUpdates = () => {
     const settingsUpdateData  = {
        show_email: showEmail.value,
        show_number: showNumber.value,
        show_last_online: showLastOnline.value,
        messages_without_contact: messageWithoutContact.value,
     }
     updateSettings(settingsUpdateData);
  }

  useEffect(() => {
     if (!isLoading && settings) {
       const {show_last_online, show_email, show_number, messages_without_contact} = settings;
       const emailOption = handleSelectAccessOptions(show_email);
       if (emailOption) setShowEmail(emailOption);
       const numberOption = handleSelectAccessOptions(show_number);
       if (numberOption) setShowNumber(numberOption);
       const showLastOnlineOption = handleSelectBooleanOption(show_last_online);
       if (showLastOnlineOption) setShowLastOnline(showLastOnlineOption);
       const messageWithoutContactOption = handleSelectBooleanOption(messages_without_contact);
       if (messageWithoutContactOption) setMessageWithoutContact(messageWithoutContactOption);
     }
  }, [isLoading, settings, reset]);

  return (
    <m.section
    key="settingsParams"
    initial={{opacity: 0}}
    animate={{opacity: 1}}
    exit={{opacity: 0}}
    transition={{duration: 0.4}}
    className={cl.settingsParams}>
    <div className={cl.settingsParamsFields}>
    <div className={cl.settingsParamsFieldsItem}>
    <span className={cl.label}>Показывать Email</span>
    <SelectMenu 
    currentValue={showEmail}
    handleSelect={setShowEmail}
    getStringValue={(showEmail) => showEmail.label}
    values={ACCESS_OPTIONS}
    className={cl.selectItem}
    />
    </div>
    <div className={cl.settingsParamsFieldsItem}>
    <span className={cl.label}>Показывать номер телефона</span>
    <SelectMenu 
    currentValue={showNumber}
    handleSelect={setShowNumber}
    getStringValue={(showNumber) => showNumber.label}
    values={ACCESS_OPTIONS}
    className={cl.selectItem}
    />
    </div>
    <div className={cl.settingsParamsFieldsItem}>
    <span className={cl.label}>Показывать последнюю активность</span>
    <SelectMenu 
    currentValue={showLastOnline}
    handleSelect={setShowLastOnline}
    getStringValue={(showLastOnline) => showLastOnline.label}
    values={BOOLEAN_OPTIONS}
    className={cl.selectItem}
    />
    </div>
    <div className={cl.settingsParamsFieldsItem}>
    <span className={cl.label}>Сообщения только от контактов</span>
    <SelectMenu 
    currentValue={messageWithoutContact}
    handleSelect={setMessageWithoutContact}
    getStringValue={(messageWithoutContact) => messageWithoutContact.label}
    values={BOOLEAN_OPTIONS}
    className={cl.selectItem}
    />
    </div>
    <button className={cl.removeAccountButton}>Удалить аккаунт</button>
    </div>
    <div className={cl.settingsParamsButtons}>
      <button disabled={updating} onClick={handleSaveUpdates} className={cl.saveUpdates}>
        Сохранить
        {updating && <CircleLoader size={16} />}
        </button>
      <button disabled={updating} onClick={handleCancelUpdates} className={cl.cancelUpdates}>Отмена</button>
    </div>
    </m.section>
  )
}

export default SettingsParams;