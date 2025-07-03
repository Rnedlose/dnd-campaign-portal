import { Liveblocks } from "@liveblocks/node";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: Request) {
  const authSession = await getServerSession(authOptions);

  if (!authSession?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = {
    id: authSession.user.id,
    info: {
      name: authSession.user.name || "Anonymous",
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
    },
  };

  // ✅ Correct way to get the room from the request body:
  const { room } = await request.json();

  const liveblocksSession = liveblocks.prepareSession(user.id, {
    userInfo: user.info,
  });

  liveblocksSession.allow(room, liveblocksSession.FULL_ACCESS);

  const { status, body } = await liveblocksSession.authorize();
  return new NextResponse(body, { status });
}
