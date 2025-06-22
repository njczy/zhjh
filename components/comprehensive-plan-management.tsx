"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Plus, 
  Calendar,
  CheckCircle,
  AlertCircle,
  FileText
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"

import { 
  getCurrentYearPlansAction, 
  initializeYearlyPlansAction,
  getAvailableReserveProjectsAction,
  addProjectsToComprehensivePlanAction,
  getProjectsInComprehensivePlansAction,
  removeProjectFromComprehensivePlanAction
} from "../app/actions"
import { 
  type ComprehensivePlan, 
  type Project, 
  type User,
  getProjectAffiliationDisplay 
} from "@/lib/data"
import ProjectDetailView from "./project-detail-view"

// 状态颜色映射
const statusColors = {
  "编制": "bg-blue-100 text-blue-800",
  "评审": "bg-yellow-100 text-yellow-800", 
  "批复": "bg-green-100 text-green-800",
  "下达": "bg-purple-100 text-purple-800"
}

// 计划状态颜色映射
const planStatusColors = {
  "草稿": "bg-gray-100 text-gray-800",
  "已发布": "bg-green-100 text-green-800",
  "已归档": "bg-red-100 text-red-800"
}

interface ComprehensivePlanManagementProps {
  currentUser: User
}

export default function ComprehensivePlanManagement({ currentUser }: ComprehensivePlanManagementProps) {
  // 状态管理
  const [plans, setPlans] = useState<ComprehensivePlan[]>([])
  const [compiledProjects, setCompiledProjects] = useState<Project[]>([]) // 已编制的项目
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]) // 可编制的项目（用于对话框）
  const [selectedPlanId, setSelectedPlanId] = useState<string>("") // 当前选中的计划ID
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [centerFilter, setCenterFilter] = useState<string>("all")
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>(undefined)
  const [endDateFilter, setEndDateFilter] = useState<Date | undefined>(undefined)
  
  // 计划编制相关状态
  const [isCompilationDialogOpen, setIsCompilationDialogOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<ComprehensivePlan | null>(null)
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // 项目详情查看状态
  const [viewingProject, setViewingProject] = useState<Project | null>(null)

  // 初始化数据
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 初始化年度计划
      await initializeYearlyPlansAction()
      
      // 获取当前年份的综合计划
      const plansData = await getCurrentYearPlansAction()
      setPlans(plansData)
      
      // 默认选择2025年计划
      if (plansData.length > 0 && !selectedPlanId) {
        const currentYear = new Date().getFullYear()
        const defaultPlan = plansData.find(p => p.year === currentYear) || plansData[0]
        setSelectedPlanId(defaultPlan.id)
      }
      
      // 获取已编制到综合计划中的项目（页面主要显示内容）
      const compiledProjectsData = await getProjectsInComprehensivePlansAction(currentUser)
      setCompiledProjects(compiledProjectsData)
      
      // 获取可编制的储备项目（状态为"批复"的项目，用于计划编制对话框）
      const availableProjectsData = await getAvailableReserveProjectsAction(currentUser)
      setAvailableProjects(availableProjectsData)
      
    } catch (error) {
      console.error("获取数据失败:", error)
    } finally {
      setLoading(false)
    }
  }

  // 智能搜索匹配函数
  const smartSearchMatch = (text: string, searchTerm: string): boolean => {
    if (!text || !searchTerm) return false
    
    const lowerText = text.toLowerCase()
    const lowerSearchTerm = searchTerm.toLowerCase()
    
    return lowerText.includes(lowerSearchTerm)
  }

  // 过滤已编制的项目（页面主要显示内容）
  const filteredCompiledProjects = useMemo(() => {
    return compiledProjects.filter(project => {
      // 搜索过滤
      const searchMatch = !searchTerm || 
        smartSearchMatch(project.name, searchTerm) ||
        smartSearchMatch(project.owner, searchTerm) ||
        smartSearchMatch(project.center, searchTerm) ||
        smartSearchMatch(project.department, searchTerm)
      
      // 状态过滤
      const statusMatch = statusFilter === "all" || project.status === statusFilter
      
      // 中心过滤
      const centerMatch = centerFilter === "all" || project.center === centerFilter
      
      // 根据选中的计划ID筛选项目
      const selectedPlan = plans.find(p => p.id === selectedPlanId)
      const planMatch = !selectedPlan || selectedPlan.projectIds.includes(project.id)
      
      return searchMatch && statusMatch && centerMatch && planMatch
    })
  }, [compiledProjects, searchTerm, statusFilter, centerFilter, selectedPlanId, plans])

  // 过滤可编制的项目（用于对话框）
  const filteredAvailableProjects = useMemo(() => {
    return availableProjects.filter(project => {
      // 搜索过滤
      const searchMatch = !searchTerm || 
        smartSearchMatch(project.name, searchTerm) ||
        smartSearchMatch(project.owner, searchTerm) ||
        smartSearchMatch(project.center, searchTerm) ||
        smartSearchMatch(project.department, searchTerm)
      
      return searchMatch
    })
  }, [availableProjects, searchTerm])

  // 获取所有中心选项
  const centerOptions = useMemo(() => {
    const centers = [...new Set(compiledProjects.map(p => p.center).filter(Boolean))]
    return centers.sort()
  }, [compiledProjects])

  // 处理计划编制
  const handleCompilation = async () => {
    if (!selectedPlan || selectedProjectIds.length === 0) {
      alert("请选择综合计划和要编制的项目")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await addProjectsToComprehensivePlanAction(selectedPlan.id, selectedProjectIds)
      
      if (result.success) {
        alert(result.message)
        // 重新获取数据
        await fetchData()
        // 关闭对话框
        setIsCompilationDialogOpen(false)
        setSelectedProjectIds([])
        setSelectedPlan(null)
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error("计划编制失败:", error)
      alert("计划编制失败，请重试")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理项目选择
  const handleProjectSelect = (projectId: string, checked: boolean) => {
    if (checked) {
      setSelectedProjectIds(prev => [...prev, projectId])
    } else {
      setSelectedProjectIds(prev => prev.filter(id => id !== projectId))
    }
  }

  // 全选/取消全选 - 用于主列表（已编制项目）
  const handleSelectAllCompiled = (checked: boolean) => {
    if (checked) {
      setSelectedProjectIds(filteredCompiledProjects.map(p => p.id))
    } else {
      setSelectedProjectIds([])
    }
  }

  // 全选/取消全选 - 用于对话框（可编制项目）
  const handleSelectAllAvailable = (checked: boolean) => {
    if (checked) {
      setSelectedProjectIds(filteredAvailableProjects.map(p => p.id))
    } else {
      setSelectedProjectIds([])
    }
  }

  // 处理项目移除
  const handleRemoveProject = async (project: Project) => {
    const selectedPlan = plans.find(p => p.id === selectedPlanId)
    if (!selectedPlan) {
      alert("请先选择一个综合计划")
      return
    }

    if (confirm(`确定要将项目"${project.name}"从"${selectedPlan.name}"中移除吗？\n\n移除后，项目状态将变为"批复"。`)) {
      try {
        const result = await removeProjectFromComprehensivePlanAction(selectedPlan.id, project.id)
        
        if (result.success) {
          alert(result.message)
          // 重新获取数据
          await fetchData()
        } else {
          alert(result.message)
        }
      } catch (error) {
        console.error("移除项目失败:", error)
        alert("移除项目失败，请重试")
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  // 如果正在查看项目详情，显示项目详情页面
  if (viewingProject) {
    return (
      <ProjectDetailView 
        project={viewingProject} 
        onBack={() => setViewingProject(null)} 
      />
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
      {/* 页面标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">计划编制及调整</h2>
            </div>

      {/* 综合计划概览卡片 */}
      <div className="mb-4">
        <div className="flex gap-2">
          {plans.map(plan => (
            <div 
              key={plan.id} 
              className={`flex items-center border rounded px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                selectedPlanId === plan.id 
                  ? 'bg-teal-50 border-teal-300 text-teal-700' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedPlanId(plan.id)}
            >
              <span className="font-medium mr-2">{plan.name}</span>
              <span className="text-gray-500 ml-2 text-xs">项目数: {plan.projectIds.length}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 筛选条件和操作按钮 */}
      <div className="mb-6 flex gap-3 items-end">
        <div className="w-[120px]">
          <Label className="block text-sm font-medium text-gray-700 mb-1">储备项目</Label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-500 z-10" />
            <Input
              placeholder="项目名称"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-sm h-8"
            />
          </div>
        </div>

        <div className="w-[120px]">
          <Label className="block text-sm font-medium text-gray-700 mb-1">项目会议</Label>
          <Input placeholder="项目负责人" className="text-sm h-8" />
        </div>

        <div className="w-[120px]">
          <Label className="block text-sm font-medium text-gray-700 mb-1">项目类型</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="text-sm h-8">
              <SelectValue placeholder="项目状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="批复">批复</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-[120px]">
          <Label className="block text-sm font-medium text-gray-700 mb-1">责任部门</Label>
          <Select value={centerFilter} onValueChange={setCenterFilter}>
            <SelectTrigger className="text-sm h-8">
              <SelectValue placeholder="所属中心" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              {centerOptions.map(center => (
                <SelectItem key={center} value={center}>{center}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-[120px]">
          <Label className="block text-sm font-medium text-gray-700 mb-1">项目编号</Label>
          <Input placeholder="项目编号" className="text-sm h-8" />
        </div>

        <div className="w-[120px]">
          <Label className="block text-sm font-medium text-gray-700 mb-1">开始时间</Label>
          <div className="relative">
            <Input
              type="date"
              value={startDateFilter ? format(startDateFilter, "yyyy-MM-dd") : ""}
              onChange={(e) => {
                if (e.target.value) {
                  setStartDateFilter(new Date(e.target.value))
                } else {
                  setStartDateFilter(undefined)
                }
              }}
              className="text-sm h-8"
              placeholder="选择开始时间"
            />
          </div>
        </div>

        <div className="w-[120px]">
          <Label className="block text-sm font-medium text-gray-700 mb-1">结束时间</Label>
          <div className="relative">
            <Input
              type="date"
              value={endDateFilter ? format(endDateFilter, "yyyy-MM-dd") : ""}
              onChange={(e) => {
                if (e.target.value) {
                  setEndDateFilter(new Date(e.target.value))
                } else {
                  setEndDateFilter(undefined)
                }
              }}
              className="text-sm h-8"
              placeholder="选择结束时间"
            />
          </div>
        </div>

        <div className="w-[120px]">
          <Label className="block text-sm font-medium text-gray-700 mb-1">实施年份</Label>
          <Input placeholder="实施年份" className="text-sm h-8" />
        </div>

        <div className="w-[100px]">
          <Label className="block text-sm font-medium text-gray-700 mb-1">备注</Label>
          <Input placeholder="备注" className="text-sm h-8" />
        </div>

        {/* 操作按钮区域 */}
        <div className="flex gap-2 ml-4 items-center">
          <div className="text-xs text-gray-600 mr-2 whitespace-nowrap">
            已选择 {selectedProjectIds.length} / {filteredCompiledProjects.length}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-teal-500 hover:bg-teal-600 text-white border-teal-500 text-xs px-2 py-1 h-8"
            onClick={() => {
              // 查询功能 - 重新获取数据
              fetchData()
            }}
          >
            查询
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-gray-500 hover:bg-gray-600 text-white border-gray-500 text-xs px-2 py-1 h-8"
            onClick={() => {
              // 重置所有筛选条件到默认值
              setSearchTerm("")
              setStatusFilter("all")
              setCenterFilter("all")
              setStartDateFilter(undefined)
              setEndDateFilter(undefined)
              setSelectedProjectIds([])
            }}
          >
            重置
          </Button>
          <Button 
            onClick={() => setIsCompilationDialogOpen(true)}
            size="sm"
            className="bg-teal-500 hover:bg-teal-600 text-white text-xs px-2 py-1 h-8"
          >
            计划编制
          </Button>
        </div>
      </div>

      {/* 可编制项目列表 */}
      <div className="flex-1 overflow-hidden">        
        <ScrollArea className="h-full">
          <Table>
                          <TableHeader className="bg-teal-500">
                <TableRow>
                  <TableHead className="text-white w-[50px]">
                    <Checkbox
                      checked={selectedProjectIds.length === filteredCompiledProjects.length && filteredCompiledProjects.length > 0}
                      onCheckedChange={handleSelectAllCompiled}
                    />
                  </TableHead>
                <TableHead className="text-white">项目名称</TableHead>
                <TableHead className="text-white">项目负责人</TableHead>
                <TableHead className="text-white">项目负责人[下属部门]</TableHead>
                <TableHead className="text-white">项目责任人</TableHead>
                <TableHead className="text-white">投入</TableHead>
                <TableHead className="text-white">产出</TableHead>
                <TableHead className="text-white">实施年份</TableHead>
                <TableHead className="text-white">全部审核环节</TableHead>
                <TableHead className="text-white">备注</TableHead>
                <TableHead className="text-white">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompiledProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <AlertCircle className="h-8 w-8 mb-2" />
                      <p className="text-sm font-medium">暂无已编制项目</p>
                      <p className="text-xs text-gray-400">请通过"计划编制"按钮将储备项目添加到综合计划中</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompiledProjects.map((project, index) => (
                  <TableRow key={project.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <TableCell>
                      <Checkbox
                        checked={selectedProjectIds.includes(project.id)}
                        onCheckedChange={(checked) => handleProjectSelect(project.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>{project.owner}</TableCell>
                    <TableCell>{getProjectAffiliationDisplay(project)}</TableCell>
                    <TableCell>{project.owner}</TableCell>
                    <TableCell>投入金额(万元)</TableCell>
                    <TableCell>预计产出(万元)</TableCell>
                    <TableCell>2025年计划(万元)</TableCell>
                    <TableCell>
                      <Badge className={statusColors[project.status]}>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs px-2 py-1"
                          onClick={() => {
                            // 查看项目详情
                            setViewingProject(project)
                          }}
                        >
                          查看
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs px-2 py-1 text-red-600 hover:text-red-700"
                          onClick={() => {
                            // 从综合计划中移除项目
                            handleRemoveProject(project)
                          }}
                        >
                          移除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* 计划编制对话框 */}
      <Dialog open={isCompilationDialogOpen} onOpenChange={setIsCompilationDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>计划编制</span>
            </DialogTitle>
            <DialogDescription>
              将选中的储备项目添加到综合计划中，项目状态将更新为"下达"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* 选择综合计划 */}
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                选择综合计划
              </Label>
              <Select 
                value={selectedPlan?.id || ""} 
                onValueChange={(planId) => {
                  const plan = plans.find(p => p.id === planId)
                  setSelectedPlan(plan || null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择要编制的综合计划..." />
                </SelectTrigger>
                <SelectContent>
                  {plans.filter(p => p.status !== "已归档").map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} ({plan.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 项目选择 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-gray-700">
                  选择要编制的项目 ({selectedProjectIds.length}/{filteredAvailableProjects.length})
                </Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedProjectIds.length === filteredAvailableProjects.length && filteredAvailableProjects.length > 0}
                    onCheckedChange={handleSelectAllAvailable}
                  />
                  <span className="text-sm text-gray-600">全选</span>
                </div>
              </div>
              
              <ScrollArea className="h-80 border rounded-md">
                <Table>
                  <TableHeader className="bg-teal-500">
                    <TableRow>
                      <TableHead className="text-white w-[50px]">选择</TableHead>
                      <TableHead className="text-white">项目名称</TableHead>
                      <TableHead className="text-white">项目负责人</TableHead>
                      <TableHead className="text-white">项目负责人[下属部门]</TableHead>
                      <TableHead className="text-white">项目责任人</TableHead>
                      <TableHead className="text-white">投入</TableHead>
                      <TableHead className="text-white">产出</TableHead>
                      <TableHead className="text-white">实施年份</TableHead>
                      <TableHead className="text-white">全部审核环节</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAvailableProjects.map((project, index) => (
                      <TableRow key={project.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProjectIds.includes(project.id)}
                            onCheckedChange={(checked) => handleProjectSelect(project.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>{project.owner}</TableCell>
                        <TableCell>{getProjectAffiliationDisplay(project)}</TableCell>
                        <TableCell>{project.owner}</TableCell>
                        <TableCell>投入金额(万元)</TableCell>
                        <TableCell>预计产出(万元)</TableCell>
                        <TableCell>2025年计划(万元)</TableCell>
                        <TableCell>
                          <Badge className={statusColors[project.status]} variant="outline">
                            {project.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCompilationDialogOpen(false)
                setSelectedProjectIds([])
                setSelectedPlan(null)
              }}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button 
              onClick={handleCompilation}
              disabled={!selectedPlan || selectedProjectIds.length === 0 || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "编制中..." : `编制 ${selectedProjectIds.length} 个项目`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 