import { useOthers } from "@/lib/liveblocks";

export function Avatars() {
  const others = useOthers();

  return (
    <div className="flex -space-x-2">
      {others.map(({ id, info }) => (
        <div
          key={id}
          className="w-8 h-8 rounded-full border-2 border-white"
          style={{ backgroundColor: info.color }}
          title={info.name}
        />
      ))}
    </div>
  );
} 