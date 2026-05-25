import { setupDevToolsPlugin } from '@vue/devtools-api';
import type {
  App,
  ComponentInternalInstance,
} from 'vue';
import { buildProviderTree } from './tree-builder';
import type {
  ProviderNode,
  ProviderTreeRoot,
} from './types';

const PLUGIN_ID = 'vue-injector-tree';
const INSPECTOR_ID = 'injector-tree';

// ─── Inspector node colours ──────────────────────────────────────────────────
const COLORS = {
  provider: 0x41b883, // Vue green
  override: 0xf97316, // orange — key is overriding an ancestor
  app: 0x6366f1, // indigo — app-level root
  leaf: 0x64748b, // slate — no provides but shown for context
};

interface AppContext {
  provides: Record<string | symbol, unknown>;
}

interface InspectorStateEntry {
  key: string;
  value: unknown;
  editable?: boolean;
  objectType?:
    | 'ref'
    | 'reactive'
    | 'computed'
    | 'other';
  type?: string;
}

type InspectorState = Record<
  string,
  InspectorStateEntry[]
>;

/** Retrieve the internal root component instance and app-level provides. */
function getAppInternals(app: App): {
  rootInstance: ComponentInternalInstance | null;
  appProvides: Record<string | symbol, unknown>;
} {
  // Vue 3 internals — these exist in dev builds
  const internal = app as unknown as {
    _instance?: ComponentInternalInstance;
    _context?: AppContext;
  };
  return {
    rootInstance: internal._instance ?? null,
    appProvides:
      internal._context?.provides ?? {},
  };
}

/**
 * Flatten the provider tree into a map of id → node for quick lookup
 * and produce the flat node list used to populate the inspector sidebar.
 */
function flattenNodes(
  nodes: ProviderNode[],
): Map<string, ProviderNode> {
  const map = new Map<string, ProviderNode>();
  function visit(list: ProviderNode[]) {
    for (const node of list) {
      map.set(node.id, node);
      if (node.children.length)
        visit(node.children);
    }
  }
  visit(nodes);
  return map;
}

interface InspectorNode {
  id: string;
  label: string;
  tags: {
    label: string;
    textColor: number;
    backgroundColor: number;
  }[];
  children: InspectorNode[];
}

/**
 * Convert a ProviderNode into the inspector tree node shape expected by
 * the DevTools API.
 */
function toInspectorNode(
  node: ProviderNode,
): InspectorNode {
  const keyCount = Object.keys(
    node.provides,
  ).length;
  const hasOverrides =
    node.overriddenKeys.length > 0;
  const tags = [];

  if (hasOverrides) {
    tags.push({
      label: 'overrides',
      textColor: 0xffffff,
      backgroundColor: COLORS.override,
    });
  }
  if (keyCount > 0) {
    tags.push({
      label: `${keyCount} key${keyCount === 1 ? '' : 's'}`,
      textColor: 0xffffff,
      backgroundColor: COLORS.provider,
    });
  }

  return {
    id: node.id,
    label: node.componentName,
    tags,
    children: node.children.map(child =>
      toInspectorNode(child),
    ),
  };
}

/**
 * Build the "app root" synthetic node that sits above all component providers.
 */
function toAppRootNode(tree: ProviderTreeRoot) {
  const keyCount = Object.keys(
    tree.appProvides,
  ).length;
  return {
    id: 'app-root',
    label: 'App (app.provide)',
    tags:
      keyCount > 0
        ? [
            {
              label: `${keyCount} key${keyCount === 1 ? '' : 's'}`,
              textColor: 0xffffff,
              backgroundColor: COLORS.app,
            },
          ]
        : [],
    children: [],
  };
}

/**
 * Build the inspector state payload for a selected node.
 */
function buildNodeState(
  node: ProviderNode,
): InspectorState {
  const providedEntries = Object.entries(
    node.provides,
  ).map(([key, value]) => ({
    key,
    value,
    editable: false,
    ...(node.overriddenKeys.includes(key)
      ? {
          objectType: 'computed' as const,
          type: '⚠ overrides ancestor',
        }
      : {}),
  }));

  const sections: InspectorState = {
    'Provided Keys': providedEntries,
  };

  if (node.injects.length) {
    sections[
      'Inject Declarations (Options API)'
    ] = node.injects.map(i => ({
      key: i.key,
      value: i.resolvedFrom,
      editable: false,
    }));
  }

  if (node.overriddenKeys.length) {
    sections['Overridden Keys'] =
      node.overriddenKeys.map(k => ({
        key: k,
        value: 'shadows ancestor provider',
        editable: false,
      }));
  }

  return sections;
}

/**
 * Register the Vue Injector Tree DevTools plugin with a mounted Vue app.
 */
