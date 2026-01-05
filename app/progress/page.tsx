"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ScoreHistoryGraph } from "@/components/score-history-graph"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, History, TrendingUp, Trophy } from "lucide-react"
import { getUserScoreHistory, type LeaderboardEntryWithDate } from "@/lib/leaderboard"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"

type Mode = "addition" | "subtraction" | "multiplication" | "division"

export default function ProgressPage() {
  const router = useRouter()
  const { user, loading: authLoading, signIn } = useAuth()
  const [mode, setMode] = useState<Mode>("addition")
  const [history, setHistory] = useState<LeaderboardEntryWithDate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      const loadHistory = async () => {
        setLoading(true)
        try {
          const data = await getUserScoreHistory(user.uid, mode)
          setHistory(data)
        } catch (error) {
          console.error("Error loading history:", error)
        } finally {
          setLoading(false)
        }
      }
      loadHistory()
    }
  }, [user, mode])

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <Trophy className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Track Your Progress</h1>
          <p className="text-muted-foreground mb-6">Sign in to view your score history and progress charts.</p>
          <Button onClick={signIn} className="w-full">
            Sign in with Google
          </Button>
          <Button variant="ghost" onClick={() => router.push("/")} className="w-full mt-2">
            Back to Home
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-black tracking-tight uppercase">
                Your <span className="text-primary">Progress</span>
              </h1>
              <p className="text-sm text-muted-foreground">Detailed breakdown of your performance</p>
            </div>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="w-full md:w-auto">
            <TabsList className="grid grid-cols-4 w-full md:w-[400px]">
              <TabsTrigger value="addition" className="text-xs">
                Add
              </TabsTrigger>
              <TabsTrigger value="subtraction" className="text-xs">
                Sub
              </TabsTrigger>
              <TabsTrigger value="multiplication" className="text-xs">
                Mult
              </TabsTrigger>
              <TabsTrigger value="division" className="text-xs">
                Div
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: History List */}
          <Card className="lg:col-span-1 border-border bg-card/50">
            <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-4">
              <History className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg font-bold">History</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : history.length > 0 ? (
                <div className="rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Score</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...history].reverse().map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-bold text-primary">{entry.score}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(entry.createdAt, "MMM d, h:mm a")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">No scores recorded for this mode.</div>
              )}
            </CardContent>
          </Card>

          {/* Right: Graph */}
          <div className="lg:col-span-2">
            <Card className="border-border bg-card/50 h-full">
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg font-bold">Performance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ScoreHistoryGraph mode={mode} standalone={true} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
