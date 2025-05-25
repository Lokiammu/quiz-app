"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

export async function joinRoom(name: string, roomName: string, isAdmin: boolean) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    // Create or get user
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("name", name)
      .maybeSingle()

    let userId

    if (userError) throw new Error(userError.message)

    if (!userData) {
      // Create new user
      const { data: newUser, error: createUserError } = await supabase
        .from("users")
        .insert({ name })
        .select("id")
        .single()

      if (createUserError) throw new Error(createUserError.message)
      userId = newUser.id
    } else {
      userId = userData.id
    }

    // Check if room exists
    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .select("id, created_by")
      .eq("name", roomName)
      .maybeSingle()

    let roomId

    if (roomError) throw new Error(roomError.message)

    if (!roomData) {
      // Create new room if admin
      if (!isAdmin) {
        throw new Error("Room does not exist. Only admins can create new rooms.")
      }

      const { data: newRoom, error: createRoomError } = await supabase
        .from("rooms")
        .insert({ name: roomName, created_by: userId })
        .select("id")
        .single()

      if (createRoomError) throw new Error(createRoomError.message)
      roomId = newRoom.id
    } else {
      roomId = roomData.id

      // Check if user is trying to join as admin but isn't the creator
      if (isAdmin && roomData.created_by !== userId) {
        throw new Error("You are not the admin of this room")
      }
    }

    // Add user to room if not admin
    if (!isAdmin) {
      const { error: joinError } = await supabase.from("user_rooms").upsert({
        user_id: userId,
        room_id: roomId,
        has_accepted: false,
        score: 0,
      })

      if (joinError) throw new Error(joinError.message)
    }

    // Store user ID in cookie for session management
    cookies().set("user_id", userId, {
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
      httpOnly: true,
      sameSite: "strict",
    })

    revalidatePath("/")
    return { roomId, userId }
  } catch (error: any) {
    console.error("Error joining room:", error)
    return { error: error.message }
  }
}

