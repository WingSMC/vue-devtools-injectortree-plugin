import type { ComponentInternalInstance } from 'vue';
import type {
  InjectInfo,
  ProviderNode,
  ProviderTreeRoot,
} from './types';
import {
  getComponentFile,
  getComponentName,
  getOwnProvides,
  isProvider,
  keyLabel,
  serializeValue,
} from './utils';

type RawInstance = ComponentInternalInstance & {
  provides?: Record<string | symbol, unknown>;
  subTree?: {
    component?: RawInstance;
    children?: unknown[] | null;
  };
  slots?: unknown;
};

/**
 * Recursively walk the component tree starting from `instance`,
 * collecting nodes that have their own provides.
 *
 * @param instance     Current component instance to inspect
 * @param depth        Current depth in the provider hierarchy (0 = top-level provider)
 * @param parentProvides  Provides of the nearest ancestor (for diffing own keys)
 */
function walkTree(
  instance: RawInstance,
  depth: number,
  parentProvides: Record<
    string | symbol,
    unknown
  > | null,
): ProviderNode[] {
  const results: ProviderNode[] = [];

  const instanceIsProvider = isProvider(instance);
  const instanceProvides = (instance.provides ??
    {}) as Record<string | symbol, unknown>;

  let node: ProviderNode | null = null;

  if (instanceIsProvider) {
    const ownProvides = getOwnProvides(
      instanceProvides,
      parentProvides,
    );

    // Detect override keys — keys that also appear in parent's provides
    const overriddenKeys: string[] = [];
    if (parentProvides) {
      for (const key of [
        ...Object.getOwnPropertyNames(
          ownProvides,
        ),
        ...Object.getOwnPropertySymbols(
          ownProvides,
        ),
      ]) {
        if (key in parentProvides) {
          overriddenKeys.push(keyLabel(key));
        }
      }
    }

    // Gather Options API inject information
    const injects = extractInjectInfo(
      instance,
      instanceProvides,
    );

    // Build serializable provides map
    const serializedProvides: Record<
      string,
      string
    > = {};
    for (const key of [
      ...Object.getOwnPropertyNames(ownProvides),
      ...Object.getOwnPropertySymbols(
        ownProvides,
      ),
    ]) {
      serializedProvides[keyLabel(key)] =
        serializeValue(ownProvides[key]);
    }

    node = {
      id: `provider-${instance.uid}`,
      componentName: getComponentName(instance),
      componentFile: getComponentFile(instance),
      provides:
        serializedProvides as unknown as Record<
          string,
          unknown
        >,
      overriddenKeys,
      injects,
      children: [],
      depth,
    };

    results.push(node);
  }

  // Walk children of this component
  const childResults = walkChildren(
    instance,
    instanceIsProvider ? depth + 1 : depth,
    instanceIsProvider
      ? instanceProvides
      : parentProvides,
  );

  if (node) {
    // Provider children become children of this node
    node.children = childResults;
  } else {
    // Not a provider — pass children up
    results.push(...childResults);
  }

  return results;
}

/**
 * Iterate over all child component instances reachable from `instance.subTree`.
 */
function walkChildren(
  instance: RawInstance,
  depth: number,
  parentProvides: Record<
    string | symbol,
    unknown
  > | null,
): ProviderNode[] {
  const results: ProviderNode[] = [];
  const subTree = instance.subTree;

  if (!subTree) return results;

  // DFS through the vnode tree to find child component instances
  function visitVNode(vnode: unknown): void {
    if (!vnode || typeof vnode !== 'object')
      return;

    const v = vnode as {
      component?: RawInstance | null;
      children?: unknown;
      shapeFlag?: number;
    };

    if (v.component) {
      results.push(
        ...walkTree(
          v.component,
          depth,
          parentProvides,
        ),
      );
      return;
    }

    // Recurse into vnode children (fragment, element children, etc.)
    if (Array.isArray(v.children)) {
      for (const child of v.children)
        visitVNode(child);
    } else if (
      v.children &&
      typeof v.children === 'object'
    ) {
      for (const child of Object.values(
        v.children as object,
      ))
        visitVNode(child);
    }
  }

  visitVNode(subTree);
  return results;
}

/**
 * Extract inject declarations from Options API components.
 * Resolves which provider the injection comes from.
 */
function extractInjectInfo(
  instance: RawInstance,
  availableProvides: Record<
    string | symbol,
    unknown
  >,
): InjectInfo[] {
  const type = instance.type as Record<
    string,
    unknown
  >;
  const inject = type.inject;
  if (!inject) return [];

  const injects: InjectInfo[] = [];
  const keys: string[] = Array.isArray(inject)
    ? inject
    : typeof inject === 'object' &&
        inject !== null
      ? Object.keys(inject as object)
      : [];

  for (const key of keys) {
    const resolvedFrom =
      key in availableProvides
        ? 'ancestor'
        : 'not found';
    injects.push({ key, resolvedFrom });
  }

  return injects;
}

/**
 * Build the full provider tree for a mounted Vue app.
 *
 * @param appInstance  The root component instance (`app._instance`)
 * @param appProvides  The app-level provides object (`app._context.provides`)
 */
export function buildProviderTree(
  appInstance: ComponentInternalInstance,
  appProvides: Record<string | symbol, unknown>,
): ProviderTreeRoot {
  const serializedAppProvides: Record<
    string,
    unknown
  > = {};
  for (const key of [
    ...Object.getOwnPropertyNames(appProvides),
    ...Object.getOwnPropertySymbols(appProvides),
  ]) {
    serializedAppProvides[keyLabel(key)] =
      serializeValue(appProvides[key]);
  }

  const nodes = walkTree(
    appInstance as RawInstance,
    0,
    appProvides,
  );

  return {
    appProvides: serializedAppProvides,
    nodes,
  };
}
