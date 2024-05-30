import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IUser } from '../../types/User';



interface IUserState {
    user: IUser;
    isAuth: boolean;
    isLoading: boolean;
}

const initialState : IUserState = {
    user: {
      id: '',
      name: '',
      surname: '',
      link: '',
      email: '',
      avatar_img: ''
    },
    isAuth: false,
    isLoading: false,
}


export const userSlice = createSlice({
name: 'user',
initialState,
reducers: {
   login(state, action: PayloadAction<IUser>) {
        state.user = action.payload;
        state.isAuth = true;
   },
   logout(){
     return initialState;
   },
   toggleLoading(state, action: PayloadAction<boolean>) {
     state.isLoading = action.payload;
   },
   update(state, action: PayloadAction<IUser>) {
      state.user = action.payload;
   },
   updateAvatar(state, action: PayloadAction<string>) {
     state.user.avatar_img = action.payload;
   }
}
});

export default userSlice.reducer;