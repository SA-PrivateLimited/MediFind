import React, {useEffect} from 'react';
import {StatusBar, Platform} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Navigation from './src/navigation';
import {useStore} from './src/store';

const App = () => {
  const {isDarkMode, hydrate} = useStore();

  useEffect(() => {
    // Hydrate store from AsyncStorage on app start
    hydrate();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#1A202C' : '#F5F7FA'}
      />
      <Navigation />
    </SafeAreaProvider>
  );
};

export default App;
