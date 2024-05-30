import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Theme = 'light' | 'dark';


interface IThemeState {
    theme: Theme;
}

const initialTheme : Theme = localStorage.getItem('theme') as Theme ?? 'light';


const initialState : IThemeState = {
    theme: initialTheme,
}

export const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
    toggleTheme(state, action : PayloadAction<void>) {
       const theme : Theme = state.theme === 'light' ? 'dark' : 'light';
       state.theme = theme;
       localStorage.setItem('theme', theme);
    }
    }
});

export default themeSlice.reducer;