import { z } from "zod";

/**
 * Derives a compact JSON skeleton from a Zod schema so every agent prompt can
 * state its exact expected output shape without each definition hand-writing
 * (and drifting from) a separate contract string. Used only to guide the model
 * — the real guarantee is the Zod `.parse` in the engine, never this hint.
 */
export function schemaToHint(schema: z.ZodTypeAny): string {
  return JSON.stringify(describe(schema), null, 2);
}

function unwrap(schema: z.ZodTypeAny): z.ZodTypeAny {
  const def = schema._def as { typeName?: string; innerType?: z.ZodTypeAny; schema?: z.ZodTypeAny };
  if (def.typeName === "ZodOptional" || def.typeName === "ZodDefault" || def.typeName === "ZodNullable") {
    return def.innerType ? unwrap(def.innerType) : schema;
  }
  if (def.typeName === "ZodEffects") {
    return def.schema ? unwrap(def.schema) : schema;
  }
  return schema;
}

function describe(schema: z.ZodTypeAny): unknown {
  const inner = unwrap(schema);
  const def = inner._def as { typeName?: string; type?: z.ZodTypeAny; values?: readonly string[] };

  switch (def.typeName) {
    case "ZodObject": {
      const shape = (inner as z.ZodObject<z.ZodRawShape>).shape;
      const out: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(shape)) {
        out[key] = describe(value as z.ZodTypeAny);
      }
      return out;
    }
    case "ZodArray":
      return def.type ? [describe(def.type)] : [];
    case "ZodString":
      return "string";
    case "ZodNumber":
      return "number";
    case "ZodBoolean":
      return "boolean";
    case "ZodEnum":
      return `enum(${(def.values ?? []).join("|")})`;
    default:
      return "value";
  }
}
