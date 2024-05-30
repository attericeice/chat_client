import userReducer from "./redusers/userReducer";
import themeReducer from "./redusers/themeReducer";
import { api } from "../api";

import { combineReducers, configureStore } from "@reduxjs/toolkit";

const rootReducer = combineReducers({
 userReducer,
 themeReducer,
 [api.reducerPath]: api.reducer,
});


export const setupStore = () => configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => {
        return getDefaultMiddleware().concat([api.middleware]);
    }
});
  

export type RootState = ReturnType<typeof rootReducer>

export type AppStore = ReturnType<typeof setupStore>

export type AppDispatch = AppStore['dispatch'];