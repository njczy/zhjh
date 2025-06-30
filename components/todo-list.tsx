"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle, XCircle, Clock, FileText, AlertTriangle, TrendingUp, Calendar, Folder, ExternalLink } from 'lucide-react'
import { useUser } from "@/contexts/UserContext"
import { getTodoItemsAction, processTodoItemAction, getApprovalReportByIdAction, getApprovalByIdAction, getProjectByIdAction } from "@/app/actions"
import type { TodoItem, ApprovalReport, Approval, Project } from "@/lib/data"

interface TodoListProps {
  onTodoProcessed?: () => void
}

export default function TodoList({ onTodoProcessed }: TodoListProps) {
  const router = useRouter()
  const { currentUser } = useUser()
  const [todoItems, setTodoItems] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null)
  const [relatedReport, setRelatedReport] = useState<ApprovalReport | null>(null)
  const [relatedApproval, setRelatedApproval] = useState<Approval | null>(null)
  const [relatedProject, setRelatedProject] = useState<Project | null>(null)
  const [processingComments, setProcessingComments] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const fetchTodoItems = async () => {
    try {
      setLoading(true)
      const items = await getTodoItemsAction(currentUser.id)
      // 过滤掉月度审核参与人确认的待办事项，只显示批复报告相关的待办
      const filteredItems = items.filter(item => 
        item.type !== "monthly_review_participant_confirm"
      )
      setTodoItems(filteredItems)
    } catch (error) {
      console.error('获取待办事项失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTodoItems()
  }, [currentUser.id])

  const handleTodoClick = async (todo: TodoItem) => {
    setSelectedTodo(todo)
    setProcessingComments("")
    setRelatedReport(null)
    setRelatedApproval(null)
    setRelatedProject(null)
    
    // 获取相关的批复报告信息
    if (todo.type === "approval_report_confirm" || todo.type === "approval_report_approve") {
      try {
        const report = await getApprovalReportByIdAction(todo.relatedId)
        setRelatedReport(report)
      } catch (error) {
        console.error('获取批复报告详情失败:', error)
      }
    }
    

    
    // 获取相关的项目审批信息
    if (todo.type === "project_approval") {
      try {
        const approval = await getApprovalByIdAction(todo.relatedId)
        if (approval) {
          setRelatedApproval(approval)
          // 获取项目信息
          const project = await getProjectByIdAction(approval.projectId)
          if (project) {
            setRelatedProject(project)
          }
        }
      } catch (error) {
        console.error('获取项目审批详情失败:', error)
      }
    }
  }

  const handleProcessTodo = async (action: "confirm" | "reject" | "approve") => {
    if (!selectedTodo) return

    try {
      setIsProcessing(true)
      const result = await processTodoItemAction(selectedTodo.id, action, processingComments)
      
      if (result.success) {
        alert(result.message)
        setSelectedTodo(null)
        setRelatedReport(null)
        setRelatedApproval(null)
        setRelatedProject(null)
        setProcessingComments("")
        await fetchTodoItems() // 刷新待办列表
        // 通知父组件更新待办数量
        if (onTodoProcessed) {
          onTodoProcessed()
        }
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error('处理待办事项失败:', error)
      alert('处理失败，请重试')
    } finally {
      setIsProcessing(false)
    }
  }

  const getTodoIcon = (type: TodoItem['type'], todo?: TodoItem) => {
    if (type === 'approval_report_confirm' && todo?.assignedBy === "系统通知") {
      return <AlertTriangle className="h-4 w-4 text-orange-500" />
    }
    
    switch (type) {
      case 'approval_report_confirm':
        return <FileText className="h-4 w-4" />
      case 'approval_report_approve':
        return <CheckCircle className="h-4 w-4" />
      case 'project_approval':
        return <CheckCircle className="h-4 w-4 text-blue-500" />

      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getTodoTypeLabel = (type: TodoItem['type'], todo?: TodoItem) => {
    if (type === 'approval_report_confirm' && todo?.assignedBy === "系统通知") {
      return '驳回通知'
    }
    
    switch (type) {
      case 'approval_report_confirm':
        return '批复报告确认'
      case 'approval_report_approve':
        return '批复报告审批'
      case 'project_approval':
        return '项目审批'

      default:
        return '待办事项'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (todoItems.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无待办事项</h3>
          <p className="text-gray-500">您目前没有需要处理的批复报告确认或项目审批</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">我的待办</h2>
        <Badge variant="secondary">{todoItems.length} 项待办</Badge>
      </div>

      <div className="space-y-3">
        {todoItems.map((todo) => (
          <Card key={todo.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTodoClick(todo)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getTodoIcon(todo.type, todo)}
                  <CardTitle className="text-base">{todo.title}</CardTitle>
                </div>
                <Badge variant={todo.assignedBy === "系统通知" ? "destructive" : "outline"}>
                  {getTodoTypeLabel(todo.type, todo)}
                </Badge>
              </div>
              <CardDescription>{todo.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>分配人: {todo.assignedBy}</span>
                <span>{new Date(todo.createdAt).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 处理待办事项的对话框 */}
      <Dialog open={!!selectedTodo} onOpenChange={() => setSelectedTodo(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedTodo && getTodoIcon(selectedTodo.type, selectedTodo)}
              <span>{selectedTodo?.title}</span>
            </DialogTitle>
            <DialogDescription>
              {selectedTodo?.description}
            </DialogDescription>
          </DialogHeader>

          {relatedReport && (
            <div className="space-y-4">
              {/* 批复报告基本信息 */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-medium mb-3 text-blue-800 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  批复报告基本信息
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">报告类型:</span>
                    <div className="text-gray-900">{relatedReport.templateName}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">包含项目:</span>
                    <div className="text-gray-900">{relatedReport.selectedProjects.length} 个</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">提交人:</span>
                    <div className="text-gray-900">{relatedReport.submittedBy}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">提交时间:</span>
                    <div className="text-gray-900">{new Date(relatedReport.submittedAt).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* 批复报告信息 */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800 flex items-center">
                  <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-2 text-xs font-bold text-green-600">
                    {relatedReport.selectedProjects.length}
                  </span>
                  批复报告信息
                </h4>
                
                {relatedReport.selectedProjects.map((projectId, index) => {
                  // 从tableData中获取该项目的填写内容
                  const projectData = Array.isArray(relatedReport.tableData) 
                    ? relatedReport.tableData.find((item: any) => item.projectId === projectId)
                    : relatedReport.tableData?.[projectId];
                  
                  return (
                    <div key={projectId} className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center mb-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                          <span className="text-blue-600 text-xs font-bold">{index + 1}</span>
                        </div>
                        <h5 className="font-medium text-gray-900">项目 #{index + 1}</h5>
                        <span className="ml-2 text-xs text-gray-500">ID: {projectId}</span>
                      </div>
                      
                      {projectData && Object.keys(projectData).length > 0 ? (
                        <div className="space-y-4">
                          {/* 基础信息 - 参考填写界面样式 */}
                          {(projectData.projectType || projectData.responsibleDept || projectData.projectManager || projectData.implementationYear) && (
                            <div className="relative bg-gradient-to-r from-blue-50/50 to-indigo-50/30 rounded-xl p-5 border border-blue-200/50">
                              <div className="absolute top-3 left-3 w-1 h-8 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-full"></div>
                              <h4 className="text-lg font-bold text-gray-800 mb-4 pl-6 flex items-center">
                                <span className="text-blue-600 mr-2">📋</span>
                                基础信息
                              </h4>
                              <div className="pl-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {projectData.projectType && (
                                  <div className="space-y-2">
                                    <label className="flex items-center text-sm font-semibold text-gray-700">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                      项目类型
                                    </label>
                                    <div className="p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900">
                                      {projectData.projectType}
                                    </div>
                                  </div>
                                )}
                                {projectData.responsibleDept && (
                                  <div className="space-y-2">
                                    <label className="flex items-center text-sm font-semibold text-gray-700">
                                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                                      责任部门
                                    </label>
                                    <div className="p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900">
                                      {projectData.responsibleDept}
                                    </div>
                                  </div>
                                )}
                                {projectData.projectManager && (
                                  <div className="space-y-2">
                                    <label className="flex items-center text-sm font-semibold text-gray-700">
                                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                                      项目负责人
                                    </label>
                                    <div className="p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900">
                                      {projectData.projectManager}
                                    </div>
                                  </div>
                                )}
                                {projectData.implementationYear && (
                                  <div className="space-y-2">
                                    <label className="flex items-center text-sm font-semibold text-gray-700">
                                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                      实施年份
                                    </label>
                                    <div className="p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900">
                                      {projectData.implementationYear}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 财务信息 - 参考填写界面样式 */}
                          {(projectData.plannedTotalIncome || projectData.adjustedTotalIncome || projectData.currentYearPlannedIncome || projectData.adjustedCurrentYearIncome || projectData.incomePlan || projectData.expensePlan) && (
                            <div className="relative bg-gradient-to-r from-emerald-50/50 to-teal-50/30 rounded-xl p-5 border border-emerald-200/50">
                              <div className="absolute top-3 left-3 w-1 h-8 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full"></div>
                              <h4 className="text-lg font-bold text-gray-800 mb-4 pl-6 flex items-center">
                                <span className="text-emerald-600 mr-2">💰</span>
                                财务信息
                              </h4>
                              <div className="pl-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {projectData.plannedTotalIncome && (
                                  <div className="space-y-2">
                                    <label className="flex items-center text-sm font-semibold text-gray-700">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                      计划总收入 (万元)
                                    </label>
                                    <div className="p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900">
                                      {projectData.plannedTotalIncome}
                                    </div>
                                  </div>
                                )}
                                {projectData.adjustedTotalIncome && (
                                  <div className="space-y-2">
                                    <label className="flex items-center text-sm font-semibold text-gray-700">
                                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                      调整后总收入 (万元)
                                    </label>
                                    <div className="p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900">
                                      {projectData.adjustedTotalIncome}
                                    </div>
                                  </div>
                                )}
                                {projectData.currentYearPlannedIncome && (
                                  <div className="space-y-2">
                                    <label className="flex items-center text-sm font-semibold text-gray-700">
                                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                                      当年计划收入 (万元)
                                    </label>
                                    <div className="p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900">
                                      {projectData.currentYearPlannedIncome}
                                    </div>
                                  </div>
                                )}
                                {projectData.adjustedCurrentYearIncome && (
                                  <div className="space-y-2">
                                    <label className="flex items-center text-sm font-semibold text-gray-700">
                                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                                      调整后当年收入 (万元)
                                    </label>
                                    <div className="p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900">
                                      {projectData.adjustedCurrentYearIncome}
                                    </div>
                                  </div>
                                )}
                                {projectData.incomePlan && (
                                  <div className="space-y-2">
                                    <label className="flex items-center text-sm font-semibold text-gray-700">
                                      <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                                      收入计划 (万元)
                                    </label>
                                    <div className="p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900">
                                      {projectData.incomePlan}
                                    </div>
                                  </div>
                                )}
                                {projectData.expensePlan && (
                                  <div className="space-y-2">
                                    <label className="flex items-center text-sm font-semibold text-gray-700">
                                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                                      支出计划 (万元)
                                    </label>
                                    <div className="p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900">
                                      {projectData.expensePlan}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 项目详情 - 参考填写界面样式 */}
                          {projectData.projectDetails && (
                            <div className="relative bg-gradient-to-r from-slate-50/50 to-gray-50/30 rounded-xl p-5 border border-slate-200/50">
                              <div className="absolute top-3 left-3 w-1 h-8 bg-gradient-to-b from-slate-400 to-gray-500 rounded-full"></div>
                              <h4 className="text-lg font-bold text-gray-800 mb-4 pl-6 flex items-center">
                                <span className="text-slate-600 mr-2">📝</span>
                                项目详情
                              </h4>
                              <div className="pl-6">
                                <div className="p-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 leading-relaxed whitespace-pre-wrap min-h-[120px]">
                                  {projectData.projectDetails}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-yellow-50 rounded-md p-3 border border-yellow-200">
                          <div className="text-sm text-yellow-800 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            该项目未填写任何详细信息
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 批复报告审批意见输入框 */}
          {selectedTodo?.type === "approval_report_approve" && relatedReport && (
            <div className="space-y-2">
              <label className="text-sm font-medium">审批意见</label>
              <Textarea
                placeholder="请输入您的审批意见..."
                value={processingComments}
                onChange={(e) => setProcessingComments(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {relatedApproval && relatedProject && (
            <div className="space-y-4">
              <div className="rounded-lg p-4 bg-blue-50 border border-blue-200">
                <h4 className="font-medium mb-2">相关项目审批</h4>
                <div className="text-sm space-y-1">
                  <div><span className="font-medium">项目名称:</span> {relatedProject.name}</div>
                  <div><span className="font-medium">项目负责人:</span> {relatedProject.owner}</div>
                  <div><span className="font-medium">提交人:</span> {relatedApproval.submitter}</div>
                  <div><span className="font-medium">提交时间:</span> {new Date(relatedApproval.submittedAt).toLocaleString()}</div>
                  <div><span className="font-medium">当前状态:</span> 
                    <span className={`ml-1 px-2 py-1 rounded text-xs ${
                      relatedApproval.status === "待审批" ? "bg-yellow-100 text-yellow-700" :
                      relatedApproval.status === "已同意" ? "bg-green-100 text-green-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {relatedApproval.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div><span className="font-medium">项目描述:</span> {relatedProject.description}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/reserve-projects?project=${relatedProject.id}`)
                      }}
                      className="ml-2 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      查看详情
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">审批意见</label>
                <Textarea
                  placeholder="请输入您的审批意见..."
                  value={processingComments}
                  onChange={(e) => setProcessingComments(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}



          <DialogFooter className="space-x-2">
            {selectedTodo?.type === "approval_report_confirm" && (
              <Button
                onClick={() => handleProcessTodo("confirm")}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                确认无误
              </Button>
            )}
            
            {selectedTodo?.type === "approval_report_approve" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleProcessTodo("reject")}
                  disabled={isProcessing}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  驳回
                </Button>
                <Button
                  onClick={() => handleProcessTodo("approve")}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  同意
                </Button>
              </>
            )}
            
            {selectedTodo?.type === "project_approval" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleProcessTodo("reject")}
                  disabled={isProcessing}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  驳回
                </Button>
                <Button
                  onClick={() => handleProcessTodo("approve")}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  同意
                </Button>
              </>
            )}
            
            <Button variant="outline" onClick={() => setSelectedTodo(null)}>
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 