"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, BarChart3 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ScoreHistoryGraph } from "@/components/score-history-graph"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

type Mode = "addition" | "subtraction" | "multiplication" | "division" | "all"

export default function ProgressPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [selectedMode, setSelectedMode] = useState<Mode>("all")

  if (!user) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-4xl overflow-hidden bg-card border-border shadow-2xl">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-12">
              Please sign in to view your progress
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-4xl overflow-hidden bg-card border-border shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl font-black tracking-tighter flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-primary" />
              My Progress
            </CardTitle>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Game
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mode Filter */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {(["all", "addition", "subtraction", "multiplication", "division"] as Mode[]).map((mode) => (
              <Button
                key={mode}
                variant={selectedMode === mode ? "default" : "secondary"}
                className="capitalize"
                onClick={() => setSelectedMode(mode)}
              >
                {mode}
              </Button>
            ))}
          </div>

          {/* Progress Content */}
          {selectedMode === "all" ? (
            <div className="space-y-6">
              {(["addition", "subtraction", "multiplication", "division"] as Mode[]).map((mode) => (
                <ScoreHistoryGraph key={mode} mode={mode} />
              ))}
            </div>
          ) : (
            <ScoreHistoryGraph mode={selectedMode} />
          )}
        </CardContent>
      </Card>
    </main>
  )
}
