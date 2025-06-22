// contexts/UserContext.tsx
"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { mockUsers, type User } from "@/lib/data"

interface UserContextType {
  currentUser: User
  setCurrentUser: (user: User) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  // 先尝试从localStorage获取用户，如果没有则使用第一个mock用户
  const getInitialUser = (): User => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("currentUser")
      if (storedUser) {
        try {
          return JSON.parse(storedUser)
        } catch {
          // 如果解析失败，使用默认用户
        }
      }
    }
    return mockUsers[0]
  }

  const [currentUser, setCurrentUser] = useState<User>(getInitialUser)

  // 只在用户改变时保存到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("currentUser", JSON.stringify(currentUser))
    }
  }, [currentUser])

  return <UserContext.Provider value={{ currentUser, setCurrentUser }}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
