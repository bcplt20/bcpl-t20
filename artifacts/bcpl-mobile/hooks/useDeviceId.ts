import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

function generateFallbackUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        let id = await AsyncStorage.getItem('bcpl_device_v1');
        if (!id) {
          id = generateFallbackUUID();
          await AsyncStorage.setItem('bcpl_device_v1', id);
        }
        setDeviceId(id);
      } catch (e) {
        setDeviceId(generateFallbackUUID());
      }
    }
    init();
  }, []);

  return deviceId;
}
