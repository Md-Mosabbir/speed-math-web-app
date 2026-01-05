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
      <ResponsiveContainer width="100%" height={400}>
        <LineChart 
          data={chartData} 
          margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke="hsl(var(--muted-foreground))"
            opacity={0.2}
          />
          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            minTickGap={20}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "calc(var(--radius) - 2px)",
              color: "hsl(var(--foreground))",
              fontSize: "13px",
              padding: "8px 12px",
            }}
            labelStyle={{ 
              fontWeight: "bold", 
              marginBottom: "6px",
              color: "hsl(var(--foreground))",
            }}
            itemStyle={{ 
              padding: "2px 0",
              color: "hsl(var(--foreground))",
            }}
            cursor={{ 
              stroke: "#3b82f6", 
              strokeWidth: 2,
              strokeDasharray: "5 5",
              opacity: 0.5,
            }}
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
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ 
              fill: "#3b82f6", 
              strokeWidth: 2, 
              r: 5, 
              stroke: "hsl(var(--card))",
            }}
            activeDot={{ 
              r: 7, 
              strokeWidth: 2,
              stroke: "#3b82f6",
              fill: "#60a5fa",
            }}
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )

  if (standalone) return content

  if (!user) {
    return (
      <div className="w-full">
        <div className="text-xl font-bold capitalize mb-4">{mode}</div>
        <div className="text-center text-muted-foreground py-12">Sign in to view your score history</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-full">
        <div className="text-xl font-bold capitalize mb-4">{mode}</div>
        <div className="text-center text-muted-foreground py-12">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xl font-bold capitalize">{mode}</div>
          <Button variant="ghost" size="icon" onClick={loadHistory} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div className="text-center text-destructive py-12">
          Error loading score history: {error}
          <br />
          <Button variant="outline" onClick={loadHistory} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xl font-bold capitalize">{mode}</div>
          <Button variant="ghost" size="icon" onClick={loadHistory} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div className="text-center text-muted-foreground py-12">
          No score history yet. Play some games to see your progress!
          <br />
          <span className="text-xs mt-2 block">
            Note: Scores are only saved when they beat your previous best for this mode.
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <Tabs defaultValue="graph" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xl font-bold capitalize">{mode}</div>
          <Button variant="ghost" size="icon" onClick={loadHistory} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="graph">Graph</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
        </TabsList>

        <TabsContent value="graph" className="mt-0">
          {content}
        </TabsContent>

        <TabsContent value="table" className="mt-0">
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
                    <TableCell className="text-right font-bold text-lg">{entry.score}</TableCell>
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
    </div>
  )
}