export async function acceptQuiz(roomId: string) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const userId = cookies().get("user_id")?.value

  if (!userId) {
    return { error: "User not authenticated" }
  }

  try {
    const { error } = await supabase
      .from("user_rooms")
      .update({ has_accepted: true })
      .eq("user_id", userId)
      .eq("room_id", roomId)

    if (error) throw new Error(error.message)

    revalidatePath(`/waiting-room/${roomId}`)
    revalidatePath(`/quiz/${roomId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Error accepting quiz:", error)
    return { error: error.message }
  }
}

export async function activateRoom(roomId: string) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const userId = cookies().get("user_id")?.value

  if (!userId) {
    return { error: "User not authenticated" }
  }

  try {
    // Verify user is admin
    const { data: room, error: roomError } = await supabase.from("rooms").select("created_by").eq("id", roomId).single()

    if (roomError) throw new Error(roomError.message)

    if (room.created_by !== userId) {
      throw new Error("Only the admin can activate the room")
    }

    // Activate room
    const { error } = await supabase.from("rooms").update({ is_active: true }).eq("id", roomId)

    if (error) throw new Error(error.message)

    revalidatePath(`/admin/room/${roomId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Error activating room:", error)
    return { error: error.message }
  }
}

export async function deactivateRoom(roomId: string) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const userId = cookies().get("user_id")?.value

  if (!userId) {
    return { error: "User not authenticated" }
  }

  try {
    // Verify user is admin
    const { data: room, error: roomError } = await supabase.from("rooms").select("created_by").eq("id", roomId).single()

    if (roomError) throw new Error(roomError.message)

    if (room.created_by !== userId) {
      throw new Error("Only the admin can deactivate the room")
    }

    // Deactivate room
    const { error } = await supabase.from("rooms").update({ is_active: false }).eq("id", roomId)

    if (error) throw new Error(error.message)

    revalidatePath(`/admin/room/${roomId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Error deactivating room:", error)
    return { error: error.message }
  }
}

export async function addQuestion(
  roomId: string,
  questionText: string,
  answers: { text: string; isCorrect: boolean }[],
) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const userId = cookies().get("user_id")?.value

  if (!userId) {
    return { error: "User not authenticated" }
  }

  try {
    // Verify user is admin
    const { data: room, error: roomError } = await supabase.from("rooms").select("created_by").eq("id", roomId).single()

    if (roomError) throw new Error(roomError.message)

    if (room.created_by !== userId) {
      throw new Error("Only the admin can add questions")
    }

    // Add question
    const { data: question, error: questionError } = await supabase
      .from("questions")
      .insert({ room_id: roomId, question_text: questionText })
      .select("id")
      .single()

    if (questionError) throw new Error(questionError.message)

    // Add answers
    const answersToInsert = answers.map((answer) => ({
      question_id: question.id,
      answer_text: answer.text,
      is_correct: answer.isCorrect,
    }))

    const { error: answersError } = await supabase.from("answers").insert(answersToInsert)

    if (answersError) throw new Error(answersError.message)

    revalidatePath(`/admin/room/${roomId}`)
    return { success: true, questionId: question.id }
  } catch (error: any) {
    console.error("Error adding question:", error)
    return { error: error.message }
  }
}

export async function submitAnswer(questionId: string, answerId: string) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const userId = cookies().get("user_id")?.value

  if (!userId) {
    return { error: "User not authenticated" }
  }

  try {
    // Submit answer
    const { error: submitError } = await supabase.from("user_answers").upsert({
      user_id: userId,
      question_id: questionId,
      answer_id: answerId,
    })

    if (submitError) throw new Error(submitError.message)

    // Check if answer is correct
    const { data: answer, error: answerError } = await supabase
      .from("answers")
      .select("is_correct")
      .eq("id", answerId)
      .single()

    if (answerError) throw new Error(answerError.message)

    // Update score if correct
    if (answer.is_correct) {
      // Get room ID from question
      const { data: question, error: questionError } = await supabase
        .from("questions")
        .select("room_id")
        .eq("id", questionId)
        .single()

      if (questionError) throw new Error(questionError.message)

      // Update user score
      const { data: userRoom, error: userRoomError } = await supabase
        .from("user_rooms")
        .select("score")
        .eq("user_id", userId)
        .eq("room_id", question.room_id)
        .single()

      if (userRoomError) throw new Error(userRoomError.message)

      const { error: updateError } = await supabase
        .from("user_rooms")
        .update({ score: userRoom.score + 1 })
        .eq("user_id", userId)
        .eq("room_id", question.room_id)

      if (updateError) throw new Error(updateError.message)
    }

    return {
      success: true,
      isCorrect: answer.is_correct,
    }
  } catch (error: any) {
    console.error("Error submitting answer:", error)
    return { error: error.message }
  }
}

export async function getQuizResults(roomId: string) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const userId = cookies().get("user_id")?.value

  if (!userId) {
    return { error: "User not authenticated" }
  }

  try {
    // Verify user is admin
    const { data: room, error: roomError } = await supabase.from("rooms").select("created_by").eq("id", roomId).single()

    if (roomError) throw new Error(roomError.message)

    if (room.created_by !== userId) {
      throw new Error("Only the admin can view results")
    }

    // Get participants with scores
    const { data: participants, error: participantsError } = await supabase
      .from("user_rooms")
      .select(`
        score,
        users (
          id,
          name
        )
      `)
      .eq("room_id", roomId)
      .order("score", { ascending: false })

    if (participantsError) throw new Error(participantsError.message)

    return {
      success: true,
      participants: participants.map((p: any) => ({
        id: p.users.id,
        name: p.users.name,
        score: p.score,
      })),
    }
  } catch (error: any) {
    console.error("Error getting quiz results:", error)
    return { error: error.message }
  }
}

