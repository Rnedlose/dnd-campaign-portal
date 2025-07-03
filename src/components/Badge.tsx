import { useSelf } from "@/lib/liveblocks";

export function Badge() {
  const self = useSelf();

  if (!self) {
    return null;
  }

  return (
    <div
      className="px-2 py-1 text-xs rounded-full text-white"
      style={{ backgroundColor: self.info.color }}
    >
      {self.info.name}
    </div>
  );
} 