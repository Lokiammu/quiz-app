"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { acceptQuiz } from "@/lib/actions"
import { Loader2, Clock } from "lucide-react"

interface WaitingRoomProps {
  roomId: string
  roomName: string
  isActive: boolean
  hasAccepted: boolean
  userName: string
}

export function WaitingRoom({ roomId, roomName, isActive, hasAccepted, userName }: WaitingRoomProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleAccept = async () => {
    setIsLoading(true)
    setError("")

    try {
      const result = await acceptQuiz(roomId)

      if (result.error) {
        throw new Error(result.error)
      }

      // Refresh the page to check if room is active
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Waiting Room: {roomName}</CardTitle>
        <CardDescription>
          Welcome, {userName}! {isActive ? "The quiz is ready to start." : "Waiting for the admin to start the quiz."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-6">
        <div className="text-center mb-6">
          {isActive ? (
            <div className="flex flex-col items-center">
              <div className="text-green-500 mb-2">Quiz is active!</div>
              {!hasAccepted && (
                <div className="text-sm text-gray-600 dark:text-gray-400">Click the button below to join the quiz</div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Clock className="h-12 w-12 text-blue-500 mb-2 animate-pulse" />
              <div className="text-sm text-gray-600 dark:text-gray-400">Waiting for the admin to start the quiz...</div>
            </div>
          )}
        </div>
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
      </CardContent>
      <CardFooter>
        {isActive && !hasAccepted ? (
          <Button className="w-full" onClick={handleAccept} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accepting...
              </>
            ) : (
              "Accept and Join Quiz"
            )}
          </Button>
        ) : hasAccepted ? (
          <div className="w-full text-center text-sm text-gray-600 dark:text-gray-400">
            {isActive
              ? "You've accepted the quiz. It will start automatically when ready."
              : "You've accepted the quiz. Waiting for the admin to start it."}
          </div>
        ) : (
          <Button className="w-full" disabled={true}>
            Waiting for Admin to Start
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