export function registerInjectorTreePlugin(
  app: App,
): void {
  setupDevToolsPlugin(
    {
      id: PLUGIN_ID,
      label: 'Injector Tree',
      packageName: 'vue-devtools-injectortree',
      homepage:
        'https://github.com/vue-devtools-injectortree',
      logo: 'https://vuejs.org/images/logo.png',
      componentStateTypes: ['Injector Tree'],
      // Cast to any: App's recursive component types cause TS2589/2615
      // deep-instantiation errors inside the devtools-api generic mapper.
      app: app as any,
    },
    api => {
      // ── Custom inspector ─────────────────────────────────────────────────
      api.addInspector({
        id: INSPECTOR_ID,
        label: 'Injector Tree',
        icon: 'device_hub',
        treeFilterPlaceholder:
          'Filter providers…',
      });

      // ── Build tree on each refresh ────────────────────────────────────────
      let cachedTree: ProviderTreeRoot | null =
        null;
      let nodeMap = new Map<
        string,
        ProviderNode
      >();

      function refreshTree(): ProviderTreeRoot {
        const { rootInstance, appProvides } =
          getAppInternals(app);
        if (!rootInstance) {
          cachedTree = {
            appProvides: {},
            nodes: [],
          };
          nodeMap = new Map();
          return cachedTree;
        }
        cachedTree = buildProviderTree(
          rootInstance,
          appProvides,
        );
        nodeMap = flattenNodes(cachedTree.nodes);
        return cachedTree;
      }

      // ── Inspector: populate the tree (left pane) ──────────────────────────
      api.on.getInspectorTree(payload => {
        if (payload.inspectorId !== INSPECTOR_ID)
          return;

        const tree = refreshTree();
        const filter =
          payload.filter?.toLowerCase() ?? '';

        const appRootNode = toAppRootNode(tree);
        const componentNodes = tree.nodes.map(n =>
          toInspectorNode(n),
        );

        // Simple filter: hide nodes whose label doesn't match
        function filterNode(
          node: ReturnType<
            typeof toInspectorNode
          >,
        ): ReturnType<
          typeof toInspectorNode
        > | null {
          const match =
            !filter ||
            node.label
              .toLowerCase()
              .includes(filter);
          const filteredChildren =
            node.children.flatMap(c => {
              const r = filterNode(c);
              return r ? [r] : [];
            });
          if (match || filteredChildren.length) {
            return {
              ...node,
              children: filteredChildren,
            };
          }
          return null;
        }

        const filteredAppRoot =
          filter &&
          !appRootNode.label
            .toLowerCase()
            .includes(filter)
            ? null
            : appRootNode;

        payload.rootNodes = [
          ...(filteredAppRoot
            ? [filteredAppRoot]
            : []),
          ...componentNodes.flatMap(n => {
            const r = filterNode(n);
            return r ? [r] : [];
          }),
        ];
      });

      // ── Inspector: populate the detail pane (right side) ─────────────────
      api.on.getInspectorState(payload => {
        if (payload.inspectorId !== INSPECTOR_ID)
          return;

        if (payload.nodeId === 'app-root') {
          const tree =
            cachedTree ?? refreshTree();
          payload.state = {
            'App-level Provides (app.provide)':
              Object.entries(
                tree.appProvides,
              ).map(([key, value]) => ({
                key,
                value,
                editable: false,
              })),
          } satisfies InspectorState;
          return;
        }

        const node = nodeMap.get(payload.nodeId);
        if (node) {
          payload.state = buildNodeState(node);
        }
      });

      // ── Component tree: badge provider components ─────────────────────────
      api.on.visitComponentTree(payload => {
        const instance =
          payload.componentInstance as unknown as {
            provides?: Record<
              string | symbol,
              unknown
            >;
            parent?: {
              provides?: Record<
                string | symbol,
                unknown
              >;
            } | null;
          };
        if (!instance.provides) return;
        if (
          instance.provides !==
          instance.parent?.provides
        ) {
          const count =
            Object.getOwnPropertyNames(
              instance.provides,
            ).length +
            Object.getOwnPropertySymbols(
              instance.provides,
            ).length;
          payload.treeNode.tags.push({
            label: `Provider (${count})`,
            textColor: 0xffffff,
            backgroundColor: COLORS.provider,
          });
        }
      });

      // ── Component state: show what a component injects ────────────────────
      // v8 keeps the v6 custom-plugin hook names for compatibility.
      api.on.inspectComponent(payload => {
        const instance =
          payload.componentInstance as unknown as {
            type?: { inject?: unknown };
            provides?: Record<
              string | symbol,
              unknown
            >;
          };
        const inject = instance.type?.inject;
        if (!inject) return;

        const keys: string[] = Array.isArray(
          inject,
        )
          ? inject
          : typeof inject === 'object' &&
              inject !== null
            ? Object.keys(inject as object)
            : [];

        if (!keys.length) return;

        payload.instanceData.state.push(
          ...keys.map(key => ({
            key,
            type: 'Injector Tree',
            value: `injected key "${key}"`,
            editable: false,
          })),
        );
      });

      // Refresh inspector on a short polling interval so the tree stays
      // current as components mount/unmount (lifecycle hooks are not
      // exposed through devtools-api v6's api.on).
      setInterval(() => {
        api.sendInspectorTree(INSPECTOR_ID);
        api.sendInspectorState(INSPECTOR_ID);
      }, 2000);
    },
  );
}
