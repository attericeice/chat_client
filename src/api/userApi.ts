import { api } from '../api';
import { 
IUser, 
IProfile, 
IUserSearch, 
UserContactRequest, 
UserContact, 
UserSettings, 
UserMedia, 
IFullUser,
UserInformation, 
BlackList
} from '../types/User';
import { userSlice } from '../store/redusers/userReducer';
import socket from './socketApi';
import { IMessage, MessageAttachment } from '../types/Message';


export interface ILoginInput {
    email: string;
    password: string;
}

export interface IGenericAuthResponse {
    user: IUser;
    accessToken: string;
    refreshToken: string;
}

interface IProfileRequest {
    link: IUser['link'],
    currentUserId: IUser['id'];
}

type GetUserSearchParams = {
    search: string;
    userId: string | number;
    page: number;
}

type SearchContactsResponse = {
    count: number;
    rows: IUserSearch[];
}

type AccountUpdateData = {
    user: Omit<IFullUser, 'id' | 'password' | 'createdAt' | 'updatedAt'>,
    passwordData?: {
        currentPassword: string;
        newPassword: string;
    }
    user_information?: Omit<UserInformation, 'id'>;
}

 const userApi = api.injectEndpoints({
    overrideExisting: false,
    endpoints: (builder) => ({
     login: builder.mutation<IGenericAuthResponse, ILoginInput>({
        query(data) {
            return {
                url: '/users/login',
                method: 'POST',
                body: data,
                credentials: 'include',
                headers: {"Cache-Control": "no-cache"}
            }
        },
        async onQueryStarted(args, {dispatch, queryFulfilled}) {
            try {
               dispatch(userSlice.actions.toggleLoading(true));
               const { data } = await queryFulfilled;
               dispatch(userSlice.actions.login(data.user));
               localStorage.setItem('accessToken', data.accessToken);
               dispatch(userSlice.actions.toggleLoading(false));
               socket.emit('userOnline', data.user);
            }
            catch(error){
              console.log(error);
            }
        }
     }),
     registration: builder.mutation<IGenericAuthResponse, Partial<ILoginInput&{name: string; surname: string;}>>({
        query(data){
            return {
                url: '/users/registration',
                method: 'POST',
                body: data,
                credentials: 'include',
            }
        },
        async onQueryStarted(args, {dispatch, queryFulfilled}){
            try {
              dispatch(userSlice.actions.toggleLoading(true));
              const { data } = await queryFulfilled;
              dispatch(userSlice.actions.login(data.user));
              localStorage.setItem('accessToken', data.accessToken);
              dispatch(userSlice.actions.toggleLoading(false));
              socket.emit('userOnline', data.user);
            }
            catch(error) {
                console.log(error);
            }
        },
     }),
     logout: builder.mutation<void, void>({
       query: () => ({
        url: '/users/logout',
        method: 'POST',
       }),
       async onQueryStarted(_, {dispatch, queryFulfilled}){
        try {
            await queryFulfilled;
            dispatch(userSlice.actions.logout());
            socket.emit('userOffline', localStorage.getItem('accessToken'));
            localStorage.removeItem('accessToken');
        }
        catch(error) {
            console.log(error);
        }
       },
     }),
     refresh: builder.query<IGenericAuthResponse, void>({
        query: () => {
        return {
            url: '/users/token/refresh',
            credentials: 'include',
            headers: {"Cache-Control": "no-cache"}
        }
    },
        async onQueryStarted(args, {dispatch, queryFulfilled}){
           try{
            dispatch(userSlice.actions.toggleLoading(true));
            const { data } = await queryFulfilled;
            dispatch(userSlice.actions.login(data.user));
            localStorage.setItem('accessToken', data.accessToken);
            dispatch(userSlice.actions.toggleLoading(false));
            socket.emit('userOnline', data.user);
           }
           catch(error) {
            console.log(error);
            localStorage.removeItem('accessToken');
           }
        },
     }),
     getProfile: builder.query<IProfile, IProfileRequest>({
        providesTags: (result, error, arg) => {
            if (result) {
                return [{type: 'Profile', id: Number(result.id)}]
            }
            return ['Profile'];
        },
        query: ({link}) => {
            return {
                url: `/users/profile/${link}`,
                credentials: 'include'
            }
        },
        async onCacheEntryAdded(arg, {updateCachedData, cacheDataLoaded, cacheEntryRemoved}) {
            const removeContactRequest = (contactRequest : UserContactRequest) => {
            if (Number(arg.currentUserId) !== contactRequest.senderId && Number(arg.currentUserId) !== contactRequest.userId) return;
            updateCachedData(draft => {
                const {sentRequest, receiverRequest} = draft;
                if (receiverRequest.length && receiverRequest[0].id === contactRequest.id) {
                    draft.receiverRequest = [];
                }
                else if (sentRequest.length && sentRequest[0].id === contactRequest.id) {
                    draft.sentRequest = []
                }
            })
            }

            const confirmContactRequest = (createdContact: UserContact) => {
                if (Number(arg.currentUserId) !== createdContact.contactId && Number(arg.currentUserId) !== createdContact.userId) return;
                updateCachedData(draft => {
                    draft.isContact = true;
                    draft.receiverRequest = [];
                    draft.sentRequest = [];
                });
            }

            const sendContactRequest = ({type, contactRequest} : {
            type: 'sentRequest' | 'receiverRequest', 
            contactRequest: UserContactRequest}) => {
                if (Number(arg.currentUserId) !== contactRequest.senderId && Number(arg.currentUserId) !== contactRequest.userId) return;
                updateCachedData(draft => {
                   if (type === 'sentRequest') {
                    draft.sentRequest.push(contactRequest);
                   }
                   else {
                    draft.receiverRequest.push(contactRequest);
                   }
                })
            }

            const removeContact = ({userId, contactId} : {userId: number, contactId: number}) => {
                if (Number(arg.currentUserId) !== userId && Number(arg.currentUserId) !== contactId) return;
                updateCachedData(draft => {
                 draft.isContact = false;
                 draft.receiverRequest = [];
                 draft.sentRequest = [];
                });
            }

            const onUserOnline = () => {
                updateCachedData(draft => {
                    draft.status = 'online';
                    return draft;
                })
            }
            const onUserOffline = () => {
                updateCachedData(draft => {
                    draft.status = 'offline';
                    return draft;
                })
            }

            const onBlackListBanned = (blacklist : BlackList) => {
               if (Number(arg.currentUserId) === blacklist.senderId) {
                updateCachedData(draft => {
                    draft.blacklist_banned.push(blacklist);
                    return draft;
                })
               }
            }

            const onBlackListSender = (blacklist : BlackList) => {
               if (Number(arg.currentUserId) === blacklist.bannedId) {
                updateCachedData(draft => {
                    draft.blacklist_sender.push(blacklist);
                    return draft;
                })
               }
            }

            const removeBlackListSender = (blacklist: BlackList) => {
                if (Number(arg.currentUserId) === blacklist.bannedId) {
                    updateCachedData(draft => {
                        draft.blacklist_sender = [];
                        return draft;
                    })
                }
            }

            const removeBlackListBanned = (blacklist: BlackList) => {
                if (Number(arg.currentUserId) === blacklist.senderId) {
                    updateCachedData(draft => {
                        draft.blacklist_banned = [];
                        return draft;
                    })
                }
            }

            try {
                await cacheDataLoaded;
                socket.on('removeContactRequest', removeContactRequest);
                socket.on('confirmContactRequest', confirmContactRequest);
                socket.on('sendContactRequest', sendContactRequest);
                socket.on('removeContact', removeContact);
                socket.on('userOnlineProfile', onUserOnline);
                socket.on('userOfflineProfile', onUserOffline);
                socket.on('addBlackListBanned', onBlackListBanned);
                socket.on('addBlackListSender', onBlackListSender);
                socket.on('removeBlackListSender', removeBlackListSender);
                socket.on('removeBlackListBanned', removeBlackListBanned);
            }
            catch(error) {
                console.log(error);
            }
            await cacheEntryRemoved;
            socket.off('removeContactRequest', removeContactRequest);
            socket.off('confirmContactRequest', confirmContactRequest);
            socket.off('sendContactRequest', sendContactRequest);
            socket.off('removeContact', removeContact);
            socket.off('userOnlineProfile', onUserOnline);
            socket.off('userOfflineProfile', onUserOffline);
            socket.off('addBlackListBanned', onBlackListBanned);
            socket.off('addBlackListSender', onBlackListSender);
            socket.off('removeBlackListSender', removeBlackListSender);
            socket.off('removeBlackListBanned', removeBlackListBanned);
        },
     }),
     getProfileDialogMedia: builder.query<MessageAttachment[], string>({
        providesTags: (result, error, args) => {
            if (result) {
                return [{type: 'ProfileMedia', id: args}]
            }
            return ['ProfileMedia']
        },
        query: (link) => `/users/profile/${link}/media`,
     }),
     getProfileDialogDocuments: builder.query<MessageAttachment[], string>({
        providesTags: (result, error, args) => {
            if (result) {
                return [{type: 'ProfileDocuments', id: args}]
            }
            return ['ProfileDocuments']
        },
        query: (link) => `users/profile/${link}/documents`,
     }),
     getProfileDialogVoices: builder.query<IMessage[], string>({
        providesTags: (result, error, args) => {
            if (result) {
                return [{type: 'ProfileVoices', id: args}]
            }
            return ['ProfileVoices'];
        }, 
        query: (link) => `/users/profile/${link}/voices`,
     }),
     getSelfProfile: builder.query<IFullUser, void>({
        providesTags: ['Account'],
        query: () => '/users/settings/profile',
     }),
     getSelfSettings: builder.query<UserSettings, void>({
        providesTags: ['Settings'],
        query: () => 'users/settings/self',
     }),
     getSelfMedia: builder.query<UserMedia[], void>({
        providesTags: ['Media'],
        query: () => 'users/media/self',
     }),
     getBlackList: builder.query<BlackList[], void>({
        query: () => 'users/blacklist/self',
        async onCacheEntryAdded(_, {updateCachedData, cacheDataLoaded, cacheEntryRemoved}){
            const onAddBlackList = (blacklist : BlackList) => {
                updateCachedData(draft => {
                    draft.push(blacklist);
                    return draft;
                });
            }
            const removeBlackList = (blacklistId : BlackList['id']) => {
                updateCachedData(draft => {
                   return draft.filter(item => item.id !== blacklistId);
                });
            }
            try {
              await cacheDataLoaded;
              socket.on('addBlackListSelf', onAddBlackList);
              socket.on('removeBlackListSelf', removeBlackList);
            }
            catch(e) {
                console.log(e);
            }
            await cacheEntryRemoved;
            socket.off('addBlackListSelf', onAddBlackList);
            socket.off('removeBlackListSelf', removeBlackList);
        },
     }),
     updateAccount: builder.mutation<IFullUser, AccountUpdateData>({
        invalidatesTags: (result, error, args) => ['Account', {type: 'Profile', id: Number(result?.id)}],
        query: (accountData) => ({
            url: '/users/settings/profile/update',
            method: 'PUT',
            body: accountData,
        }),
        async onQueryStarted(args, {dispatch, queryFulfilled}) {
            try {
               const { data } = await queryFulfilled;
               const { id, name, surname, link, avatar_img, email } = data;
               dispatch(userSlice.actions.update({id, name, surname, link, avatar_img, email}))
            }
            catch (e) {
                console.log(e);
            }
        },
     }),
     updateAvatar: builder.mutation<string, FormData>({
        invalidatesTags: (result, error, args) => {
            const userId = args.get('userId');
            if (typeof userId === 'string' && userId !== '') {
                return ['Account', {type: 'Profile', id: Number(userId)}, 'Media'];
            }
            return ['Account', 'Media'];
        },
        query: (data) => ({
            url: '/users/avatar/update',
            method: 'PUT',
            body: data,
        }),
        async onQueryStarted(args, {dispatch, queryFulfilled}) {
            try {
               const { data } = await queryFulfilled;
               dispatch(userSlice.actions.updateAvatar(data));
            }
            catch (e) {
                console.log(e);
            }
        },
     }),
     updateBanner: builder.mutation<string, FormData>({
        invalidatesTags: (result, error, args) => {
            const userId = args.get('userId');
            if (typeof userId === 'string' && userId !== '') {
                return ['Account', {type: 'Profile', id: Number(userId)}];
            }
            return ['Account'];
        },
        query: (bannerData) => ({
            url: '/users/banner/update',
            method: 'PUT',
            body: bannerData,
        }),
     }),
     removeMedia: builder.mutation<UserMedia['id'], Pick<UserMedia, 'id' | 'userId' | 'src'>>({
        invalidatesTags: (result, error, args) => ['Media', {type: 'Profile', id: args.userId}],
        query: ({userId, id, src}) => ({
            url: `/users/media/delete?mediaId=${id}&userId=${userId}&source=${src}`,
            method: 'DELETE'
        }),
     }),
     addMedia: builder.mutation<UserMedia, FormData>({
        invalidatesTags: (result, error, args) => {
           const userId = args.get('userId');
           if (typeof userId === 'string' && userId !== '') {
             return ['Media', {type: 'Profile', id: Number(userId)}]
           }
           return ['Media'];
        },
        query: (media) => ({
            url: '/users/media/add',
            method: 'POST',
            body: media,
        }),
        async onQueryStarted(args, {queryFulfilled, dispatch }) {
              try {
                const response = await queryFulfilled;
                if (response && response.data.isAvatar) {
                    dispatch(userSlice.actions.updateAvatar(response.data.src));
                    dispatch(api.util.invalidateTags(['Account']));
                }
              }
              catch(e) {
                console.log(e);
              }
        },
     }),
     addAttachmentMedia: builder.mutation<UserMedia, Omit<UserMedia, 'id'>>({
        invalidatesTags: (result, error, args) => ['Media', {type: 'Profile', id: args.userId}],
        query: (userMedia) => ({
            url: 'users/media/add-from-attachments',
            method: 'POST',
            body: userMedia
        }),
     }),
     updateSettings: builder.mutation<UserSettings, Omit<UserSettings, 'id'>>({
       invalidatesTags: ['Settings'],
       query: (userSettings) => ({
        url: '/users/settings/update',
        method: 'PUT',
        body: userSettings
       }),
     }),
     getUserContacts: builder.query<UserContact[], IUser['id']>({
       query: (userId) => `users/${userId}/contacts`,
       async onCacheEntryAdded(arg, {cacheDataLoaded, cacheEntryRemoved, updateCachedData}) {
         const addContact = (contact: UserContact) => {
            if (Number(arg) !== contact.contactId && Number(arg) !== contact.userId) return;
            updateCachedData(draft => {
                draft.push(contact);
                return draft;
            });
         }
         const removeContact = ({userId, contactId} : UserContact) => {
            updateCachedData(draft => {
                const filteredIds = [userId, contactId];
                return draft.filter(contact => !filteredIds.includes(contact.userId) || !filteredIds.includes(contact.contactId));
            });
         }
         try {
            await cacheDataLoaded;
            socket.emit('join', `contacts/${arg}`);
            socket.on('addContact', addContact);
            socket.on('removeHeaderContact', removeContact);
         }
         catch(error) {
            console.log(error);
         }
         await cacheEntryRemoved;
         socket.emit('leave', `contacts/${arg}`);
         socket.off('addContact', addContact);
         socket.off('removeHeaderContact', removeContact);
       }
     }),
     getSelfContactRequests: builder.query<UserContactRequest[], IUser['id']>({
        query: (userId) => `/users/${userId}/contact_requests/self`,
        async onCacheEntryAdded(arg, {cacheDataLoaded, cacheEntryRemoved, updateCachedData}) {
            const addSelfRequest = (contactRequest: UserContactRequest) => {
                updateCachedData(draft => {
                    draft.push(contactRequest);
                    return draft;
                });
            }
            const removeSelfRequest = (contactRequest: UserContactRequest) => {
                updateCachedData(draft => {
                    draft = draft.filter(request => request.id !== contactRequest.id);
                    return draft;
                });
            }
            const onRequestBlackList = ({senderId, bannedId} : {senderId : number, bannedId : number}) => {
                updateCachedData(draft => {
                   const ids = [senderId, bannedId];
                   const newDraft = draft.filter(r => !ids.includes(Number(r.senderId)) || !ids.includes(Number(r.userId)));
                   return newDraft;
                });
           }
            try {
              await cacheDataLoaded;
              socket.emit('join', `contact_request/self/${arg}`);
              socket.on('addSelfRequest', addSelfRequest);
              socket.on('removeSelfRequest', removeSelfRequest);
              socket.on('requestBlacklistSelf', onRequestBlackList);
            }
            catch(error) {
                console.log(error);
            }
            await cacheEntryRemoved;
            socket.emit('leave', `contact_request/self/${arg}`);
            socket.off('addSelfRequest', addSelfRequest);
            socket.off('removeSelfRequest', removeSelfRequest);
            socket.off('requestBlacklistSelf', onRequestBlackList);
        }
     }),
     getOtherContactRequests: builder.query<UserContactRequest[], IUser['id']>({
        query: (userId) => `/users/${userId}/contact_requests/other`,
        async onCacheEntryAdded(arg, {cacheDataLoaded, cacheEntryRemoved, updateCachedData}) {
            const addOtherRequest = (contactRequest: UserContactRequest) => {
                updateCachedData(draft => {
                    draft.push(contactRequest);
                    return draft;
                });
            }
            const removeOtherRequest = (contactRequest: UserContactRequest) => {
                updateCachedData(draft => {
                    draft = draft.filter(request => request.id !== contactRequest.id);
                    return draft;
                });
            }

            const onRequestBlackList = ({senderId, bannedId} : {senderId : number, bannedId : number}) => {
                updateCachedData(draft => {
                   const ids = [senderId, bannedId];
                   const newDraft = draft.filter(r => !ids.includes(Number(r.senderId)) || !ids.includes(Number(r.userId)));
                   return newDraft;
                });
           }
            try {
              await cacheDataLoaded;
              socket.emit('join', `contact_request/other/${arg}`);
              socket.on('addOtherRequest', addOtherRequest);
              socket.on('removeOtherRequest', removeOtherRequest);
              socket.on('requestBlacklistOther', onRequestBlackList);
            }
            catch(error) {
                console.log(error);
            }
            await cacheEntryRemoved;
            socket.emit('leave', `contact_request/other/${arg}`);
            socket.off('addOtherRequest', addOtherRequest);
            socket.off('removeOtherRequest', removeOtherRequest);
            socket.off('requestBlacklistOther', onRequestBlackList);
        }
     }),
     getUserSearch: builder.query<SearchContactsResponse, GetUserSearchParams>({
        query: ({search, userId, page}) => `/users/${userId}/contacts/search/${search}?page=${page}`,
        serializeQueryArgs: ({endpointName}) => {
            return endpointName;
          },
          merge: (cache, newContacts, {arg}) => {
            if (arg.page === 0) {
                return newContacts;
            } 
            cache.rows.push(...newContacts.rows);
            return cache;
          },
          forceRefetch({previousArg, currentArg}){
             return previousArg !== currentArg;
          },
        async onCacheEntryAdded(arg, {cacheDataLoaded, cacheEntryRemoved, updateCachedData}) {
            const removeContactRequest = ({contactRequest, type}: {
                contactRequest: UserContactRequest, 
                type: 'self' | 'other'}) => {
                    updateCachedData(draft => {
                    const field = type === 'self' ? 'receiverRequest' : 'sentRequest';
                    const contactIndex = draft.rows.findIndex(c => c[field].length && c[field][0].id === contactRequest.id);
                    if (contactIndex >= 0) {
                        draft.rows[contactIndex][field] = [];
                    }
                        return draft;
                     });
            }
            const confirmContactRequest = (createdContact : UserContact) => {
               updateCachedData(draft => {
                const contactIndex = draft.rows.findIndex(c => c.id === createdContact.userId || c.id === createdContact.contactId);
                if (contactIndex >= 0) {
                draft.rows[contactIndex].user_contacts[0] = createdContact;
                draft.rows[contactIndex].sentRequest = [];
                draft.rows[contactIndex].receiverRequest = [];
                }
                return draft;
               })
            }
            const sendContactRequest = ({contactRequest, type}: {
                contactRequest : UserContactRequest, 
                type: 'sentRequest' | 'receiverRequest'}) => {
                updateCachedData(draft => {
                const contactIndex = draft.rows.findIndex(c => c.id === contactRequest.userId || c.id === contactRequest.senderId);
                if (type === 'sentRequest') {
                    draft.rows[contactIndex].receiverRequest[0] = contactRequest;
                  }
                else {
                    draft.rows[contactIndex].sentRequest[0] = contactRequest;
                }
                });
            }

            const removeContact = ({userId, contactId} : Pick<UserContact, 'userId' | 'contactId'>) => {
                const ids = [userId, contactId];
                updateCachedData(draft => {
                   const contactIndex = draft.rows.findIndex(c => c.user_contacts.length && ids.includes(c.user_contacts[0].userId)
                   && ids.includes(c.user_contacts[0].contactId)
                   );
                   if (contactIndex >= 0) {
                    draft.rows[contactIndex].user_contacts = [];
                   }
                   return draft;
                });
            }
            const removeSearchItem = ({senderId, bannedId} : {senderId : number; bannedId: number}) => {
                const ids = [senderId, bannedId];
                updateCachedData(draft => {
                   const rows = draft.rows.filter(u => !ids.includes(Number(u.id)));
                   const count = draft.count - (draft.count - rows.length);
                   return {count, rows};
                });
            }

            const removeSearchBlackList = (bannedId : number) => {
                console.log(bannedId);
                updateCachedData(draft => {
                    const contactIndex = draft.rows.findIndex(c => c.id === bannedId);
                    if (contactIndex >= 0) {
                        draft.rows[contactIndex].blacklist_banned = [];
                    }
                    return draft;
                })
            }

            const addSearchBlackList = (blacklist : BlackList) => {
                updateCachedData(draft => {
                    const contactIndex = draft.rows.findIndex(c => c.id === blacklist.bannedId);
                    if (contactIndex >= 0) {
                        draft.rows[contactIndex].blacklist_banned.push(blacklist);
                    }
                    return draft;
                })
            }
            
            try {
                await cacheDataLoaded;
                socket.emit('join', `search/${arg.userId}`);
                socket.on('removeSearchRequest', removeContactRequest);
                socket.on('confirmSearchRequest', confirmContactRequest);
                socket.on('removeSearchContact', removeContact);
                socket.on('sendSearchRequest', sendContactRequest);
                socket.on('addSearchBlackList', addSearchBlackList);
                socket.on('removeSearchBlackList', removeSearchBlackList);
                socket.on('removeSearchItem', removeSearchItem);
            }
            catch(error) {
                console.log(error);
            }
            await cacheEntryRemoved;
            socket.emit('leave', `search/${arg.userId}`);
            socket.off('removeSearchRequest', removeContactRequest);
            socket.off('confirmSearchRequest', confirmContactRequest);
            socket.off('removeSearchContact', removeContact);
            socket.off('sendSearchRequest', sendContactRequest);
            socket.off('addSearchBlackList', addSearchBlackList);
            socket.off('removeSearchBlackList', removeSearchBlackList);
            socket.off('removeSearchItem', removeSearchItem);
        }
     })
    }),

});

export const { 
    useLoginMutation, 
    useRegistrationMutation,
    useLogoutMutation, 
    useRefreshQuery, 
    useLazyRefreshQuery,
    useGetProfileQuery,
    useGetProfileDialogMediaQuery,
    useGetProfileDialogDocumentsQuery,
    useGetProfileDialogVoicesQuery,
    useGetUserContactsQuery,
    useGetOtherContactRequestsQuery,
    useGetSelfContactRequestsQuery,
    useGetUserSearchQuery,
    useGetSelfProfileQuery,
    useGetSelfMediaQuery,
    useGetSelfSettingsQuery,
    useGetBlackListQuery,
    useUpdateAccountMutation,
    useUpdateAvatarMutation,
    useUpdateSettingsMutation,
    useUpdateBannerMutation,
    useRemoveMediaMutation,
    useAddMediaMutation,
    useAddAttachmentMediaMutation,
} = userApi;