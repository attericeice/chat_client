import { IDialog } from "./Dialog";

export interface IUser {
    id: number | string;
    name: string;
    surname: string;
    email: string;
    avatar_img: string;
    link: string;
    status?: 'offline' | 'online';
    last_online?: string;
}

export type UserInformation = {
    id: number;
    phone: string,
    birthday: string
}

export interface IFullUser extends IUser {
    password: string;
    createdAt: string;
    updatedAt: string;
    banner_img: string;
    user_information?: UserInformation;
} 

export type UserSettings = {
    id: number;
    messages_without_contact: boolean;
    show_last_online: boolean;
    show_email: 'everyone' | 'nobody' | 'contacts only';
    show_number: 'everyone' | 'nobody' | 'contacts only';
}

export type UserMedia =  {
    id: number;
    type: 'image' | 'video';
    src: string;
    isGenerated: boolean;
    userId: number;
    isAvatar: boolean;
    blurhash: string;
}

export type UserContactRequest = {
    id: number;
    senderId: IUser['id'];
    userId: IUser['id'];
    createdAt: string;
    updatedAt: string;
    user?: IUser;
    sender?: IUser;
}

export type UserContact = {
    id: number;
    contactId: number;
    userId: number;
    createdAt: string;
    updatedAt: string;
    contact: IUser;
}

export type BlackList = {
    id: number;
    senderId: number;
    bannedId: number;
    sender?: IUser;
    banned?: IUser;
}

export interface IProfile extends IUser{
    banner_img: string;
    user_information: UserInformation;
    user_settings: UserSettings;
    user_media: UserMedia[];
    dialog?: Omit<IDialog, 'users_in_dialogs' | 'unread' | 'messages'>;
    isContact: boolean;
    sentRequest: UserContactRequest[];
    receiverRequest: UserContactRequest[];
    blacklist_sender: BlackList[];
    blacklist_banned: BlackList[];
}

export interface IUserSearch extends IUser {
    user_contacts: UserContact[];
    sentRequest: UserContactRequest[];
    receiverRequest: UserContactRequest[];
    blacklist_banned: BlackList[];
}