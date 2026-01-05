"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { getUserScoreHistory, type LeaderboardEntryWithDate } from "@/lib/leaderboard"
import { useAuth } from "@/contexts/auth-context"
import { format } from "date-fns"
import { RefreshCw } from "lucide-react"

interface ScoreHistoryGraphProps {
  mode: string
  standalone?: boolean
}

export function ScoreHistoryGraph({ mode, standalone = false }: ScoreHistoryGraphProps) {
  const { user } = useAuth()
  const [history, setHistory] = useState<LeaderboardEntryWithDate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadHistory()
    } else {
      setLoading(false)
    }
  }, [user, mode])

  const loadHistory = async () => {
    if (!user) return

    setLoading(true)
    setError(null)
    try {
      const data = await getUserScoreHistory(user.uid, mode)
      console.log(`Loaded score history for mode ${mode}:`, data.length, "entries") // Debug log
      setHistory(data)
    } catch (error: any) {
      console.error("Error loading score history:", error)
      setError(error.message || "Failed to load score history")
    } finally {
      setLoading(false)
    }
  }

  const chartData = history.map((entry, index) => ({
    date: format(entry.createdAt, "MMM d"),
    score: entry.score,
    fullDate: format(entry.createdAt, "MMM d, yyyy h:mm a"),
    gameNumber: index + 1,
  }))

  const content = (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
          <XAxis
            dataKey="date"
            className="text-[10px] uppercase font-bold tracking-tighter"
            stroke="hsl(var(--muted-foreground))"
            tickLine={false}
            axisLine={false}
            minTickGap={30}
          />
          <YAxis
            className="text-[10px] font-bold"
            stroke="hsl(var(--muted-foreground))"
            tickLine={false}
            axisLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "calc(var(--radius) - 2px)",
              fontSize: "12px",
            }}
            labelStyle={{ fontWeight: "bold", marginBottom: "4px" }}
            itemStyle={{ padding: 0 }}
            cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "4 4" }}
            formatter={(value: number) => [value, "Score"]}
            labelFormatter={(label, payload) => {
              if (payload && payload[0]) {
                return payload[0].payload.fullDate
              }
              return label
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4, stroke: "hsl(var(--background))" }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )

  if (standalone) return content

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">Sign in to view your score history</div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Score History - {mode.charAt(0).toUpperCase() + mode.slice(1)}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center text-destructive py-8">
            Error loading score history: {error}
            <br />
            <Button variant="outline" onClick={loadHistory} className="mt-4 bg-transparent">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Score History - {mode.charAt(0).toUpperCase() + mode.slice(1)}</CardTitle>
            <Button variant="ghost" size="icon" onClick={loadHistory} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            No score history yet. Play some games to see your progress!
            <br />
            <span className="text-xs mt-2 block">
              Note: Scores are only saved when they beat your previous best for this mode.
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Score History - {mode.charAt(0).toUpperCase() + mode.slice(1)}</CardTitle>
          <Button variant="ghost" size="icon" onClick={loadHistory} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="graph" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="graph">Graph</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
          </TabsList>

          <TabsContent value="graph" className="mt-4">
            {content}
          </TabsContent>

          <TabsContent value="table" className="mt-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...history].reverse().map((entry, index) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="text-right font-bold">{entry.score}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(entry.createdAt, "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(entry.createdAt, "h:mm a")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 text-sm text-muted-foreground text-center">Total games: {history.length}</div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
