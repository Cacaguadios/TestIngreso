/**
 * Validación del paquete que baja de POI. Si POI manda una tarea mal formada,
 * se rechaza aquí en vez de fallar a media evaluación.
 */
import { z } from 'zod';
import type { Cond } from './types';

export const CondSchema = z.lazy((): z.ZodType<Cond> =>
  z.union([
    z.object({ todas: z.array(CondSchema).min(1) }),
    z.object({ alguna: z.array(CondSchema).min(1) }),
    z.object({ no: CondSchema }),
    z.object({ visito: z.string().min(1) }),
    z.object({ evento: z.string().min(1) }),
    z.object({ estado: z.string().min(1), contiene: z.string() }),
    z.object({ estado: z.string().min(1), existe: z.boolean() }),
    z.object({ estado: z.string().min(1), igual: z.unknown() }).refine((o) => 'igual' in o),
  ]) as unknown as z.ZodType<Cond>,
);

const HitoSchema = z.object({ id: z.string().min(1), peso: z.number().min(0).max(1), cuando: CondSchema });

export const TaskDefinitionSchema = z
  .object({
    codigo: z.string().min(1),
    version: z.number().int().positive(),
    titulo: z.string().min(1),
    instruccion: z.string().min(1),
    categoria: z.string(),
    nivel: z.number().int().min(1),
    practica: z.boolean().optional(),
    estadoInicial: z.record(z.string(), z.unknown()).optional(),
    exito: CondSchema,
    hitos: z.array(HitoSchema).optional(),
    pasosOptimos: z.number().int().positive(),
    rutasValidas: z.array(z.array(z.string().min(1)).min(1)).min(1),
    acciones: z.object({ error: z.array(z.string()).optional(), neutras: z.array(z.string()).optional() }).optional(),
    ayudas: z.array(z.string().min(1)),
    mostrarme: z.string().optional(),
    tiempoReferenciaSeg: z.number().positive(),
    tiempoLimiteSeg: z.number().positive().nullable(),
  })
  .refine((t) => (t.hitos ?? []).reduce((a, h) => a + h.peso, 0) < 1, {
    message: 'Los pesos de los hitos deben sumar menos de 1 (el resto es el éxito final).',
    path: ['hitos'],
  })
  .refine((t) => t.tiempoLimiteSeg === null || t.tiempoLimiteSeg >= t.tiempoReferenciaSeg, {
    message: 'El tiempo límite no puede ser menor que el de referencia.',
    path: ['tiempoLimiteSeg'],
  });

const WeightsSchema = z.object({
  resultado: z.number(),
  eficiencia: z.number(),
  tiempo: z.number(),
  independencia: z.number(),
  error: z.number(),
  errorMax: z.number(),
  ayuda: z.number(),
});

export const EvaluationDefinitionSchema = z.object({
  versionId: z.number().int(),
  codigo: z.string(),
  nombre: z.string(),
  requierePin: z.boolean(),
  pesos: WeightsSchema,
  niveles: z.array(z.object({ nombre: z.string(), min: z.number() })).min(1),
  tareas: z
    .array(
      z.object({
        orden: z.number().int(),
        practica: z.boolean().default(false),
        peso: z.number().positive().default(1),
        definicion: TaskDefinitionSchema,
      }),
    )
    .min(1),
});

export const PaqueteSchema = z.object({
  version: z.string(),
  puestos: z.array(z.object({ id: z.number().int(), nombre: z.string(), evaluacionVersionId: z.number().int() })),
  sucursales: z.array(z.object({ id: z.number().int(), nombre: z.string() })),
  evaluaciones: z.array(EvaluationDefinitionSchema),
});

export type Paquete = z.infer<typeof PaqueteSchema>;
