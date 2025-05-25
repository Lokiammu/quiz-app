"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { submitAnswer } from "@/lib/actions"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"

interface Answer {
  id: string
  answer_text: string
}

interface Question {
  id: string
  question_text: string
  answers: Answer[]
}

interface QuizInterfaceProps {
  roomId: string
  roomName: string
  questions: Question[]
  answeredQuestionIds: string[]
  userName: string
}

export function QuizInterface({ roomId, roomName, questions, answeredQuestionIds, userName }: QuizInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [feedback, setFeedback] = useState<{ isCorrect: boolean } | null>(null)

  const currentQuestion = questions[currentQuestionIndex]
  const hasAnsweredCurrent = answeredQuestionIds.includes(currentQuestion.id)

  const handleSubmit = async () => {
    if (!selectedAnswer) return

    setIsSubmitting(true)
    setError("")

    try {
      const result = await submitAnswer(currentQuestion.id, selectedAnswer)

      if (result.error) {
        throw new Error(result.error)
      }

      setFeedback({ isCorrect: result.isCorrect })

      // Add to answered questions locally
      answeredQuestionIds.push(currentQuestion.id)

      // Move to next question after a delay
      setTimeout(() => {
        setFeedback(null)
        setSelectedAnswer(null)

        // Check if there are more questions
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1)
        }
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(null)
      setFeedback(null)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      setSelectedAnswer(null)
      setFeedback(null)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Quiz: {roomName}</CardTitle>
        <CardDescription>
          Welcome, {userName}! Question {currentQuestionIndex + 1} of {questions.length}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">{currentQuestion.question_text}</h2>
          <RadioGroup
            value={selectedAnswer || ""}
            onValueChange={setSelectedAnswer}
            className="space-y-3"
            disabled={hasAnsweredCurrent || !!feedback}
          >
            {currentQuestion.answers.map((answer) => (
              <div
                key={answer.id}
                className={`flex items-center space-x-2 rounded-lg border p-4 ${
                  feedback && selectedAnswer === answer.id
                    ? feedback.isCorrect
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : "border-red-500 bg-red-50 dark:bg-red-900/20"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <RadioGroupItem value={answer.id} id={answer.id} />
                <Label htmlFor={answer.id} className="flex-grow cursor-pointer">
                  {answer.answer_text}
                </Label>
                {feedback &&
                  selectedAnswer === answer.id &&
                  (feedback.isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ))}
              </div>
            ))}
          </RadioGroup>
        </div>
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
          Previous
        </Button>
        <div className="flex gap-2">
          {!hasAnsweredCurrent && !feedback ? (
            <Button onClick={handleSubmit} disabled={!selectedAnswer || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Answer"
              )}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={currentQuestionIndex === questions.length - 1}>
              Next Question
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

