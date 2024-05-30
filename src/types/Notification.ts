
export interface INotification {
    id: number;
    text: string;
    userId: number;
    link?: string;
    linkText?: string;
    img: string;
    createdAt: string;
    updatedAt: string;
}