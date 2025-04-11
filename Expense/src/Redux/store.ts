// store.ts
import {configureStore} from '@reduxjs/toolkit';
import authReducer from '../Redux/slice/authSlice';
import groupreducer from '../Redux/slice/GroupSlice';
import friendsReducer from '../Redux/slice/friendslice';
import friendExpensesReducer from '../Redux/slice/expnseSlice'; // Corrected import

export const store = configureStore({
  reducer: {
    auth: authReducer,
    group: groupreducer,
    friends: friendsReducer,
    friendExpenses: friendExpensesReducer, // Corrected reducer name
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
