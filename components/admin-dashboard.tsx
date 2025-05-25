"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { activateRoom, deactivateRoom, addQuestion, getQuizResults } from "@/lib/actions"
import { Loader2, Plus, CheckCircle, XCircle, Trophy } from "lucide-react"

interface Answer {
  id: string
  answer_text: string
  is_correct: boolean
}

interface Question {
  id: string
  question_text: string
  answers: Answer[]
}

interface Participant {
  has_accepted: boolean
  score: number
  users: {
    id: string
    name: string
  }
}

interface AdminDashboardProps {
  roomId: string
  roomName: string
  isActive: boolean
  participants: Participant[]
  questions: Question[]
}

export function AdminDashboard({ roomId, roomName, isActive, participants, questions }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("participants")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // New question form state
  const [questionText, setQuestionText] = useState("")
  const [answers, setAnswers] = useState([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ])

  // Results state
  const [results, setResults] = useState<{ id: string; name: string; score: number }[] | null>(null)
  const [isLoadingResults, setIsLoadingResults] = useState(false)

  const handleToggleActive = async () => {
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const result = isActive ? await deactivateRoom(roomId) : await activateRoom(roomId)

      if (result.error) {
        throw new Error(result.error)
      }

      setSuccess(`Room ${isActive ? "deactivated" : "activated"} successfully`)

      // Refresh the page to update the UI
      window.location.reload()
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers]
    newAnswers[index].text = value
    setAnswers(newAnswers)
  }

  const handleCorrectChange = (index: number, checked: boolean) => {
    const newAnswers = [...answers].map((answer, i) => ({
      ...answer,
      isCorrect: i === index ? checked : false,
    }))
    setAnswers(newAnswers)
  }

  const handleAddQuestion = async () => {
    // Validate form
    if (!questionText.trim()) {
      setError("Question text is required")
      return
    }

    const filledAnswers = answers.filter((a) => a.text.trim())
    if (filledAnswers.length < 2) {
      setError("At least two answers are required")
      return
    }

    if (!filledAnswers.some((a) => a.isCorrect)) {
      setError("At least one answer must be marked as correct")
      return
    }

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const result = await addQuestion(roomId, questionText, filledAnswers)

      if (result.error) {
        throw new Error(result.error)
      }

      setSuccess("Question added successfully")

      // Reset form
      setQuestionText("")
      setAnswers([
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ])

      // Refresh the page to update the questions list
      window.location.reload()
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewResults = async () => {
    setIsLoadingResults(true)
    setError("")

    try {
      const result = await getQuizResults(roomId)

      if (result.error) {
        throw new Error(result.error)
      }

      setResults(result.participants)
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setIsLoadingResults(false)
    }
  }

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Room: {roomName}</p>
        </div>
        <Button onClick={handleToggleActive} disabled={isLoading} variant={isActive ? "destructive" : "default"}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isActive ? "Deactivating..." : "Activating..."}
            </>
          ) : isActive ? (
            "Deactivate Room"
          ) : (
            "Activate Room"
          )}
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
          {success}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="participants">
          <Card>
            <CardHeader>
              <CardTitle>Participants</CardTitle>
              <CardDescription>
                {participants.length} {participants.length === 1 ? "person" : "people"} in this room
              </CardDescription>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No participants yet</p>
              ) : (
                <div className="space-y-4">
                  {participants.map((participant) => (
                    <div
                      key={participant.users.id}
                      className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-700"
                    >
                      <div>
                        <p className="font-medium">{participant.users.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Score: {participant.score}</p>
                      </div>
                      <div className="flex items-center">
                        {participant.has_accepted ? (
                          <div className="flex items-center text-green-500">
                            <CheckCircle className="h-5 w-5 mr-1" />
                            <span className="text-sm">Accepted</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-amber-500">
                            <XCircle className="h-5 w-5 mr-1" />
                            <span className="text-sm">Not Accepted</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Question</CardTitle>
              <CardDescription>Create a new question for this quiz</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="question">Question</Label>
                  <Input
                    id="question"
                    placeholder="Enter your question"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Answers (at least two required)</Label>
                  {answers.map((answer, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <Input
                        placeholder={`Answer ${index + 1}`}
                        value={answer.text}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                      />
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`correct-${index}`}
                          checked={answer.isCorrect}
                          onCheckedChange={(checked) => handleCorrectChange(index, checked as boolean)}
                        />
                        <Label htmlFor={`correct-${index}`} className="text-sm">
                          Correct
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleAddQuestion} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Question
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing Questions</CardTitle>
              <CardDescription>
                {questions.length} {questions.length === 1 ? "question" : "questions"} in this quiz
              </CardDescription>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No questions yet</p>
              ) : (
                <div className="space-y-6">
                  {questions.map((question, qIndex) => (
                    <div key={question.id} className="p-4 border rounded-lg dark:border-gray-700">
                      <p className="font-medium mb-2">
                        {qIndex + 1}. {question.question_text}
                      </p>
                      <div className="ml-4 space-y-2">
                        {question.answers.map((answer) => (
                          <div key={answer.id} className="flex items-center">
                            <div
                              className={`w-4 h-4 rounded-full mr-2 ${
                                answer.is_correct ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                              }`}
                            />
                            <p className={answer.is_correct ? "font-medium" : ""}>
                              {answer.answer_text}
                              {answer.is_correct && " (Correct)"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Results</CardTitle>
              <CardDescription>View the performance of participants</CardDescription>
            </CardHeader>
            <CardContent>
              {!results ? (
                <div className="text-center py-6">
                  <Button onClick={handleViewResults} disabled={isLoadingResults}>
                    {isLoadingResults ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading Results...
                      </>
                    ) : (
                      <>
                        <Trophy className="mr-2 h-4 w-4" />
                        View Results
                      </>
                    )}
                  </Button>
                </div>
              ) : results.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No results available yet</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between font-medium p-2 border-b dark:border-gray-700">
                    <div className="w-12 text-center">#</div>
                    <div className="flex-1">Name</div>
                    <div className="w-20 text-right">Score</div>
                  </div>
                  {results.map((result, index) => (
                    <div
                      key={result.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        index === 0
                          ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                          : index === 1
                            ? "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                            : index === 2
                              ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                              : "border dark:border-gray-700"
                      }`}
                    >
                      <div className="w-12 text-center font-bold">
                        {index === 0 ? <Trophy className="h-5 w-5 text-yellow-500 mx-auto" /> : index + 1}
                      </div>
                      <div className="flex-1 font-medium">{result.name}</div>
                      <div className="w-20 text-right font-bold">{result.score}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

