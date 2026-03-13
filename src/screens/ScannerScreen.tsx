import React, {useEffect, useRef, useState} from 'react';
import {
  Alert,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';
import {RootStackParamList} from '../navigation/types';
import {parseUpiQrData} from '../utils/upiParser';

type Props = NativeStackScreenProps<RootStackParamList, 'Scanner'>;

export const ScannerScreen = ({navigation}: Props) => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const hasScannedRef = useRef(false);
  const device = useCameraDevice('back');

  useEffect(() => {
    const requestPermission = async () => {
      const status = await Camera.requestCameraPermission();
      setPermissionGranted(status === 'granted');
    };

    requestPermission().catch(() => {
      setPermissionGranted(false);
    });
  }, []);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: codes => {
      if (hasScannedRef.current || codes.length === 0) {
        return;
      }

      const value = codes[0].value;

      if (!value) {
        return;
      }

      const parsed = parseUpiQrData(value);

      if (!parsed) {
        Alert.alert(
          'Unsupported QR',
          'Please scan a valid UPI payment QR code.',
        );
        return;
      }

      hasScannedRef.current = true;
      navigation.navigate('Payment', {scannedData: parsed});
    },
  });

  if (!permissionGranted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Camera Access Needed</Text>
        <Text style={styles.subtitle}>
          Enable camera permission to scan UPI QR codes.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => Linking.openSettings()}>
          <Text style={styles.buttonText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centered}>
        <Text style={styles.subtitle}>Camera device not available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        codeScanner={codeScanner}
      />
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>
          Align the UPI QR code inside the frame
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f4f7fb',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#115e59',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: 'center',
  },
  overlayText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
  },
});
