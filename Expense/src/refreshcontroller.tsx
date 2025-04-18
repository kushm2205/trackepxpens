// src/components/RefreshableScrollView.tsx
import React, {useState, ReactNode} from 'react';
import {ScrollView, RefreshControl, StyleSheet, ViewStyle} from 'react-native';

interface RefreshableScrollViewProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

const RefreshableScrollView: React.FC<RefreshableScrollViewProps> = ({
  children,
  onRefresh,
  style,
  contentContainerStyle,
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      style={[styles.scrollView, style]}
      contentContainerStyle={contentContainerStyle}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#007AFF']} // iOS and Android refresh spinner color
          tintColor="#007AFF" // iOS refresh spinner color
        />
      }>
      {children}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
});

export default RefreshableScrollView;
