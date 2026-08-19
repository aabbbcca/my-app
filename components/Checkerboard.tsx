import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

export function Checkerboard({ children, style }: ViewProps) {
  const numRows = 20;
  const numCols = 20;

  return (
    <View style={[styles.container, style]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: numRows }).map((_, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {Array.from({ length: numCols }).map((_, colIndex) => {
              const isDark = (rowIndex + colIndex) % 2 === 1;
              return (
                <View
                  key={colIndex}
                  style={{
                    flex: 1,
                    backgroundColor: isDark ? '#DEDEE2' : '#FFFFFF',
                  }}
                />
              );
            })}
          </View>
        ))}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
});
