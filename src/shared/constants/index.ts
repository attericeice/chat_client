export const SOCKET_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:7000' : 'http://ichat-line.ru:7000';
export const API_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:7000/api' : 'http://ichat-line.ru:7000/api';
export const MEDIA_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:7000/media' : 'http://ichat-line.ru:7000/media'; 