"use client"

import type React from "react"
import { useEffect, useState, useMemo } from "react"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, Eye } from "lucide-react"

import { getApprovalsAction, approveProjectAction, getProjectByIdAction } from "../app/actions"
import { type Approval, type Project } from "@/lib/data"
import { useUser } from "@/contexts/UserContext"
import ProjectDetailView from "./project-detail-view"

export default function ApprovalList() {
  const { currentUser } = useUser()
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null)
  const [approvalAction, setApprovalAction] = useState<"同意" | "驳回" | null>(null)
  const [comments, setComments] = useState("")
  
  // 项目详情查看相关状态
  const [isViewingProject, setIsViewingProject] = useState(false)
  const [viewingProject, setViewingProject] = useState<Project | null>(null)
  const [loadingProject, setLoadingProject] = useState(false)

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const fetchApprovals = async () => {
    setLoading(true)
    const fetchedApprovals = await getApprovalsAction(currentUser)
    setApprovals(fetchedApprovals)
    setLoading(false)
  }

  useEffect(() => {
    fetchApprovals()
  }, [currentUser])

  // 分页逻辑
  const totalPages = Math.ceil(approvals.length / itemsPerPage)
  const paginatedApprovals = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return approvals.slice(startIndex, endIndex)
  }, [approvals, currentPage, itemsPerPage])

  const handleApprovalClick = (approval: Approval, action: "同意" | "驳回") => {
    setSelectedApproval(approval)
    setApprovalAction(action)
    setComments("")
    setIsApprovalModalOpen(true)
  }

  const handleViewProject = async (approval: Approval) => {
    setLoadingProject(true)
    try {
      const project = await getProjectByIdAction(approval.projectId)
      if (project) {
        setViewingProject(project)
        setIsViewingProject(true)
      } else {
        alert("无法获取项目详情")
      }
    } catch (error) {
      console.error("获取项目详情失败:", error)
      alert("获取项目详情失败")
    } finally {
      setLoadingProject(false)
    }
  }

  const handleBackFromProjectView = () => {
    setIsViewingProject(false)
    setViewingProject(null)
  }

  const handleApprovalSubmit = async () => {
    if (!selectedApproval || !approvalAction) return

    if (approvalAction === "驳回" && !comments.trim()) {
      alert("驳回时必须填写意见")
      return
    }

    const result = await approveProjectAction(
      selectedApproval.id,
      approvalAction,
      comments.trim() || undefined
    )

    if (result.success) {
      alert(result.message)
      fetchApprovals() // 刷新审批列表
      setIsApprovalModalOpen(false)
      setSelectedApproval(null)
      setApprovalAction(null)
      setComments("")
    } else {
      alert(result.message)
    }
  }

  const getStatusColor = (status: Approval["status"]) => {
    switch (status) {
      case "待审批":
        return "bg-yellow-200 text-yellow-800"
      case "已同意":
        return "bg-green-200 text-green-800"
      case "已驳回":
        return "bg-red-200 text-red-800"
      default:
        return "bg-gray-200 text-gray-800"
    }
  }

  if (currentUser.role !== "中心领导" && currentUser.role !== "部门领导" && currentUser.role !== "中心专职" && currentUser.role !== "部门专职" && currentUser.role !== "分管院领导") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">您没有权限查看审批列表</p>
      </div>
    )
  }

  // 如果正在查看项目详情，显示项目详情页面
  if (isViewingProject && viewingProject) {
    return (
      <ProjectDetailView 
        project={viewingProject} 
        onBack={handleBackFromProjectView} 
      />
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <h2 className="text-2xl font-bold text-gray-800">待办列表</h2>
        <Button onClick={fetchApprovals} variant="outline">
          刷新
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-600 flex-1 flex items-center justify-center">加载中...</div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>项目名称</TableHead>
                  <TableHead>提交人</TableHead>
                  <TableHead>提交时间</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>审批时间</TableHead>
                  <TableHead>审批意见</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedApprovals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-4">
                      暂无审批项目
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedApprovals.map((approval) => (
                    <TableRow key={approval.id}>
                      <TableCell className="font-medium">{approval.projectName}</TableCell>
                      <TableCell>{approval.submitter}</TableCell>
                      <TableCell>{new Date(approval.submittedAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(approval.status)}`}>
                          {approval.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {approval.approvedAt ? new Date(approval.approvedAt).toLocaleString() : "-"}
                      </TableCell>
                      <TableCell>{approval.comments || "-"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {/* 查看按钮 - 所有状态都可以查看 */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewProject(approval)}
                          disabled={loadingProject}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          查看
                        </Button>
                        
                        {/* 审批按钮 - 只有待审批状态才显示 */}
                        {approval.status === "待审批" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApprovalClick(approval, "同意")}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              同意
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApprovalClick(approval, "驳回")}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              驳回
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* 分页控件 - 移到表格容器内部 */}
          {approvals.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <Label htmlFor="items-per-page">每页显示</Label>
                <Select
                  value={String(itemsPerPage)}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value))
                    setCurrentPage(1) // 重置到第一页
                  }}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一页
                </Button>
                <span className="text-sm text-gray-700">
                  第 {currentPage} 页 / 共 {totalPages} 页
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  下一页
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 审批确认模态框 */}
      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {approvalAction === "同意" ? "同意" : "驳回"}项目审批
            </DialogTitle>
            <DialogDescription>
              项目：{selectedApproval?.projectName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="comments">
                审批意见 {approvalAction === "驳回" && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={
                  approvalAction === "同意" 
                    ? "请填写同意意见（可选）" 
                    : "请填写驳回原因（必填）"
                }
                className="min-h-[100px]"
                required={approvalAction === "驳回"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsApprovalModalOpen(false)}>
              取消
            </Button>
            <Button 
              type="button" 
              onClick={handleApprovalSubmit}
              variant={approvalAction === "同意" ? "default" : "destructive"}
            >
              确认{approvalAction}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 