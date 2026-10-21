import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { enrollDevice, getBaseUrl, getDeviceInfo, setBaseUrl } from '../sync/device';
import { refreshPaquete, triggerSync } from '../sync/service';
import { useStore } from '../state/store';
import { AppText, Button, Card, Field, Screen } from '../ui/components';

/** Configuración del equipo (solo para el encargado): URL de POI, enrolamiento y sincronización. */
export default function Equipo() {
  const [url, setUrl] = useState('');
  const [codigo, setCodigo] = useState('');
  const [info, setInfo] = useState<string>('Sin enrolar');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const init = useStore((s) => s.init);
  const pendientes = useStore((s) => s.pendientes);

  useEffect(() => {
    void (async () => {
      setUrl((await getBaseUrl()) ?? '');
      const d = await getDeviceInfo();
      if (d) setInfo(`Enrolado · ${d.sucursal} (equipo #${d.dispositivoId})`);
    })();
  }, []);

  const run = async (fn: () => Promise<string>) => {
    setBusy(true);
    setMsg(null);
    try {
      setMsg(await fn());
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Ocurrió un error.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="Configuración del equipo" subtitle="Solo para el encargado de la sucursal." footer={<Button label="Volver" variant="secondary" onPress={() => router.back()} />}>
      <Card>
        <AppText variant="bodyStrong">{info}</AppText>
        <AppText variant="small">Evaluaciones pendientes de enviar: {pendientes}</AppText>
      </Card>
      <Field label="URL de POI" value={url} onChangeText={setUrl} autoCapitalize="none" keyboardType="url" placeholder="https://poi.roly.mx/api/evaluacion/v1" />
      <Button label="Guardar URL" variant="secondary" disabled={busy || !url.trim()} onPress={() => run(async () => { await setBaseUrl(url.trim()); return 'URL guardada.'; })} />
      <Field label="Código de enrolamiento" value={codigo} onChangeText={setCodigo} autoCapitalize="characters" placeholder="K7P-29X" />
      <Button
        label="Enrolar este equipo"
        disabled={busy || !codigo.trim()}
        onPress={() => run(async () => {
          const d = await enrollDevice(codigo);
          setInfo(`Enrolado · ${d.sucursal} (equipo #${d.dispositivoId})`);
          await refreshPaquete();
          await init();
          return `Equipo enrolado en ${d.sucursal}.`;
        })}
      />
      <Button
        label="Actualizar evaluaciones"
        variant="secondary"
        disabled={busy}
        onPress={() => run(async () => {
          const r = await refreshPaquete();
          await init();
          return r.estado === 'actualizado' ? 'Evaluaciones actualizadas.' : r.estado === 'sin_cambios' ? 'Ya tienes la versión más reciente.' : r.estado === 'sin_configurar' ? 'Falta configurar POI.' : (r.mensaje ?? 'No se pudo actualizar.');
        })}
      />
      <Button
        label="Enviar pendientes ahora"
        variant="secondary"
        disabled={busy}
        onPress={() => run(async () => {
          const r = await triggerSync();
          await init();
          return r === null ? 'No hay nada pendiente o falta configurar POI.' : r.error ? `No se pudo enviar: ${r.error}` : `Enviado: ${r.eventos} eventos en ${r.lotes} lote(s).`;
        })}
      />
      {msg ? <AppText variant="small" style={{ textAlign: 'center' }}>{msg}</AppText> : null}
    </Screen>
  );
}
