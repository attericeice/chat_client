import { useState, useEffect, useRef, ChangeEvent, lazy } from 'react';
import { 
  useGetSelfProfileQuery, 
  useUpdateAccountMutation, 
  useUpdateAvatarMutation, 
  useUpdateBannerMutation 
} 
from '../../api/userApi';
import { useTypedSelector } from '../../hooks/useTypedStore';
import { IRTKError, getRTKError } from '../../shared/helpres/getRTKError';
import { IFullUser, UserInformation } from '../../types/User';
import { AnimatePresence, m } from 'framer-motion';
import { LuDownload } from 'react-icons/lu';
import { Modal, DotsLoader, LazyComponent } from '../../shared/UI';
import {ToastContainer, TypeOptions, toast} from 'react-toastify';
import { MEDIA_URL } from '../../shared/constants';
import 'react-toastify/dist/ReactToastify.css';
import cl from './SettingsProfile.module.scss';
const SettingsImageEdit = lazy(() => import('../SettingsImageEdit'));

type SettingsProfile = Omit<IFullUser, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'last_online'>;

const getErrorMessage = (error : IRTKError, field: string) => {
  if (error.fieldError === field) return error.message;
  const fieldErrorIndex = error.errors.findIndex(error => error.path === field);
  if (fieldErrorIndex >= 0) return error.errors[fieldErrorIndex].msg;
  return '';
}

const showNotify = (message: string, type: TypeOptions, theme: 'dark' | 'light') => {
  toast.success(message, {
    position: 'top-center',
    hideProgressBar: true,
    pauseOnHover: true,
    closeOnClick: true,
    autoClose: 2000,
    draggable: true,
    theme,
    type,
  })
}

