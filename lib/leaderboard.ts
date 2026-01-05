import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  where,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData
} from "firebase/firestore"
import { db } from "./firebase"

export interface LeaderboardEntry {
  id: string
  uid: string
  displayName: string
  score: number
  mode: string
  createdAt: Timestamp
}

export interface LeaderboardEntryWithDate extends Omit<LeaderboardEntry, "createdAt"> {
  createdAt: Date
}

/**
 * Submit a score to the leaderboard
 * Only call this when the game ends and score is higher than previous best
 */
export async function submitScore(
  uid: string,
  displayName: string,
  score: number,
  mode: string
): Promise<void> {
  try {
    await addDoc(collection(db, "leaderboard"), {
      uid,
      displayName,
      score,
      mode,
      createdAt: Timestamp.now(),
    })
  } catch (error) {
    console.error("Error submitting score:", error)
    throw error
  }
}

/**
 * Get the user's highest score for a specific mode
 */
export async function getUserHighestScore(
  uid: string,
  mode: string
): Promise<number> {
  try {
    const q = query(
      collection(db, "leaderboard"),
      where("uid", "==", uid),
      where("mode", "==", mode),
      orderBy("score", "desc"),
      limit(1)
    )
    
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return 0
    }
    
    return querySnapshot.docs[0].data().score as number
  } catch (error) {
    console.error("Error getting user highest score:", error)
    return 0
  }
}

/**
 * Get top leaderboard entries
 */
export async function getLeaderboard(
  mode?: string,
  limitCount: number = 20
): Promise<LeaderboardEntryWithDate[]> {
  try {
    let querySnapshot
    
    if (mode) {
      // Try to query with mode filter and orderBy
      // This requires a composite index: mode (ascending) + score (descending)
      try {
        const q = query(
          collection(db, "leaderboard"),
          where("mode", "==", mode),
          orderBy("score", "desc"),
          limit(limitCount * 2) // Get more to account for grouping
        )
        querySnapshot = await getDocs(q)
      } catch (indexError: any) {
        // If composite index is missing, fall back to client-side filtering
        console.warn("Composite index may be missing, using client-side filtering:", indexError)
        const q = query(
          collection(db, "leaderboard"),
          orderBy("score", "desc"),
          limit(limitCount * 10) // Get more entries for client-side filtering
        )
        querySnapshot = await getDocs(q)
      }
    } else {
      const q = query(
        collection(db, "leaderboard"),
        orderBy("score", "desc"),
        limit(limitCount * 2) // Get more to account for grouping
      )
      querySnapshot = await getDocs(q)
    }
    
    // Convert to entries
    const allEntries: LeaderboardEntryWithDate[] = []
    
    querySnapshot.docs.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data()
      const entry: LeaderboardEntryWithDate = {
        id: doc.id,
        uid: data.uid,
        displayName: data.displayName || "Anonymous",
        score: data.score,
        mode: data.mode,
        createdAt: data.createdAt?.toDate() || new Date(),
      }
      
      // Filter by mode on client side if needed (fallback)
      if (!mode || entry.mode === mode) {
        allEntries.push(entry)
      }
    })
    
    // Group by uid and get highest score per user
    // When filtering by mode, all entries are already for that mode, so just group by uid
    const userScores = new Map<string, LeaderboardEntryWithDate>()
    
    allEntries.forEach((entry) => {
      const existing = userScores.get(entry.uid)
      
      if (!existing || entry.score > existing.score) {
        userScores.set(entry.uid, entry)
      }
    })
    
    // Convert to array and sort by score
    const entries = Array.from(userScores.values())
    entries.sort((a, b) => b.score - a.score)
    
    return entries.slice(0, limitCount)
  } catch (error) {
    console.error("Error getting leaderboard:", error)
    return []
  }
}

/**
 * Get user's score history for a specific mode
 */
export async function getUserScoreHistory(
  uid: string,
  mode: string
): Promise<LeaderboardEntryWithDate[]> {
  try {
    let querySnapshot
    
    // Try to query with composite index (uid + mode + createdAt)
    try {
      const q = query(
        collection(db, "leaderboard"),
        where("uid", "==", uid),
        where("mode", "==", mode),
        orderBy("createdAt", "asc")
      )
      querySnapshot = await getDocs(q)
    } catch (indexError: any) {
      // If composite index is missing, fall back to client-side filtering and sorting
      console.warn("Composite index may be missing, using client-side filtering:", indexError)
      try {
        // Try with just uid filter and orderBy
        const q = query(
          collection(db, "leaderboard"),
          where("uid", "==", uid),
          orderBy("createdAt", "asc")
        )
        querySnapshot = await getDocs(q)
      } catch (secondError: any) {
        // If that also fails, just get all entries for this user and sort client-side
        console.warn("OrderBy index may also be missing, fetching all and sorting client-side:", secondError)
        const q = query(
          collection(db, "leaderboard"),
          where("uid", "==", uid)
        )
        querySnapshot = await getDocs(q)
      }
    }
    
    const allEntries = querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        uid: data.uid,
        displayName: data.displayName || "Anonymous",
        score: data.score,
        mode: data.mode,
        createdAt: data.createdAt?.toDate() || new Date(),
      }
    })
    
    // Filter by mode on client side if needed (fallback)
    const filteredEntries = allEntries.filter((entry) => entry.mode === mode)
    
    // Sort by createdAt ascending
    filteredEntries.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    
    return filteredEntries
  } catch (error) {
    console.error("Error getting user score history:", error)
    return []
  }
}

