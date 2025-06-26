"use client"

import ProcurementDocumentManagement from "@/components/procurement-document-management"
import OperationGuide from "@/components/operation-guide"
import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

// 模拟当前用户数据用于测试
const mockCurrentUser = {
  id: "1",
  name: "张三",
  role: "中心专职",
  department: "发展策划部",
  center: "运营中心"
}

export default function ProcurementManagementPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">采购管理</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              操作说明
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>采购管理操作说明</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <OperationGuide defaultModule="bidding" />
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <ProcurementDocumentManagement currentUser={mockCurrentUser} />
    </div>
  )
} 