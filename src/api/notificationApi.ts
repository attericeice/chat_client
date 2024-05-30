import { api }  from '../api';
import socket from './socketApi';
import { INotification } from '../types/Notification';
import { IUser } from '../types/User';


type NotificationRequest = {
    userId: IUser['id'];
    page: number;
    sort: 'ASC' | 'DESC';
}

type NotificationResponse = {
    rows: INotification[];
    count: number;
}

const notificationApi = api.injectEndpoints({
    overrideExisting: false,
    endpoints: builder => ({
        getNotificationCount: builder.query<number, IUser['id']>({
        providesTags: ['NotificationsCount'],
        query: (userId) => `/notifications/user/${userId}/count`,
        async onCacheEntryAdded(arg, {cacheDataLoaded, cacheEntryRemoved, updateCachedData}){
          const incrementCount = (count : number) => {
            updateCachedData(draft => draft + count);
          }
          const decrementCount = (count : number) => {
            updateCachedData(draft => draft - count);
          }
          try {
            await cacheDataLoaded;
            socket.on('incrementNotification', incrementCount);
            socket.on('decrementNotification', decrementCount);
          }
          catch(error) {
            console.log(error);
          }
          await cacheEntryRemoved;
          socket.off('incrementNotification', incrementCount);
          socket.off('decrementNotification', decrementCount);
        }
        }),
        getNotifications: builder.query<NotificationResponse, NotificationRequest>({
          query: ({userId, page, sort}) => `/notifications/user/${userId}?page=${page}&sort=${sort}`,
          serializeQueryArgs({endpointName}) {
            return endpointName
          },
          merge(currentCache, newNotifications, {arg}){
             if (arg.page === 0) {
                return newNotifications;
             }
             currentCache.count = newNotifications.count;
             currentCache.rows.push(...newNotifications.rows);
             return currentCache;
          },
          async onCacheEntryAdded(arg, {cacheDataLoaded, cacheEntryRemoved, updateCachedData}) {
               const addNotification = (notification: INotification) => {
                 updateCachedData(draft => {
                  draft.rows.unshift(notification);
                  draft.count = draft.count + 1;
                  return draft;
                 });
               }
               const removeNotification = (removedNotifications : number[]) => {
                updateCachedData(draft => {
                   const rows = draft.rows.filter(n => !removedNotifications.includes(n.id));
                   const count = draft.count - removedNotifications.length;
                   return {rows, count};
                });
             }
               try {
                await cacheDataLoaded;
                socket.on('newNotification', addNotification);
                socket.on('removeNotifications', removeNotification);
               }
               catch(error) {
                console.log(error);
               }
               await cacheEntryRemoved;
               socket.off('newNotification', addNotification);
               socket.off('removeNotifications', removeNotification);
          },
        }),
    })
});


export const {
  useGetNotificationCountQuery, 
  useGetNotificationsQuery, 
} = notificationApi;