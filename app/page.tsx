import { LoginForm } from "@/components/login-form"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Quiz App</h1>
          <p className="text-gray-600 dark:text-gray-300">Enter your name and room to get started</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}

