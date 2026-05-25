import type { ComponentInternalInstance } from 'vue';

/**
 * Extract a human-readable name from a component instance.
 */
export function getComponentName(
  instance: ComponentInternalInstance,
): string {
  const type = instance.type as Record<
    string,
    unknown
  >;
  return (
    (type.__name as string | undefined) ||
    (type.name as string | undefined) ||
    (type.__file
      ? ((type.__file as string)
          .split('/')
          .pop()
          ?.replace(/\.vue$/, '') ?? 'Anonymous')
      : 'Anonymous')
  );
}

/**
 * Extract the source file path from a component instance (dev only).
 */
export function getComponentFile(
  instance: ComponentInternalInstance,
): string | undefined {
  const type = instance.type as Record<
    string,
    unknown
  >;
  return type.__file as string | undefined;
}

/**
 * Safely serialize an arbitrary injected value to a displayable string.
 */
export function serializeValue(
  value: unknown,
): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'function')
    return `[Function: ${value.name || 'anonymous'}]`;
  if (typeof value === 'symbol')
    return value.toString();
  if (typeof value === 'object') {
    try {
      const str = JSON.stringify(value, null, 2);
      return str.length > 300
        ? str.slice(0, 300) + '…'
        : str;
    } catch {
      return '[Circular]';
    }
  }
  return String(value);
}

/**
 * Given a component's `provides` object, return only the keys it added
 * itself (i.e., its own enumerable properties vs the parent's provides).
 */
export function getOwnProvides(
  provides: Record<string | symbol, unknown>,
  parentProvides: Record<
    string | symbol,
    unknown
  > | null,
): Record<string | symbol, unknown> {
  if (!parentProvides) return provides;
  // Vue copies the parent's provides onto the component via Object.create,
  // so own keys are exactly the ones defined directly on this instance.
  const ownKeys = [
    ...Object.getOwnPropertyNames(provides),
    ...Object.getOwnPropertySymbols(provides),
  ];
  const result: Record<string | symbol, unknown> =
    {};
  for (const key of ownKeys) {
    result[key] = provides[key];
  }
  return result;
}

/**
 * Return true when the component has its own provides (not just inheriting parent's).
 */
export function isProvider(
  instance: ComponentInternalInstance,
): boolean {
  const provides = (
    instance as unknown as {
      provides?: Record<string | symbol, unknown>;
    }
  ).provides;
  const parentProvides = instance.parent
    ? (
        instance.parent as unknown as {
          provides?: Record<
            string | symbol,
            unknown
          >;
        }
      ).provides
    : null;

  if (!provides) return false;
  // Vue sets a component's provides to the same object reference as its parent
  // until the component calls provide() for the first time.
  return provides !== parentProvides;
}

/** Stringify a key (string or symbol) for display. */
export function keyLabel(
  key: string | symbol,
): string {
  return typeof key === 'symbol'
    ? key.toString()
    : key;
}
