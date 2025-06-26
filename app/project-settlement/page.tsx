"use client"

import { UserProvider } from '@/contexts/UserContext'
import ProjectSettlementManagement from '@/components/project-settlement-management'
import OperationGuide from "@/components/operation-guide"
import { mockUsers } from '@/lib/data'
import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function ProjectSettlementPage() {
  const defaultUser = mockUsers[9] // 王财务 - 财务部门专职

  return (
    <UserProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-between mb-6 p-6 pb-0">
          <h1 className="text-3xl font-bold tracking-tight">项目结算管理</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                操作说明
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>结算管理操作说明</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <OperationGuide defaultModule="settlement" />
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <ProjectSettlementManagement currentUser={defaultUser} />
      </div>
    </UserProvider>
  )
} 