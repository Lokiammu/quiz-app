"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { joinRoom } from "@/lib/actions"
import { Loader2 } from "lucide-react"

export function LoginForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [roomName, setRoomName] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      if (!name.trim() || !roomName.trim()) {
        throw new Error("Name and room name are required")
      }

      const result = await joinRoom(name, roomName, isAdmin)

      if (result.error) {
        throw new Error(result.error)
      }

      if (isAdmin) {
        router.push(`/admin/room/${result.roomId}`)
      } else {
        router.push(`/waiting-room/${result.roomId}`)
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Join a Quiz Room</CardTitle>
        <CardDescription>Enter your details to join or create a quiz room</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="room">Room Name</Label>
            <Input
              id="room"
              placeholder="Enter room name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="admin"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="admin" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Join as Admin
            </Label>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Joining...
            </>
          ) : (
            "Join Room"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

