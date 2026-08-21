import type { MediaRow } from "../types";
import { MediaCard } from "./MediaCard";
import { MediaRowMenu, type MediaActionHandlers } from "./MediaRowMenu";

interface Props {
  items: MediaRow[];
  onOpen?: (m: MediaRow) => void;
  onFavorite?: (m: MediaRow) => void;
  actions?: MediaActionHandlers;
  selectedIds?: Set<string>;
  onToggleSelect?: (m: MediaRow) => void;
}

export function MediaGrid({
  items,
  onOpen,
  onFavorite,
  actions,
  selectedIds,
  onToggleSelect,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((m) => (
        <MediaCard
          key={m.id}
          media={m}
          selected={selectedIds?.has(m.id)}
          onClick={() => (onToggleSelect ? onToggleSelect(m) : onOpen?.(m))}
          menu={actions ? <MediaRowMenu media={m} handlers={actions} /> : undefined}
          onFavorite={onFavorite ? () => onFavorite(m) : undefined}
        />
      ))}
    </div>
  );
}
