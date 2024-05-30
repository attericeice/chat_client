import { createApi,  fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { Mutex } from 'async-mutex';
import { userSlice } from '../store/redusers/userReducer';
import socket from './socketApi';
import { API_URL } from '../shared/constants';

const baseQuery = fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers) => {
        headers.set('Authorization', `Bearer ${localStorage.getItem('accessToken')}`);
        return headers;
    },
    credentials: 'include'
});

const mutex = new Mutex();

const baseQueryWithReauth : BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
    await mutex.waitForUnlock();
    let result = await baseQuery(args, api, extraOptions);
    if (result.error && result.error.status === 401) {
        if (!mutex.isLocked()) {
            const release = await mutex.acquire();
            try {
               const refreshResult = await baseQuery('/users/token/refresh', api, extraOptions);
               if (refreshResult.data) {
                const {user, accessToken} = refreshResult.data as any;
                api.dispatch(userSlice.actions.login(user));
                localStorage.setItem('accessToken', accessToken);
                result = await baseQuery(args, api, extraOptions);
               }
               else {
                socket.emit('userOffline', localStorage.getItem('accessToken'));
                localStorage.removeItem('accessToken');
                api.dispatch(userSlice.actions.logout());
               }
            }
           finally {
            release();
           }
        }
        else {
            await mutex.waitForUnlock();
            result = await baseQuery(args, api, extraOptions);
        }
    }
    return result;
}

export const api = createApi({
baseQuery: baseQueryWithReauth,
reducerPath: 'api',
endpoints: () => ({}),
tagTypes: ['Profile', 'Dialogs', 'NotificationsCount', 'Account', 'Settings', 'Media', 'ProfileMedia', 'ProfileDocuments', 'ProfileVoices']
});