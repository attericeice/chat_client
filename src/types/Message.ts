import { IUser } from "./User";

type MessageType = 'default' | 'voice';

type MessageAttachmentType = 'video' | 'image' | 'document';

export type MessageAttachment = {
   id: number;
   messageId: number;
   type: MessageAttachmentType;
   attachSrc: string;
   blurhash: string;
}

export type ResendMessages = {
    id: number;
    resends: IMessage;
}


export interface IMessage {
    id: number;
    userId: number;
    type: MessageType;
    text?: string;
    voiceSrc?: string;
    dialogId: number;
    user: IUser;
    createdAt: string;
    updatedAt: string;
    attachments: MessageAttachment[];
    parent: ResendMessages[];
    answerMessage: IMessage;
    status: 'unread' | 'read';
}



