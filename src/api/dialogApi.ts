import { api } from '../api';
import { IDialog } from '../types/Dialog';
import { BlackList } from '../types/User';
import socket from './socketApi';

interface IDialogRequestParams {
   userId: number | string;
   search: string;
   link: string;
}

interface ICreateDialogParams {
   userId: number | string;
   interluctorId: number | string;
}

interface IClearDialogParams {
   userId: number | string;
   dialogId: IDialog['id'];
}

const dialogApi = api.injectEndpoints({
    overrideExisting: false,
    endpoints: (builder) => ({
     getDialogs: builder.query<IDialog[], IDialogRequestParams>({
       providesTags: ['Dialogs'],
        query: ({userId, search, link}) => {
         return {
            url: search ? `/dialogs/user/${userId}?search=${search}` : `/dialogs/user/${userId}`,
            credentials: 'include'
         }
        },
        async onCacheEntryAdded(args, {updateCachedData, cacheDataLoaded, cacheEntryRemoved}){

           const onUpdateDialog = (dialog : IDialog) => {
              updateCachedData(draft => {
                 const index = draft.findIndex(item => item.id === dialog.id);
                 if (index >= 0) {
                   if (dialog.messages.length < 1) {
                     draft = draft.filter(({id}) => dialog.id !== id);
                     return draft;
                   } else {
                     draft[index] = dialog;
                   }
                 }
                 else {
                  draft.unshift(dialog);
                 }
                 draft.sort((a, b) => {
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                 });
                 return draft;
              });
           }
            
           const onReadMessage = (dialogId : IDialog['id']) => {
              updateCachedData(draft => {
               const dialogIndex = draft.findIndex(dialog => dialog.id === dialogId);
               if (dialogIndex >= 0) draft[dialogIndex].unread = draft[dialogIndex].unread - 1;
              });
           }
           const onUserOnline = (dialogId : IDialog['id']) => {
             updateCachedData(draft => {
                const dialogIndex = draft.findIndex(d => d.id === dialogId);
                if (dialogIndex >= 0) {
                  draft[dialogIndex].users_in_dialogs[0].user.status = 'online';
                }
                return draft;
             });
          } 

          const onUserOffline = (dialogId : IDialog['id']) => {
            updateCachedData(draft => {
               const dialogIndex = draft.findIndex(d => d.id === dialogId);
                if (dialogIndex >= 0) {
                  draft[dialogIndex].users_in_dialogs[0].user.status = 'offline';
                }
                return draft;
            })
          }

          const onBlackListSender = ({blacklist, dialogId} : {blacklist: BlackList; dialogId: number}) => {
             updateCachedData(draft => {
               const dialogIndex = draft.findIndex(dialog => dialog.id === dialogId);
               if (dialogIndex >= 0) {
                  draft[dialogIndex].users_in_dialogs[0].user.blacklist_banned.push(blacklist);
               }
               return draft;
             })
          }

          const onBlackListBanned = ({blacklist, dialogId} : {blacklist: BlackList; dialogId: number}) => {
            updateCachedData(draft => {
               const dialogIndex = draft.findIndex(dialog => dialog.id === dialogId);
               if (dialogIndex >= 0) {
                  draft[dialogIndex].users_in_dialogs[0].user.blacklist_sender.push(blacklist);
               }
               return draft;
            })
          }

          const removeBlackListSender = ({blacklist, dialogId} : {blacklist: BlackList; dialogId: number}) => {
             updateCachedData(draft => {
               const dialogIndex = draft.findIndex(dialog => dialog.id === dialogId);
               if (dialogIndex >= 0) {
                  draft[dialogIndex].users_in_dialogs[0].user.blacklist_banned = [];
               }
               return draft;
             })
          }

          const removeBlackListBanned = ({blacklist, dialogId} : {blacklist: BlackList; dialogId: number}) => {
            updateCachedData(draft => {
              const dialogIndex = draft.findIndex(dialog => dialog.id === dialogId);
              if (dialogIndex >= 0) {
                 draft[dialogIndex].users_in_dialogs[0].user.blacklist_sender = [];
              }
              return draft;
            })
         }

           try {
              await cacheDataLoaded;
              socket.on('updateDialog', onUpdateDialog);
              socket.on('unreadDecrement', onReadMessage);
              socket.on('userOnline', onUserOnline);
              socket.on('userOffline', onUserOffline);
              socket.on('addBlackListSender', onBlackListSender);
              socket.on('addBlackListBanned', onBlackListBanned);
              socket.on('removeBlackListSender', removeBlackListSender);
              socket.on('removeBlackListBanned', removeBlackListBanned);
           }
           catch(error) {
            console.log(error);
           }
           await cacheEntryRemoved;
           socket.off('updateDialog', onUpdateDialog);
           socket.off('unreadDecrement', onReadMessage);
           socket.off('userOnline', onUserOnline);
           socket.off('userOffline', onUserOffline);
           socket.off('addBlackListSender', onBlackListSender);
           socket.off('addBlackListBanned', onBlackListBanned);
           socket.off('removeBlackListSender', removeBlackListSender);
           socket.off('removeBlackListBanned', removeBlackListBanned);
        },
     }),
     createDialog: builder.mutation<Omit<IDialog, 'messages' | 'users_in_dialogs' | 'unread'>, ICreateDialogParams>({
      query(data) {
         return {
            url: '/dialogs/create/private',
            method: 'POST',
            body: data,
            credentials: 'include'
         }
      }
     }),
     clearDialog: builder.mutation<void, IClearDialogParams>({
      invalidatesTags: ['Dialogs'],
      query(data){
         return {
            url: '/dialogs/clear',
            method: 'PUT',
            body: data,
            credentials: 'include'
         }
      },
     })
    }),
});

export const { useGetDialogsQuery, useCreateDialogMutation, useClearDialogMutation } = dialogApi;