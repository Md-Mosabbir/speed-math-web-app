"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowLeft, Crown, Trophy } from "lucide-react"
import { getLeaderboard, LeaderboardEntryWithDate } from "@/lib/leaderboard"
import { useAuth } from "@/contexts/auth-context"
import { format } from "date-fns"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

type Mode = "addition" | "subtraction" | "multiplication" | "division" | "all"

export default function LeaderboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryWithDate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMode, setSelectedMode] = useState<Mode>("all")

  useEffect(() => {
    loadLeaderboard()
  }, [selectedMode])

  const loadLeaderboard = async () => {
    setLoading(true)
    try {
      const mode = selectedMode === "all" ? undefined : selectedMode
      const entries = await getLeaderboard(mode, 20)
      setLeaderboard(entries)
    } catch (error) {
      console.error("Error loading leaderboard:", error)
    } finally {
      setLoading(false)
    }
  }

  // Find the highest score to show crown
  const highestScore = leaderboard.length > 0 ? leaderboard[0]?.score : 0

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-4xl overflow-hidden bg-card border-border shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl font-black tracking-tighter flex items-center gap-2">
              <Trophy className="w-8 h-8 text-primary" />
              Leaderboard
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

          {/* Leaderboard Table */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No scores yet. Be the first to play!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((entry, index) => {
                    const isHighest = entry.score === highestScore && index === 0
                    const isCurrentUser = user && entry.uid === user.uid
                    
                    return (
                      <TableRow
                        key={entry.id}
                        className={isCurrentUser ? "bg-primary/10" : ""}
                      >
                        <TableCell className="font-bold">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {isHighest && <Crown className="w-4 h-4 text-primary" />}
                            {isCurrentUser && user?.photoURL && (
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={user.photoURL} />
                                <AvatarFallback className="text-[10px]">
                                  {user.displayName?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            {entry.displayName}
                            {isCurrentUser && (
                              <span className="text-xs text-primary">(You)</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-lg">
                          {entry.score}
                        </TableCell>
                        <TableCell className="capitalize">
                          {entry.mode}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">
                          {format(entry.createdAt, "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
