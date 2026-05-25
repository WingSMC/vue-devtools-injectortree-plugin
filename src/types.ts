export interface ProviderNode {
  /** Stable string ID derived from the component's internal uid */
  id: string;
  /** Display name of the component */
  componentName: string;
  /** Full file path of the component's source (if available) */
  componentFile?: string;
  /** Keys this specific component provides (own keys, not inherited from parent) */
  provides: Record<string, unknown>;
  /**
   * Keys this component overrides from a parent provider
   * (subset of `provides` keys that also exist in an ancestor's provides).
   */
  overriddenKeys: string[];
  /** Injection info gathered from Options API `inject` declarations */
  injects: InjectInfo[];
  /** Nested provider nodes that are descendants of this component */
  children: ProviderNode[];
  depth: number;
}

export interface InjectInfo {
  key: string;
  resolvedFrom: string;
}

export interface ProviderTreeRoot {
  /** App-level provides (registered via app.provide()) */
  appProvides: Record<string, unknown>;
  /** Top-level provider nodes in component tree order */
  nodes: ProviderNode[];
}
