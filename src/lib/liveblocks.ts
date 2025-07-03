import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

type Presence = {
  color: string;
  name: string;
};

type Storage = Record<string, never>;

type UserMeta = {
  id: string;
  info: {
    name: string;
    color: string;
  };
};

export const {
  RoomProvider,
  useRoom,
  useSelf,
  useOthers,
  useUpdateMyPresence,
} = createRoomContext<Presence, Storage, UserMeta>(client); 