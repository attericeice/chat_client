import io from 'socket.io-client';
import { SOCKET_URL } from '../shared/constants';

const socket = io(SOCKET_URL, {
    autoConnect: false,
    withCredentials: true,
    extraHeaders: {
        accessToken: localStorage.getItem('accessToken') ?? 'invalid'
    }
});

export default socket;