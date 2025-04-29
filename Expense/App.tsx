import React, {useEffect} from 'react';
import {StyleSheet, SafeAreaView} from 'react-native';
import {Provider} from 'react-redux';
import {store} from './src/Redux/store';
import AppContent from './src/Navigation/Stacknavigation';
const App: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Provider store={store}>
        <AppContent />
      </Provider>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
