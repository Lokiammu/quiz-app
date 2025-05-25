import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { WaitingRoom } from "@/components/waiting-room"

export default async function WaitingRoomPage({ params }: { params: { roomId: string } }) {
  const { roomId } = params
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const userId = cookies().get("user_id")?.value

  if (!userId) {
    redirect("/")
  }

  // Get room details
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("name, is_active")
    .eq("id", roomId)
    .single()

  if (roomError || !room) {
    redirect("/")
  }

  // Check if user has accepted
  const { data: userRoom, error: userRoomError } = await supabase
    .from("user_rooms")
    .select("has_accepted")
    .eq("user_id", userId)
    .eq("room_id", roomId)
    .single()

  if (userRoomError || !userRoom) {
    redirect("/")
  }

  // If room is active and user has accepted, redirect to quiz
  if (room.is_active && userRoom.has_accepted) {
    redirect(`/quiz/${roomId}`)
  }

  // Get user name
  const { data: user } = await supabase.from("users").select("name").eq("id", userId).single()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <WaitingRoom
        roomId={roomId}
        roomName={room.name}
        isActive={room.is_active}
        hasAccepted={userRoom.has_accepted}
        userName={user?.name || "User"}
      />
    </main>
  )
}

