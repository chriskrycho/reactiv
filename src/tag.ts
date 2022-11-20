import { MANAGER } from './manager';

export const REVISION = Symbol('Revision');

export type Tag = {
  [REVISION]: number;
};

export function createTag(): Tag {
  return {
    [REVISION]: MANAGER.version,
  };
}

export function markDependency(t: Tag): void {
  if (MANAGER.currentCompute) {
    MANAGER.currentCompute.add(t);
  }
}

export function markUpdate(t: Tag): void {
  if (MANAGER.currentCompute?.has(t)) {
    throw new Error('Cannot update a tag that has been used during a computation.');
  }

  t[REVISION] = MANAGER.incrementVersion();

  // If we run effects on *every* update, then we'll end up executing them > 1 times for every
  // derived value that an effect depends on, since the effect will trigger a recompute of the
  // derived value. Instead, we let the full pass over the effects happen once and only once.
  if (!MANAGER.isEffectRunning) {
    if (MANAGER.batchCount === 0) {
      MANAGER.runEffects();
    }
  }

  MANAGER.onTagDirtied();
}

  return Math.max(...tags.map((t) => t[REVISION]));
export function getMax(tags: Array<Tag>): number {
}

export function setOnTagDirtied(fn: () => void) {
  MANAGER.onTagDirtied = fn;
}
