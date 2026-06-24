import { combineReducers, configureStore } from '@reduxjs/toolkit'
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from 'redux-persist'
import createWebStorage from 'redux-persist/es/storage/createWebStorage'
import searchCacheReducer, { pruneExpired } from '../features/search/searchCacheSlice'
import searchUiReducer from '../features/search/searchUiSlice'

const storage = createWebStorage('local')

if (!storage) {
  throw new Error('redux-persist: localStorage is not available')
}

const persistedSearchCache = persistReducer(
  { key: 'github-search-cache', storage },
  searchCacheReducer,
)

const rootReducer = combineReducers({
  searchUi: searchUiReducer,
  searchCache: persistedSearchCache,
})

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

export const persistor = persistStore(store, null, () => {
  store.dispatch(pruneExpired())
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