const SettingsProfile = () => {

  const {data : profileData, isLoading } = useGetSelfProfileQuery();

  const [updateAccount, {isLoading : updating, error : updateError, isError: isUpdateError, isSuccess: updatingSuccess }] = useUpdateAccountMutation();  

  const [updateUserAvatar, {isLoading : avatarUpdating, isError: avatarError, isSuccess : avatarSuccess}] = useUpdateAvatarMutation();

  const [updateUserBanner, {isLoading: bannerUpdating, isError: bannerError, isSuccess: bannerSuccess}] = useUpdateBannerMutation();

  const [profile, setProfile] = useState<SettingsProfile>({
    name: '',
    surname: '',
    email: '',
    password: '',
    link: '',
    avatar_img: '',
    banner_img: '',
  });

  const [userInformation, setUserInformation] = useState<Omit<UserInformation, 'id'>>({
    phone: '',
    birthday: '',
  });

  const [errorsHide, setErrorsHide] = useState(true);

  const [changedPassword, setChangedPassword] = useState<string>('');

  const [currentPassword, setCurrentPassword] = useState<string>('');

  const [selectedAvatarImage, setSelectedAvatarImage] = useState<string>('');

  const [selectedBannerImage, setSelectedBannerImage] = useState<string>('');

  const [editCompleted, setEditCompleted] = useState<boolean>(false);

  const [reset, setReset] = useState<number>(0);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const bannerInputRef = useRef<HTMLInputElement>(null);

  const { theme } = useTypedSelector(state => state.themeReducer);

  const handleUpdateAccountField = (e: ChangeEvent<HTMLInputElement>, key : keyof typeof profile) => {
     setProfile(prev => ({...prev, [key]: e.target.value}));
  }

  const handleUpdateUserInformation = (e : ChangeEvent<HTMLInputElement>, key: keyof typeof userInformation) => {
    setUserInformation(prev => ({...prev, [key]: e.target.value}));
  }

  const handleTypeCurrentPassword = (e : ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value);

  const handleTypeChangedPassword = (e: ChangeEvent<HTMLInputElement>) => setChangedPassword(e.target.value);

  const handleUpdateAccount = () => {
    setErrorsHide(false);
    const updateData : {
      user : typeof profile, 
      passwordData?: {currentPassword: string, newPassword: string}, 
      user_information?: typeof userInformation,
    } = {
      user: profile,
    }
    if (currentPassword && changedPassword) {
      updateData.passwordData = {
        currentPassword,
        newPassword: changedPassword,
      }
    }
    if (userInformation.birthday || userInformation.phone) {
      updateData.user_information = userInformation;
    }
    updateAccount(updateData);
  }

  const handleResetFields = () => {
    setReset(Math.random());
    setErrorsHide(true);
  }

  const handleSelectAvatar = () => {
    if (avatarInputRef.current) {
      avatarInputRef.current.click();
    }
  }

  const handleSelectBanner = () => {
    if (bannerInputRef.current) {
      bannerInputRef.current.click();
    }
  }

  const handleChangeImage = (e : ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    if (e.target.files && e.target.files.length > 0) {
      console.log(e.target.files);
      const reader = new FileReader()
      reader.addEventListener('load', () => {
      type === 'avatar' 
      ? setSelectedAvatarImage(reader.result?.toString() || '') 
      : setSelectedBannerImage(reader.result?.toString() || '');
      e.target.files = null;
      e.target.value = '';
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  }

  const updateAvatar = (cropImage : Blob) => {
    const formData = new FormData();
    formData.append('img', cropImage);
    formData.append('userId', profileData?.id.toString() || '');
    updateUserAvatar(formData);
  }

  const updateBanner = (cropImage: Blob) => {
    const formData = new FormData();
    formData.append('bannerImage', cropImage);
    formData.append('userId', profileData?.id.toString() || '');
    updateUserBanner(formData);
  }

  const cancelUpdateBanner = () => {
    setSelectedBannerImage('');
    setEditCompleted(false);
  }

  const cancelUpdateAvatar = () => {
    setSelectedAvatarImage('');
    setEditCompleted(false);
  }

  const handleUpdateImage = () => setEditCompleted(true);

  useEffect(() => {
    if (!isLoading && profileData) {
       setProfile({...profileData});
       if (profileData.user_information) {
        let birthday = '';
          if (profileData.user_information.birthday !== null) {
             birthday = new Date(profileData.user_information.birthday).toLocaleDateString();
             birthday = birthday.split('.').reverse().join('-');
          }
          setUserInformation({phone: profileData.user_information.phone, birthday});
       }
    }
  }, [isLoading, profileData, reset]);

  useEffect(() => {
    if (avatarSuccess) {
      setSelectedAvatarImage('');
      setEditCompleted(false);
    }
  }, [avatarSuccess]);

  useEffect(() => {
     if (bannerSuccess) {
      setSelectedBannerImage('');
      setEditCompleted(false);
     }
  }, [bannerSuccess]);

  useEffect(() => {
    if (updatingSuccess) {
      showNotify('Данные успешно обновлены', 'success', theme);
    }
  }, [updatingSuccess])

  const toastedUpdatingError = getRTKError(updateError);

  return (
    <m.section
    key="settingsProfile"
    initial={{opacity: 0}}
    animate={{opacity: 1}}
    exit={{opacity: 0}}
    transition={{duration: 0.4}}
    className={cl.settingsProfile}>
    <ToastContainer />
    <div className={cl.settingsProfileContent}>
      <div className={cl.contentLeft}>
      <div className={cl.profileAvatar}>
      <div className={cl.userImage}>
        {
          isLoading ? <m.div 
          className={cl.avatarLoading}
          animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
          transition={{ease: 'linear', duration: 1, repeat: Infinity}}
          />
          : <img width={150} height={150} src={`${MEDIA_URL}/${profile.avatar_img}`} 
          alt={`${profile.name} ${profile.surname}`}
          />
        }
      </div>
      <span onClick={handleSelectAvatar} className={cl.avatarImageName}>{profile.avatar_img}</span>
      <input type='file' onChange={(e) => handleChangeImage(e, 'avatar')} ref={avatarInputRef} accept='image/*'/>
      <div onClick={handleSelectAvatar} className={cl.fileCheckForm}>
      <LuDownload />
      <span className={cl.fileCheckFormInfo}>
      Загрузите файл или перетащите JPEG, PNG, GIF, WEBP
      </span>
      </div>
    </div>
    <div className={cl.profileBanner}>
      <div className={cl.bannerImage}>
        {
          isLoading ? <m.div 
          className={cl.bannerLoading}
          animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
          transition={{ease: 'linear', duration: 1, repeat: Infinity}}
          />
          : profile.banner_img ? <img src={`${MEDIA_URL}/${profile.banner_img}`} 
          alt={`profile banner ${profile.name} ${profile.surname}`}
          />
          : <span className={cl.emptyBanner}>Баннер не загружен</span>
        }
      </div>
      {profile.banner_img && <span onClick={handleSelectBanner} className={cl.bannerImageName}>{profile.banner_img}</span>}
      <input type='file' onChange={(e) => handleChangeImage(e, 'banner')} ref={bannerInputRef} accept='image/*'/>
      <div onClick={handleSelectBanner} className={cl.fileCheckForm}>
      <LuDownload />
      <span className={cl.fileCheckFormInfo}>
      Загрузите файл или перетащите JPEG, PNG, GIF, WEBP
      </span>
      </div>
    </div>
      </div>
      <div className={cl.profileFields}>
      <div className={cl.profileFieldsItem}>
       <span className={cl.profileFieldsItemName}>Имя</span>
       {
         isLoading ? <m.span className={cl.fieldLoader}
         animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
         transition={{ease: 'linear', duration: 1, repeat: Infinity}} 
         />
         : <input type='text' onChange={(e) => handleUpdateAccountField(e, 'name')} value={profile.name} />
       }
       {isUpdateError  && !errorsHide && <m.span className={cl.fieldError}>{getErrorMessage(toastedUpdatingError, 'user.name')}</m.span>}
      </div>
      <div className={cl.profileFieldsItem}>
       <span className={cl.profileFieldsItemName}>Фамилия</span>
       {
         isLoading ? <m.span className={cl.fieldLoader}
         animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
        transition={{ease: 'linear', duration: 1, repeat: Infinity}} 
         />
         : <input type='text' onChange={(e) => handleUpdateAccountField(e, 'surname')} value={profile.surname} />
       }
       {isUpdateError  && !errorsHide && <m.span
       initial={{opacity: 0, x: -10}}
       animate={{opacity: 1, x: 0}}
       className={cl.fieldError}>{getErrorMessage(toastedUpdatingError, 'user.surname')}</m.span>}
      </div>
      <div className={cl.profileFieldsItem}>
       <span className={cl.profileFieldsItemName}>Email</span>
       {
         isLoading ? <m.span className={cl.fieldLoader}
         animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
        transition={{ease: 'linear', duration: 1, repeat: Infinity}} 
         />
         : <input type='text' onChange={(e) => handleUpdateAccountField(e, 'email')} value={profile.email} />
       }
       {isUpdateError && !errorsHide && <m.span
       initial={{opacity: 0, x: -10}}
       animate={{opacity: 1, x: 0}} 
       className={cl.fieldError}>{getErrorMessage(toastedUpdatingError, 'user.email')}</m.span>}
      </div>
      <div className={cl.profileFieldsItem}>
       <span className={cl.profileFieldsItemName}>Ссылка</span>
       {
         isLoading ? <m.span className={cl.fieldLoader}
         animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
        transition={{ease: 'linear', duration: 1, repeat: Infinity}} 
         />
         : <div className={cl.linkField}>
           <span className={cl.commonPath}>/profile/</span>
           <input type='text' onChange={(e) => handleUpdateAccountField(e, 'link')} value={profile.link} />
           {isUpdateError && !errorsHide && <m.span
       initial={{opacity: 0, x: -10}}
       animate={{opacity: 1, x: 0}} 
       className={cl.fieldError}>{getErrorMessage(toastedUpdatingError, 'user.link')}</m.span>}
         </div>
       }
       {isUpdateError  && !errorsHide && <m.span
       initial={{opacity: 0, x: -10}}
       animate={{opacity: 1, x: 0}} 
       className={cl.fieldError}>{getErrorMessage(toastedUpdatingError, 'link')}</m.span>}
      </div>
      <div className={cl.profileFieldsItem}>
       <span className={cl.profileFieldsItemName}>Номер телефона</span>
       {
         isLoading ? <m.span className={cl.fieldLoader}
         animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
        transition={{ease: 'linear', duration: 1, repeat: Infinity}} 
         />
         : <input type="tel" 
         onChange={(e) => handleUpdateUserInformation(e, 'phone')} 
         value={userInformation.phone}
         placeholder='+7-(___)-___-__-__' 
         />
       }
       {isUpdateError  && !errorsHide && <m.span
       initial={{opacity: 0, x: -10}}
       animate={{opacity: 1, x: 0}} 
       className={cl.fieldError}>{getErrorMessage(toastedUpdatingError, 'user_information.phone')}</m.span>}
      </div>
      <div className={cl.profileFieldsItem}>
       <span className={cl.profileFieldsItemName}>Дата рождения</span>
       {
         isLoading ? <m.span className={cl.fieldLoader}
         animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
        transition={{ease: 'linear', duration: 1, repeat: Infinity}} 
         />
         : <input type="date" 
         onChange={(e) => handleUpdateUserInformation(e, 'birthday')} 
         value={userInformation.birthday}
         />
       }
       {isUpdateError && !errorsHide && <m.span 
       initial={{opacity: 0, x: -10}}
       animate={{opacity: 1, x: 0}}
       className={cl.fieldError}>{getErrorMessage(toastedUpdatingError, 'user_information.birthday')}</m.span>}
      </div>
      <div className={cl.profileFieldsItem}>
       <span className={cl.profileFieldsItemName}>Текущий пароль</span>
       {
         isLoading ? <m.span className={cl.fieldLoader}
         animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
        transition={{ease: 'linear', duration: 1, repeat: Infinity}} 
         />
         : <input type='text' placeholder="Текущий пароль" onChange={handleTypeCurrentPassword} value={currentPassword} />
       }
      </div>
      <div className={cl.profileFieldsItem}>
       <span className={cl.profileFieldsItemName}>Новый пароль</span>
       {
         isLoading ? <m.span className={cl.fieldLoader}
         animate={{opacity: [1, 0.6, 0.4, 0.6, 1]}} 
        transition={{ease: 'linear', duration: 1, repeat: Infinity}} 
         />
         : <input type='text' placeholder="Новый пароль" onChange={handleTypeChangedPassword} value={changedPassword} />
       }
       {isUpdateError  && !errorsHide && <m.span
       initial={{opacity: 0, x: -10}}
       animate={{opacity: 1, x: 0}} 
       className={cl.fieldError}>{getErrorMessage(toastedUpdatingError, 'passwordData.newPassword')}</m.span>}
      </div>
     </div>
    </div>
    <div className={cl.settingsProfileButtons}>
      <button disabled={updating} onClick={handleUpdateAccount} className={cl.saveUpdateData}>Сохранить</button>
      <button disabled={updating} onClick={handleResetFields} className={cl.cancelUpdateData}>Отмена</button>
    </div>
   <AnimatePresence>
   {selectedAvatarImage !== '' && <Modal closeModal={cancelUpdateAvatar}>
      <LazyComponent loader={<DotsLoader />}>
      <SettingsImageEdit 
      image={selectedAvatarImage} 
      onSelectImage={updateAvatar} 
      editCompleted={editCompleted}
      handleEditCompleted={handleUpdateImage}
      cancelImageEdit={cancelUpdateAvatar} 
      isLoading={avatarUpdating}
      isError={avatarError}
      />
      </LazyComponent>
      </Modal>}
   </AnimatePresence>
   <AnimatePresence>
    {selectedBannerImage && <Modal closeModal={cancelUpdateBanner}>
     <LazyComponent loader={<DotsLoader />}>
     <SettingsImageEdit
     image={selectedBannerImage}
     onSelectImage={updateBanner}
     editCompleted={editCompleted}
     handleEditCompleted={handleUpdateImage}
     cancelImageEdit={cancelUpdateBanner}
     isLoading={bannerUpdating}
     isError={bannerError}
     />
     </LazyComponent>
    </Modal>}
   </AnimatePresence>
    </m.section>
  )
}

export default SettingsProfile;