"use client"

import ProgressReimbursementManagement from "@/components/progress-reimbursement-management"
import OperationGuide from "@/components/operation-guide"
import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useUser } from "@/contexts/UserContext"

export default function ProgressManagementPage() {
  const { currentUser } = useUser()
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-between mb-6 p-6 pb-0">
        <h1 className="text-3xl font-bold tracking-tight">进度管理</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              操作说明
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>进度管理操作说明</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <OperationGuide defaultModule="progress" />
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <ProgressReimbursementManagement currentUser={currentUser} />
    </div>
  )
} 