
import { api }  from '../api';
import { IMessage } from '../types/Message';
import { BlackList, IUser } from '../types/User';
import socket from './socketApi';

interface IGetMessagesRequest {
    userId: number | string;
    dialogId: string | undefined;
    page: number;
    difference: number;
}

interface IGetMessagesResponse {
  dialogMessages: IMessage[];
  dialogUser: IUser & {blacklist_sender: BlackList[]; blacklist_banned: BlackList[]};
  count: number;
}



const messageApi = api.injectEndpoints({
    overrideExisting: false,
    endpoints: (builder) => ({
     getDialogMessages: builder.query<IGetMessagesResponse, IGetMessagesRequest>({
        query: ({userId, dialogId, page, difference}) => {
          return `/messages/dialog/all?userId=${userId}&dialogId=${dialogId}&page=${page}&diff=${difference}`;
        },
        serializeQueryArgs: ({endpointName}) => {
          return endpointName;
        },
        merge: (cache, newMessages, {arg}) => {
           if (cache.dialogMessages.length < 1 ||  (arg.dialogId && Number(arg.dialogId) !== cache.dialogMessages[0].dialogId)) {
             return newMessages;
           }
           else {
            const filteredNewMessages = newMessages.dialogMessages.filter(message => {
              const cacheIndex = cache.dialogMessages.findIndex(m => m.id === message.id);
              if (cacheIndex >= 0) return false;
              return true;
            });
            cache.dialogMessages.unshift(...filteredNewMessages);
            cache.count = newMessages.count;
            cache.dialogUser = newMessages.dialogUser;
            return cache;
           }
        },
        forceRefetch({currentArg, previousArg}) {
            return currentArg !== previousArg;
        },
        keepUnusedDataFor: 0,
        async onCacheEntryAdded(args, {updateCachedData, cacheDataLoaded, cacheEntryRemoved}) {
          const onMessage = (message : IMessage) => {
            updateCachedData(draft => {
             draft.dialogMessages.push(message);
             draft.count += 1;
             return draft;
            });
          }
          const onReadMessange = (readMessage : Pick<IMessage, 'id' | 'dialogId'>) => {
            if (readMessage.dialogId !== Number(args.dialogId)) return;
            updateCachedData(draft => {
              const readMessageIndex = draft.dialogMessages.findIndex(m => m.id === readMessage.id);
              if (readMessageIndex >= 0) draft.dialogMessages[readMessageIndex].status = 'read';
            });
          }
          const onRemoveMessages = (messagesIds: number[]) => {
            updateCachedData(draft => {
               const dialogMessages = draft.dialogMessages.filter(m => !messagesIds.includes(m.id));
               const count = draft.count - messagesIds.length;
               return {dialogUser: draft.dialogUser, dialogMessages, count};
            });
          }
          const onUpdateMessage = (message: IMessage) => {
            updateCachedData(draft => {
               const messageIndex = draft.dialogMessages.findIndex(m => m.id === message.id);
               if (messageIndex >= 0) {
                 draft.dialogMessages[messageIndex] = message;
               }
               return draft;
            });
          }
          const onUserOnline = () => {
             updateCachedData(draft => {
              draft.dialogUser.status = 'online';
              return draft;
             });
          }
          const onUserOffline = () => {
            updateCachedData(draft => {
              draft.dialogUser.status = 'offline';
              return draft;
             });
          }
          
          const onBlackList = (blacklist : BlackList) => {
            updateCachedData(draft => {
                if (args.userId === blacklist.senderId) {
                  draft.dialogUser.blacklist_banned.push(blacklist);
                }
                else {
                  draft.dialogUser.blacklist_sender.push(blacklist);
                }
                return draft;
            });
          }   

          const removeBlackList = (blacklist : BlackList) => {
            updateCachedData(draft => {
              if (Number(args.userId) === blacklist.senderId) {
                draft.dialogUser.blacklist_banned = [];
              }
              else if (Number(args.userId) === blacklist.bannedId) {
                draft.dialogUser.blacklist_sender = [];
              }
              return draft;
            })
          } 

            try {
              await cacheDataLoaded;
              socket.on('newMessage', onMessage);
              socket.on('updateMessageStatus', onReadMessange);
              socket.on('removeMessages', onRemoveMessages);
              socket.on('updateMessage', onUpdateMessage);
              socket.on('userOnlineChat', onUserOnline);
              socket.on('userOfflineChat', onUserOffline);
              socket.on('addBlackList', onBlackList);
              socket.on('removeBlackList', removeBlackList);
            } 
            catch (error) {
              console.log(error);
            } 
            await cacheEntryRemoved;
            socket.off('newMessage', onMessage);
            socket.off('updateMessageStatus', onReadMessange);
            socket.off('removeMessages', onRemoveMessages);
            socket.off('updateMessage', onUpdateMessage);
            socket.off('userOnline', onUserOnline);
            socket.off('userOffline', onUserOffline);
            socket.off('addBlackList', onBlackList);
            socket.off('removeBlackList', removeBlackList);
        },
     }
     )
    }),
}
);


export const { useGetDialogMessagesQuery, useLazyGetDialogMessagesQuery } = messageApi;