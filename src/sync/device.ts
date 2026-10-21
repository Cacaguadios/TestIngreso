import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createApi } from './api';

const K_TOKEN = 'poi.token';
const K_INFO = 'poi.dispositivo';
const K_URL = 'poi.url';

export interface DeviceInfo {
  dispositivoId: number;
  sucursalId: number;
  sucursal: string;
}

export const getToken = () => SecureStore.getItemAsync(K_TOKEN);

export async function getDeviceInfo(): Promise<DeviceInfo | null> {
  const raw = await SecureStore.getItemAsync(K_INFO);
  return raw ? (JSON.parse(raw) as DeviceInfo) : null;
}

export async function getBaseUrl(): Promise<string | null> {
  return (await SecureStore.getItemAsync(K_URL)) ?? process.env.EXPO_PUBLIC_POI_URL ?? null;
}

export const setBaseUrl = (url: string) => SecureStore.setItemAsync(K_URL, url.replace(/\/+$/, ''));

/** API ligada al token y URL guardados. Devuelve null si el equipo no está configurado. */
export async function getApi() {
  const baseUrl = await getBaseUrl();
  if (!baseUrl) return null;
  return createApi({ baseUrl, getToken });
}

/** Enrola este teléfono (una sola vez, lo hace un administrador). */
export async function enrollDevice(codigoEnrolamiento: string): Promise<DeviceInfo> {
  const baseUrl = await getBaseUrl();
  if (!baseUrl) throw new Error('Falta la URL de POI.');
  const api = createApi({ baseUrl, getToken });
  const r = await api.enrolar({
    codigoEnrolamiento: codigoEnrolamiento.trim().toUpperCase(),
    modelo: Device.modelName ?? Platform.OS,
    androidId: Application.getAndroidId?.() ?? 'desconocido',
    appVersion: Application.nativeApplicationVersion ?? '0.0.0',
  });
  const info: DeviceInfo = { dispositivoId: r.dispositivoId, sucursalId: r.sucursalId, sucursal: r.sucursal };
  await SecureStore.setItemAsync(K_TOKEN, r.token);
  await SecureStore.setItemAsync(K_INFO, JSON.stringify(info));
  return info;
}
