import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { Prisma } from "@/generated/prisma/client";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
    readonly headers?: Record<string, string>,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: unknown,
  headers?: Record<string, string>,
) {
  return NextResponse.json(
    { error: { code, message, ...(details === undefined ? {} : { details }) } },
    { status, headers },
  );
}

type Handler<C> = (request: Request, context: C) => Promise<Response>;

/** Wraps a route handler and maps thrown errors to a consistent JSON shape. */
export function handle<C = unknown>(fn: Handler<C>): Handler<C> {
  return async (request, context) => {
    try {
      return await fn(request, context);
    } catch (error) {
      if (error instanceof HttpError) {
        return errorResponse(
          error.status,
          error.code,
          error.message,
          error.details,
          error.headers,
        );
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002" || error.code === "P2003") {
          return errorResponse(
            409,
            "conflict",
            "The change conflicts with existing data",
          );
        }
        if (error.code === "P2025") {
          return errorResponse(404, "not_found", "Resource not found");
        }
      }
      console.error("Unhandled API error", error);
      return errorResponse(500, "internal_error", "Internal server error");
    }
  };
}

export function parse<S extends z.ZodType>(
  schema: S,
  data: unknown,
): z.output<S> {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  throw new HttpError(
    400,
    "validation_error",
    "Invalid request data",
    result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  );
}

export async function parseJson<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<z.output<S>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, "invalid_json", "Request body must be valid JSON");
  }
  return parse(schema, body);
}

export function revalidateMenu(slug: string) {
  revalidatePath(`/c/${slug}`);
}
