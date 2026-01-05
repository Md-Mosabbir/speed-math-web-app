"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, RotateCcw, Pause, Trophy, Heart } from "lucide-react"
import { cn } from "@/lib/utils"

type Mode = "addition" | "subtraction" | "multiplication" | "division"

interface Question {
  problem: string
  answer: number
  options: number[]
}

export function SpeedMathGame() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "gameover">("menu")
  const [mode, setMode] = useState<Mode>("addition")
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [lives, setLives] = useState(5)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [timeLeft, setTimeLeft] = useState(100)
  const [difficultyScale, setDifficultyScale] = useState(1) // Controls speed

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const lastTimeRef = useRef<number>(Date.now())

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem(`speed-math-high-${mode}`)
    if (saved) setHighScore(Number.parseInt(saved))
  }, [mode])

  // Save high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem(`speed-math-high-${mode}`, score.toString())
    }
  }, [score, highScore, mode])

  const generateQuestion = useCallback((currentMode: Mode): Question => {
    let a = Math.floor(Math.random() * 99) + 1
    let b = Math.floor(Math.random() * 99) + 1
    let problem = ""
    let answer = 0

    switch (currentMode) {
      case "addition":
        answer = a + b
        problem = `${a} + ${b}`
        break
      case "subtraction":
        if (a < b) [a, b] = [b, a]
        answer = a - b
        problem = `${a} - ${b}`
        break
      case "multiplication":
        a = Math.floor(Math.random() * 12) + 2 // Start from 2 to avoid too many 1s
        b = Math.floor(Math.random() * 12) + 2
        answer = a * b
        problem = `${a} × ${b}`
        break
      case "division":
        b = Math.floor(Math.random() * 11) + 2
        answer = Math.floor(Math.random() * 11) + 2
        a = answer * b
        problem = `${a} ÷ ${b}`
        break
    }

    const optionsSet = new Set<number>([answer])

    const addOption = (val: number) => {
      if (val > 0 && val !== answer && !optionsSet.has(val)) {
        optionsSet.add(val)
        return true
      }
      return false
    }

    // Operation-specific wrong answer strategies
    if (currentMode === "addition" || currentMode === "subtraction") {
      // Strategy 1: Same last digit (±10 or ±20)
      const offsets = [10, -10, 20, -20].sort(() => Math.random() - 0.5)
      for (const offset of offsets) {
        if (addOption(answer + offset)) break
      }

      // Strategy 2: Off-by-one errors (carry/borrow mistakes)
      const carryMistakes = [1, -1, 9, -9, 11, -11].sort(() => Math.random() - 0.5)
      for (const mistake of carryMistakes) {
        if (addOption(answer + mistake)) break
      }
    } else if (currentMode === "multiplication") {
      // Strategy 1: Nearby multiples
      const factors = [a, b]
      const chosenFactor = factors[Math.floor(Math.random() * factors.length)]
      const multOffsets = [chosenFactor, -chosenFactor, chosenFactor * 2, -chosenFactor * 2].sort(
        () => Math.random() - 0.5,
      )
      for (const offset of multOffsets) {
        if (addOption(answer + offset)) break
      }

      // Strategy 2: Off-by-one factor errors
      const factorMistakes = [a, -a, b, -b, 1, -1].sort(() => Math.random() - 0.5)
      for (const mistake of factorMistakes) {
        if (addOption(answer + mistake)) break
      }
    } else if (currentMode === "division") {
      // Strategy 1: Related factors/quotients
      const divMistakes = [1, -1, 2, -2, b, -b].sort(() => Math.random() - 0.5)
      for (const mistake of divMistakes) {
        if (addOption(answer + mistake)) break
      }
    }

    // Fallback if strategies didn't yield enough options
    while (optionsSet.size < 3) {
      const fallbackOffset = Math.floor(Math.random() * 20) - 10
      addOption(answer + (fallbackOffset === 0 ? 5 : fallbackOffset))
    }

    return {
      problem,
      answer,
      options: Array.from(optionsSet).sort(() => Math.random() - 0.5),
    }
  }, [])

  const startGame = () => {
    setGameState("playing")
    setScore(0)
    setLives(5)
    setDifficultyScale(1)
    setTimeLeft(100)
    setCurrentQuestion(generateQuestion(mode))
    lastTimeRef.current = Date.now()
  }

  const handleAnswer = (selected: number) => {
    if (gameState !== "playing") return

    if (selected === currentQuestion?.answer) {
      setScore((s) => s + 1)
      setDifficultyScale((d) => Math.min(d + 0.05, 3)) // Speed up
      setTimeLeft(100)
      setCurrentQuestion(generateQuestion(mode))
    } else {
      setLives((l) => {
        if (l <= 1) {
          setGameState("gameover")
          return 0
        }
        return l - 1
      })
      // Briefly flash red or similar feedback would be good here
      setCurrentQuestion(generateQuestion(mode))
      setTimeLeft(100)
    }
  }

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing" || !currentQuestion) return
      if (e.key === "1") handleAnswer(currentQuestion.options[0])
      if (e.key === "2") handleAnswer(currentQuestion.options[1])
      if (e.key === "3") handleAnswer(currentQuestion.options[2])
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameState, currentQuestion])

  // Timer loop
  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const reduction = 0.8 * difficultyScale
          if (prev <= 0) {
            setLives((l) => {
              if (l <= 1) {
                setGameState("gameover")
                return 0
              }
              return l - 1
            })
            setCurrentQuestion(generateQuestion(mode))
            return 100
          }
          return prev - reduction
        })
      }, 50)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [gameState, difficultyScale, mode, generateQuestion])

  return (
    <Card className="w-full max-w-md overflow-hidden bg-card border-border shadow-2xl">
      <div className="p-6 flex flex-col items-center gap-8 min-h-[600px] justify-between">
        {/* Header Stats */}
        <div className="w-full flex justify-between items-center text-sm font-medium">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Trophy className="w-4 h-4 text-primary" />
            <span>Best: {highScore}</span>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Heart
                key={i}
                className={cn(
                  "w-5 h-5 transition-colors",
                  i < lives ? "fill-destructive text-destructive" : "text-muted",
                )}
              />
            ))}
          </div>
          <div className="text-xl font-bold text-primary tabular-nums">{score}</div>
        </div>

        {/* Main Area */}
        {gameState === "menu" && (
          <div className="flex flex-col items-center gap-8 w-full animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <h1 className="text-4xl font-black tracking-tighter text-balance uppercase">
                Speed <span className="text-primary">Math</span>
              </h1>
              <p className="text-muted-foreground mt-2">How fast can you calculate?</p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
              {(["addition", "subtraction", "multiplication", "division"] as Mode[]).map((m) => (
                <Button
                  key={m}
                  variant={mode === m ? "default" : "secondary"}
                  className="capitalize h-12 text-lg font-bold"
                  onClick={() => setMode(m)}
                >
                  {m}
                </Button>
              ))}
            </div>

            <Button size="lg" className="w-full h-16 text-2xl font-black rounded-full" onClick={startGame}>
              <Play className="mr-2 h-6 w-6 fill-current" /> START GAME
            </Button>
          </div>
        )}

        {(gameState === "playing" || gameState === "paused") && currentQuestion && (
          <div className="flex flex-col items-center gap-12 w-full">
            {/* Circular Timer & Problem */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted/20"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={754}
                  strokeDashoffset={754 - (754 * timeLeft) / 100}
                  strokeLinecap="round"
                  className={cn("text-primary transition-all duration-75", timeLeft < 30 && "text-destructive")}
                />
              </svg>
              <div className="text-center z-10">
                <div className="text-6xl font-black tracking-tighter tabular-nums">{currentQuestion.problem}</div>
              </div>
            </div>

            {/* Answer Options */}
            <div className="flex flex-col gap-4 w-full">
              {currentQuestion.options.map((opt, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="lg"
                  className="h-16 text-3xl font-black hover:bg-primary hover:text-primary-foreground transition-all duration-100 border-2 bg-transparent"
                  onClick={() => handleAnswer(opt)}
                >
                  <span className="absolute left-6 text-xs text-muted-foreground opacity-50">{i + 1}</span>
                  {opt}
                </Button>
              ))}
            </div>

            <div className="flex gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setGameState(gameState === "playing" ? "paused" : "playing")}
              >
                {gameState === "playing" ? <Pause /> : <Play />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setGameState("menu")}>
                <RotateCcw />
              </Button>
            </div>
          </div>
        )}

        {gameState === "gameover" && (
          <div className="flex flex-col items-center gap-8 w-full animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <h2 className="text-5xl font-black tracking-tighter text-destructive uppercase">Game Over</h2>
              <div className="mt-6 flex flex-col gap-2">
                <div className="text-muted-foreground uppercase text-xs font-bold tracking-widest">Final Score</div>
                <div className="text-7xl font-black text-primary">{score}</div>
              </div>
            </div>

            {score >= highScore && score > 0 && (
              <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold animate-bounce">
                New Personal Best!
              </div>
            )}

            <div className="flex flex-col gap-3 w-full mt-4">
              <Button size="lg" className="w-full h-16 text-xl font-bold rounded-full" onClick={startGame}>
                TRY AGAIN
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="w-full rounded-full"
                onClick={() => setGameState("menu")}
              >
                MAIN MENU
              </Button>
            </div>
          </div>
        )}

        {/* Footer/Pause Overlay */}
        {gameState === "paused" && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center flex flex-col gap-6">
              <h2 className="text-4xl font-black uppercase">Paused</h2>
              <Button size="lg" className="rounded-full px-12" onClick={() => setGameState("playing")}>
                RESUME
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
