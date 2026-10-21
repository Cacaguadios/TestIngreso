import type { Paquete } from '../engine/schema';
import { SAMPLE_EVALUATION } from './sample-evaluation';

/** Paquete de ejemplo para desarrollar sin POI. Se reemplaza al descargar el real. */
export const SAMPLE_PAQUETE: Paquete = {
  version: 'ejemplo-0',
  puestos: [
    { id: 1, nombre: 'Vendedor', evaluacionVersionId: SAMPLE_EVALUATION.versionId },
    { id: 2, nombre: 'Repartidor', evaluacionVersionId: SAMPLE_EVALUATION.versionId },
    { id: 3, nombre: 'Promotor', evaluacionVersionId: SAMPLE_EVALUATION.versionId },
    { id: 4, nombre: 'Administrativo', evaluacionVersionId: SAMPLE_EVALUATION.versionId },
  ],
  sucursales: [{ id: 4, nombre: 'Puebla Centro' }],
  evaluaciones: [SAMPLE_EVALUATION],
};

/** Sucursal del equipo mientras no haya enrolamiento real. */
export const SAMPLE_SUCURSAL = { id: 4, nombre: 'Puebla Centro' };
