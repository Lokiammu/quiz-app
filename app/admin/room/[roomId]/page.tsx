import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminDashboard } from "@/components/admin-dashboard"

export default async function AdminPage({ params }: { params: { roomId: string } }) {
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
    .select("name, is_active, created_by")
    .eq("id", roomId)
    .single()

  if (roomError || !room) {
    redirect("/")
  }

  // Verify user is admin
  if (room.created_by !== userId) {
    redirect("/")
  }

  // Get participants
  const { data: participants, error: participantsError } = await supabase
    .from("user_rooms")
    .select(`
      has_accepted,
      score,
      users (
        id,
        name
      )
    `)
    .eq("room_id", roomId)

  if (participantsError) {
    console.error("Error fetching participants:", participantsError)
  }

  // Get questions
  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select(`
      id,
      question_text,
      answers (
        id,
        answer_text,
        is_correct
      )
    `)
    .eq("room_id", roomId)

  if (questionsError) {
    console.error("Error fetching questions:", questionsError)
  }

  return (
    <main className="flex min-h-screen flex-col p-4 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <AdminDashboard
        roomId={roomId}
        roomName={room.name}
        isActive={room.is_active}
        participants={participants || []}
        questions={questions || []}
      />
    </main>
  )
}

