import { IMessage } from "./Message";
import { BlackList, IUser } from "./User";


type UsersInDialogs = {
    id: number;
    user: Pick<IUser, 'name' | 'surname'| 'avatar_img' | 'status'> & {blacklist_sender: BlackList[]; blacklist_banned: BlackList[]};
}

export interface IDialog {
    id: number;
    type: string;
    createdAt: string;
    updatedAt: string;
    messages: Partial<IMessage & Pick<IUser, 'name'>>[];
    users_in_dialogs: UsersInDialogs[];
    unread: number;
}