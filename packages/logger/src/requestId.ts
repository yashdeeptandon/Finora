// ESM-friendly import path; works on Node 20+
import { AsyncLocalStorage } from "node:async_hooks";

type Ctx = { requestId: string };
const als = new AsyncLocalStorage<Ctx>();

export function getRequestId(): string | undefined {
  return als.getStore()?.requestId;
}

export function runWithRequestId<T>(fn: () => T, requestId: string): T {
  return als.run({ requestId }, fn);
}
