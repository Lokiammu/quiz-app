import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { QuizInterface } from "@/components/quiz-interface"

export default async function QuizPage({ params }: { params: { roomId: string } }) {
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

  // If room is not active or user has not accepted, redirect to waiting room
  if (!room.is_active || !userRoom.has_accepted) {
    redirect(`/waiting-room/${roomId}`)
  }

  // Get questions for this room
  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select(`
      id,
      question_text,
      answers (
        id,
        answer_text
      )
    `)
    .eq("room_id", roomId)

  if (questionsError || !questions || questions.length === 0) {
    // No questions yet
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">No Questions Yet</h1>
          <p className="text-gray-600 dark:text-gray-300">
            The admin has not added any questions to this quiz yet. Please wait.
          </p>
        </div>
      </main>
    )
  }

  // Get user's answers
  const { data: userAnswers } = await supabase
    .from("user_answers")
    .select("question_id, answer_id")
    .eq("user_id", userId)

  const answeredQuestionIds = userAnswers?.map((ua) => ua.question_id) || []

  // Get user name
  const { data: user } = await supabase.from("users").select("name").eq("id", userId).single()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <QuizInterface
        roomId={roomId}
        roomName={room.name}
        questions={questions}
        answeredQuestionIds={answeredQuestionIds}
        userName={user?.name || "User"}
      />
    </main>
  )
}

