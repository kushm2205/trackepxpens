import {configureStore} from '@reduxjs/toolkit';
import authReducer from '../Redux/slice/authSlice';
import groupreducer from '../Redux/slice/GroupSlice';
import friendsReducer from '../Redux/slice/friendslice';
export const store = configureStore({
  reducer: {
    auth: authReducer,
    Group: groupreducer,
    friends: friendsReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
