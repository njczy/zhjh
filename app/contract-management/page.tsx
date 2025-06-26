"use client"

import ContractManagement from "@/components/contract-management"
import OperationGuide from "@/components/operation-guide"
import { useUser } from "@/contexts/UserContext"
import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function ContractManagementPage() {
  const { currentUser } = useUser()
  
  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-6 p-6 pb-0">
        <h1 className="text-3xl font-bold tracking-tight">合同管理</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              操作说明
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>合同管理操作说明</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <OperationGuide defaultModule="contract" />
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <ContractManagement currentUser={currentUser} />
    </div>
  )
} 