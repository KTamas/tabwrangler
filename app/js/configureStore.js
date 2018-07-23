/* @flow */

import { applyMiddleware, combineReducers, createStore } from 'redux';
import { persistReducer, persistStore } from 'redux-persist';
import { localStorage } from 'redux-persist-webextension-storage';
import localStorageReducer from './reducers/localStorageReducer';
import tempStorageReducer from './reducers/tempStorageReducer';
import thunk from 'redux-thunk';

const localStoragePersistConfig = {
  key: 'localStorage',
  migrate(state) {
    // The first time this code is run there will be no redux-persist version of the state. In that
    // case, return the full contents of storage to be the initial state.
    if (state == null) {
      return new Promise(resolve => {
        chrome.storage.local.get(null, items => {
          // THIS CANNOT BE INTERRUPTED! This is a bit scary, but the full contents of Tab
          // Wrangler's storage is held in memory between removing and resolving the outer Promise.
          // This is necessary to ensure Tab Wrangler doesn't go over its storage limit because
          // during this migration all items are moved to new locations, and without first removing
          // the old location Tab Wrangler would temporarily double its storage usage.
          chrome.storage.local.remove(Object.keys(items), () => {
            resolve(items);
          });
        });
      });
    } else {
      return Promise.resolve(state);
    }
  },
  serialize: false,
  storage: localStorage,
  version: 1,
};

const rootReducer = combineReducers({
  localStorage: persistReducer(localStoragePersistConfig, localStorageReducer),
  tempStorage: tempStorageReducer,
});

export default function() {
  // $FlowFixMe
  const store = createStore(rootReducer, applyMiddleware(thunk));
  return {
    persistor: persistStore(store),
    store,
  };
}
