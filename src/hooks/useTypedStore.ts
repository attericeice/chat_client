import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { AppDispatch, AppStore, RootState } from '../store';

export const useTypedDispatch = () => useDispatch<AppDispatch>();

export const useTypedSelector : TypedUseSelectorHook<RootState> = useSelector;