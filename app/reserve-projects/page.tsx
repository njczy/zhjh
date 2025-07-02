"use client"

import React from 'react'
import ReserveProjectManagement from "@/components/reserve-project-management"
import OperationGuide from "@/components/operation-guide"
import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useIsMobile } from "@/components/ui/use-mobile"
import { cn } from "@/lib/utils"

export default function ReserveProjectsPage() {
  const isMobile = useIsMobile()
  
  return (
    <div className={cn(
      "w-full mx-auto",
      isMobile ? "p-4" : "p-6"
    )}>
      <div className={cn(
        "flex items-center justify-between mb-6",
        isMobile && "flex-col space-y-4 items-start"
      )}>
        <h1 className={cn(
          "font-bold tracking-tight",
          isMobile ? "text-2xl" : "text-3xl"
        )}>
          储备项目管理
        </h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                "flex items-center gap-2",
                isMobile && "w-full justify-center"
              )}
            >
              <BookOpen className="h-4 w-4" />
              操作说明
            </Button>
          </DialogTrigger>
          <DialogContent className={cn(
            "max-h-[90vh] overflow-y-auto",
            isMobile ? "max-w-[95vw] w-full" : "max-w-6xl"
          )}>
            <DialogHeader>
              <DialogTitle>储备及综合计划操作说明</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <OperationGuide />
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <ReserveProjectManagement />
    </div>
  )
} 