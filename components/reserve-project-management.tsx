"use client"

import type React from "react"
import { Eye, ListFilter, CalendarCheck, ChevronLeft, ChevronRight, ClipboardCheck, Menu, X } from "lucide-react" // Declare the Eye variable

import { useEffect, useState, useMemo, Suspense, useRef, useCallback } from "react"
import Link from "next/link"
import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUp, Plus, Edit, Trash, Search, RotateCcw, CalendarIcon, Upload, BookOpen } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useIsMobile } from "@/components/ui/use-mobile"


import { getProjectsAction, addProjectAction, updateProjectAction, deleteProjectAction, submitProjectForApprovalAction, initializeDataAction } from "../app/actions"
import {
  mockUsers,
  type Project,
  type ProjectStatus,
  type FinancialRow,
  AFFILIATION_OPTIONS,
  getProjectAffiliationDisplay,
  getDepartmentHead,
  getAvailableApprovers,
  checkUserPermission,
  PermissionMatrix,
} from "@/lib/data"
import { useUser } from "@/contexts/UserContext" // Import useUser
import { getTodoItemsAction } from "@/app/actions"
import MonthlyReviewsEmbedded from "./monthly-reviews-embedded"
import AddProjectReserve from "./add-project-reserve"
import ProjectDetailView from "./project-detail-view"
import TodoList from "./todo-list"
import ComprehensivePlanManagement from "./comprehensive-plan-management"
import BiddingDocumentManagement from "./bidding-document-management"
import ProcurementDocumentManagement from "./procurement-document-management"
import ContractManagement from "./contract-management"
import ProgressReimbursementManagement from "./progress-reimbursement-management"
import InvoiceManagementComponent from "./invoice-management"
import ProjectSettlementManagement from "./project-settlement-management"
import BankReconciliationManagement from "./bank-reconciliation-management"

// 增强的日期选择器组件
function EnhancedDatePicker({ 
  date, 
  onDateChange, 
  placeholder,
  disabled = false
}: { 
  date: Date | undefined
  onDateChange: (date: Date | undefined) => void
  placeholder: string
  disabled?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(date || new Date())
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const currentYear = currentMonth.getFullYear()
  // 生成从1990年到2050年的年份范围
  const years = Array.from({ length: 61 }, (_, i) => 1990 + i)
  
  // 计算当前年份在列表中的索引，用于滚动定位
  const currentYearIndex = years.findIndex(year => year === currentYear)

  // 滚动到当前年份的函数
  const scrollToCurrentYear = () => {
    if (scrollContainerRef.current) {
      // 每个选项高度32px，要让当前年份在中间（第6行），需要滚动到：
      // (当前年份索引 - 5) * 32px
      const scrollTop = Math.max(0, (currentYearIndex - 5) * 32)
      scrollContainerRef.current.scrollTo({
        top: scrollTop,
        behavior: 'instant'
      })
    }
  }

  useEffect(() => {
    if (isOpen) {
      // 延迟执行滚动，确保DOM已渲染
      const timer = setTimeout(scrollToCurrentYear, 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen, currentYearIndex])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            disabled && "bg-gray-50"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "yyyy-MM-dd") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">快速选择年份</Label>
          </div>
          <Select
            value={currentYear.toString()}
            onValueChange={(year) => {
              const newDate = new Date(currentMonth)
              newDate.setFullYear(parseInt(year))
              setCurrentMonth(newDate)
            }}
            onOpenChange={(open) => {
              setIsOpen(open)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent 
              ref={scrollContainerRef}
              className="h-[352px] overflow-y-auto" 
              position="item-aligned"
              onCloseAutoFocus={(e) => {
                e.preventDefault()
              }}
            >
              {years.map((year) => (
                <SelectItem 
                  key={year} 
                  value={year.toString()}
                  className={cn(
                    "h-8",
                    year === currentYear && "bg-accent"
                  )}
                >
                  {year}年
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            onDateChange(selectedDate)
            setIsOpen(false)
          }}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          locale={zhCN}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

// 项目类型选项
const PROJECT_TYPES = [
  "调试试验",
  "经营计划/监督检测",
  "经营计划/零星检测",
  "技术咨询及培训",
  "成果转化",
  "租赁服务（收入）",
  "辅助设施建设",
  "生产能力建设",
  "科技开发",
  "运营费用",
  "租赁服务（支出）"
]

// 归口管理部门选项
const MANAGEMENT_DEPARTMENTS = [
  "发展策划部"
]

// 资金属性选项
const FUND_ATTRIBUTES = [
  "资本",
  "成本"
]

// 获取当前用户对应的负责人
const getAvailableLeaders = (currentUser: { name: string; department: string; center?: string; role?: string }) => {
  // 这里需要导入mockUsers，暂时先模拟数据
  const mockUsers = [
    { id: "1", name: "徐海燕", role: "中心专职", center: "运营中心", department: "" },
    { id: "2", name: "马文博", role: "中心专职", center: "运营中心", department: "" },
    { id: "3", name: "林雪梅", role: "中心领导", center: "运营中心", department: "" },
    { id: "7", name: "拓总", role: "部门专职", center: "", department: "发展策划部门" },
    { id: "8", name: "邵主任", role: "部门领导", center: "", department: "发展策划部门" },
  ]
  
  if (currentUser.center) {
    // 如果用户属于中心，返回同中心的中心领导
    return mockUsers.filter(user => user.role === "中心领导" && user.center === currentUser.center)
  } else if (currentUser.department) {
    // 如果用户属于部门，返回同部门的部门领导
    return mockUsers.filter(user => user.role === "部门领导" && user.department === currentUser.department)
  }
  
  return []
}

// 定义项目状态的排序优先级
const PROJECT_STATUS_ORDER: Record<ProjectStatus, number> = {
  编制: 0,
  评审: 1,
  批复: 2,
  下达: 3,
}

// 智能搜索匹配函数
const smartSearchMatch = (text: string, searchTerm: string): boolean => {
  if (!text || !searchTerm) return false
  
  const lowerText = text.toLowerCase()
  const lowerSearchTerm = searchTerm.toLowerCase()
  
  // 直接包含匹配
  if (lowerText.includes(lowerSearchTerm)) return true
  
  // 拼音首字母匹配（简化版）
  const pinyinMap: { [key: string]: string } = {
    '编制': 'bz', '评审': 'ps', '批复': 'pf', '下达': 'xd',
    '调试试验': 'dssy', '经营计划': 'jyjh', '技术咨询': 'jszx',
    '监督检测': 'jdjc', '零星检测': 'lxjc', '培训': 'px',
    '运营中心': 'yyzx', '发展策划部门': 'fzcgbm',
    '中央预算': 'zyys', '地方预算': 'dfys', '企业自筹': 'qyzc',
    '科研经费': 'kyjf', '专项资金': 'zxzj'
  }
  
  // 检查是否有匹配的拼音首字母
  for (const [chinese, pinyin] of Object.entries(pinyinMap)) {
    if (lowerText.includes(chinese) && pinyin.includes(lowerSearchTerm)) {
      return true
    }
  }
  
  // 分词匹配（按空格或标点分割）
  const words = lowerText.split(/[\s,，。、；;：:！!？?\(\)（）\[\]【】]/);
  return words.some(word => word.includes(lowerSearchTerm))
}

// 包装组件处理 useSearchParams
function ReserveProjectManagementWithParams() {
  const { currentUser, setCurrentUser } = useUser() // Use user from context
  const searchParams = useSearchParams()
  const [projects, setProjects] = useState<Project[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const isMobile = useIsMobile()
  
  // 编辑页面的额外状态
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()

  // 按年拆分时间段生成财务行
  const generateFinancialRowsByYear = (start: Date, end: Date) => {
    const rows: FinancialRow[] = []
    let currentYear = start.getFullYear()
    const endYear = end.getFullYear()
    
    while (currentYear <= endYear) {
      const yearStart = currentYear === start.getFullYear() ? start : new Date(currentYear, 0, 1)
      const yearEnd = currentYear === endYear ? end : new Date(currentYear, 11, 31)
      
      rows.push({
        id: `${currentYear}`,
        startTime: yearStart.toLocaleDateString('zh-CN'),
        endTime: yearEnd.toLocaleDateString('zh-CN'),
        plannedIncome: 0,
        incomeTaxRate: 13,
        plannedExpense: 0,
        expenseTaxRate: 13,
        grossMargin: 0
      })
      
      currentYear++
    }
    
    return rows
  }

  // 更新财务行数据
  const updateFinancialRow = (index: number, field: string, value: number) => {
    if (!currentProject?.financialRows) return
    
    const newRows = [...currentProject.financialRows]
    newRows[index] = { ...newRows[index], [field]: value }
    
    // 重新计算毛利率
    if (field === 'plannedIncome' || field === 'plannedExpense') {
      const row = newRows[index]
      if (row.plannedIncome > 0) {
        row.grossMargin = ((row.plannedIncome - row.plannedExpense) / row.plannedIncome) * 100
      } else {
        row.grossMargin = 0
      }
    }
    
    setCurrentProject(prev => prev ? { ...prev, financialRows: newRows } : null)
  }

  // 监听日期变化，自动生成财务行
  useEffect(() => {
    if (startDate && endDate && isEditing && currentProject && 
        (!currentProject.financialRows || currentProject.financialRows.length === 0)) {
      const newFinancialRows = generateFinancialRowsByYear(startDate, endDate)
      setCurrentProject(prev => prev ? { ...prev, financialRows: newFinancialRows } : null)
    }
  }, [startDate, endDate, isEditing, currentProject])
  
  // 审批相关状态
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
  const [selectedProjectForApproval, setSelectedProjectForApproval] = useState<Project | null>(null)
  const [selectedApprover, setSelectedApprover] = useState<string>("")
  const [currentView, setCurrentView] = useState<"projects" | "add-project" | "view-project" | "edit-project" | "todo">("projects")
  
  // 待办数量状态
  const [todoCount, setTodoCount] = useState(0)
  
  // Tab navigation states
  const [activeTab, setActiveTab] = useState("储备及综合计划")
  const [activeSubTab, setActiveSubTab] = useState("评审")

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | "所有">("所有")
  const [filterAffiliation, setFilterAffiliation] = useState<string | "所有">("所有")
  const [filterOwner, setFilterOwner] = useState<string | "所有">("所有")
  
  // 时间筛选状态
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>()
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>()

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    // Pass currentUser to the server action for role-based filtering
    const fetchedProjects = await getProjectsAction(currentUser)
    setProjects(fetchedProjects)
    setLoading(false)
  }, [currentUser])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects]) // Re-fetch projects when currentUser changes

  // Handle URL parameters for direct project access
  useEffect(() => {
    const projectId = searchParams.get('project')
    if (projectId && projects.length > 0) {
      const targetProject = projects.find(project => project.id === projectId)
      if (targetProject) {
        handleViewProject(targetProject)
      }
    }
  }, [searchParams, projects])

  // Memoized filtered projects
  const filteredProjects = useMemo(() => {
    let filtered = projects

    // Apply search term - 仅搜索列表显示的字段
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase()
      filtered = filtered.filter((project) => {
        // 只搜索列表中显示的字段
        const searchFields = [
          project.id,                            // 储备项目编码
          project.name,                          // 储备项目名称
          project.projectType,                   // 项目类型
          project.owner,                         // 项目负责人
          getProjectAffiliationDisplay(project), // 归口管理部门
          project.status,                        // 储备项目状态
          project.version,                       // 储备项目版本
          project.startDate,                     // 项目开始时间
          project.endDate                        // 项目结束时间
        ]

        // 检查任何字段是否匹配搜索词
        return searchFields.some(field => 
          field && smartSearchMatch(field.toString(), lowerCaseSearchTerm)
        )
      })
    }

    // Apply status filter
    if (filterStatus !== "所有") {
      filtered = filtered.filter((project) => project.status === filterStatus)
    }

    // Apply affiliation filter
    if (filterAffiliation !== "所有") {
      filtered = filtered.filter((project) => getProjectAffiliationDisplay(project) === filterAffiliation)
    }

    // Apply owner filter
    if (filterOwner !== "所有") {
      filtered = filtered.filter((project) => project.owner === filterOwner)
    }

    // Apply date range filter
    if (filterStartDate || filterEndDate) {
      filtered = filtered.filter((project) => {
        const projectCreatedDate = new Date(project.createdAt)
        const projectStartDate = project.startDate ? new Date(project.startDate) : null
        
        // 检查创建时间或开始时间是否在筛选范围内
        const checkCreatedDate = filterStartDate ? projectCreatedDate >= filterStartDate : true
        const checkCreatedEndDate = filterEndDate ? projectCreatedDate <= filterEndDate : true
        
        const checkStartDate = projectStartDate && filterStartDate ? projectStartDate >= filterStartDate : true
        const checkStartEndDate = projectStartDate && filterEndDate ? projectStartDate <= filterEndDate : true
        
        // 项目的创建时间或开始时间在筛选范围内即可
        return (checkCreatedDate && checkCreatedEndDate) || (checkStartDate && checkStartEndDate)
      })
    }

    return filtered
  }, [projects, searchTerm, filterStatus, filterAffiliation, filterOwner, filterStartDate, filterEndDate])

  // Memoized sorted projects
  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      // Primary sort by status
      const statusA = PROJECT_STATUS_ORDER[a.status]
      const statusB = PROJECT_STATUS_ORDER[b.status]

      if (statusA !== statusB) {
        return statusA - statusB
      }

      // Secondary sort by createdAt in descending order (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [filteredProjects])

  // Apply pagination to sorted projects
  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage)
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return sortedProjects.slice(startIndex, endIndex)
  }, [sortedProjects, currentPage, itemsPerPage])

  // Get unique filter options for affiliation from predefined options
  const uniqueAffiliations = useMemo(() => ["所有", ...new Set(AFFILIATION_OPTIONS.map((opt) => opt.display))], [])
  const uniqueOwners = useMemo(() => ["所有", ...new Set(projects.map((p) => p.owner))], [projects])
  const uniqueStatuses: (ProjectStatus | "所有")[] = useMemo(() => {
    const projectStatuses = [...new Set(projects.map((p) => p.status))]
    return ["所有", ...projectStatuses.sort()]
  }, [projects])

  const handleAddProject = () => {
    setCurrentView("add-project")
  }

  const handleBackToProjects = () => {
    setCurrentView("projects")
  }

  const handleEditProject = (project: Project) => {
    setCurrentProject({ ...project })
    // 编辑权限：
    // 1. 项目创建者可以编辑自己的编制状态项目（无论是否已提交审批）
    // 2. 中心领导可以编辑本中心专职创建的编制状态项目（无论是否已提交审批）
    const canEdit = project.status === "编制" && (
      project.owner === currentUser.name || // 项目创建者
      (currentUser.role === "中心领导" && project.center === currentUser.center && (project.department === "" || !project.department)) // 中心领导可以编辑本中心项目
    )
    setIsEditing(canEdit)
    
    // 初始化日期状态
    setStartDate(project.startDate ? new Date(project.startDate) : undefined)
    setEndDate(project.endDate ? new Date(project.endDate) : undefined)
    
    setCurrentView("edit-project")
  }

  const handleViewProject = (project: Project) => {
    setCurrentProject({ ...project })
    setCurrentView("view-project")
  }



  const handleDeleteProject = async (id: string) => {
    // 当前系统中没有角色具有删除权限
    alert("当前系统中没有用户具有删除项目的权限。")
    return
  }

  const handleSaveProject = async (event: React.FormEvent, isSubmitForApproval: boolean = false) => {
    event.preventDefault() // Prevent default form submission
    if (!currentProject) return

    const formData = new FormData(event.target as HTMLFormElement)
    formData.append("id", currentProject.id) // Ensure ID is passed for updates

    let result: Project | null = null
    if (currentProject.id) {
      // Edit existing project
      result = await updateProjectAction(formData)
      if (result) {
        setProjects(projects.map((p) => (p.id === result?.id ? result : p)))
        alert("项目更新成功！")
      } else {
        alert("项目更新失败。")
      }
    } else {
      // Add new project
      // 设置项目状态为"编制"
      formData.set("status", "编制")
      result = await addProjectAction(formData)
      if (result) {
        // 如果是提交审批，则立即提交审批
        if (isSubmitForApproval) {
          const availableApprovers = getAvailableApprovers(currentUser.department, currentUser.center)
          if (availableApprovers.length > 0) {
            const selectedApprover = availableApprovers[0].name
            const approvalResult = await submitProjectForApprovalAction(
              result.id,
              currentUser.name,
              selectedApprover
            )
            
            if (approvalResult.success) {
              // 更新项目状态为已提交审批
              const updatedProject = { ...result, isSubmittedForApproval: true }
              setProjects([...projects, updatedProject])
              alert("项目新增并提交审批成功！")
            } else {
              setProjects([...projects, result])
              alert(`项目新增成功，但提交审批失败: ${approvalResult.message}`)
            }
          } else {
            setProjects([...projects, result])
            alert("项目新增成功，但没有可用的审批人，请手动提交审批。")
          }
        } else {
          setProjects([...projects, result])
          alert("项目暂存成功！")
        }
      } else {
        alert("项目新增失败。")
      }
    }
    setIsModalOpen(false)
    setCurrentProject(null)
  }

  const handleSaveDraft = async () => {
    if (!currentProject) return

    // 直接调用保存逻辑
    await handleSaveProjectDirect(currentProject, false)
  }

  const handleSubmitProject = async () => {
    if (!currentProject) return

    // 直接调用保存逻辑
    await handleSaveProjectDirect(currentProject, true)
  }

  const handleSaveProjectDirect = async (project: Project, isSubmitForApproval: boolean = false) => {
    const formData = new FormData()
    formData.append("id", project.id || "")
    formData.append("name", project.name || "")
    formData.append("center", project.center || "")
    formData.append("department", project.department || "")
    formData.append("owner", project.owner || "")
    formData.append("description", project.description || "")
    formData.append("status", "编制")

    let result: Project | null = null
    if (project.id) {
      // Edit existing project
      result = await updateProjectAction(formData)
      if (result) {
        setProjects(projects.map((p) => (p.id === result?.id ? result : p)))
        alert("项目更新成功！")
      } else {
        alert("项目更新失败。")
      }
    } else {
      // Add new project
      result = await addProjectAction(formData)
      if (result) {
        // 如果是提交审批，则立即提交审批
        if (isSubmitForApproval) {
          const availableApprovers = getAvailableApprovers(currentUser.department, currentUser.center)
          if (availableApprovers.length > 0) {
            const selectedApprover = availableApprovers[0].name
            const approvalResult = await submitProjectForApprovalAction(
              result.id,
              currentUser.name,
              selectedApprover
            )
            
            if (approvalResult.success) {
              // 更新项目状态为已提交审批
              const updatedProject = { ...result, isSubmittedForApproval: true }
              setProjects([...projects, updatedProject])
              alert("项目新增并提交审批成功！")
            } else {
              setProjects([...projects, result])
              alert(`项目新增成功，但提交审批失败: ${approvalResult.message}`)
            }
          } else {
            setProjects([...projects, result])
            alert("项目新增成功，但没有可用的审批人，请手动提交审批。")
          }
        } else {
          setProjects([...projects, result])
          alert("项目暂存成功！")
        }
      } else {
        alert("项目新增失败。")
      }
    }
    setIsModalOpen(false)
    setCurrentProject(null)
  }

  // 计算财务摘要
  // 使用 useMemo 优化财务摘要计算，确保数据联动
  const financialSummary = useMemo(() => {
    if (!currentProject?.financialRows || currentProject.financialRows.length === 0) {
      return {
        totalIncomeWithTax: 0,
        totalIncomeWithoutTax: 0,
        totalExpenseWithTax: 0,
        totalExpenseWithoutTax: 0,
        overallGrossMargin: 0
      }
    }

    const totalIncomeWithTax = currentProject.financialRows.reduce((sum, row) => sum + (row.plannedIncome || 0), 0)
    const totalExpenseWithTax = currentProject.financialRows.reduce((sum, row) => sum + (row.plannedExpense || 0), 0)
    
    const totalIncomeWithoutTax = currentProject.financialRows.reduce((sum, row) => {
      const taxRate = (row.incomeTaxRate || 0) / 100
      return sum + ((row.plannedIncome || 0) / (1 + taxRate))
    }, 0)
    
    const totalExpenseWithoutTax = currentProject.financialRows.reduce((sum, row) => {
      const taxRate = (row.expenseTaxRate || 0) / 100
      return sum + ((row.plannedExpense || 0) / (1 + taxRate))
    }, 0)
    
    const overallGrossMargin = totalIncomeWithTax > 0 
      ? ((totalIncomeWithTax - totalExpenseWithTax) / totalIncomeWithTax * 100)
      : 0

    return {
      totalIncomeWithTax,
      totalIncomeWithoutTax,
      totalExpenseWithTax,
      totalExpenseWithoutTax,
      overallGrossMargin
    }
  }, [currentProject?.financialRows])

  const handleSaveProjectEdit = async (editedProject: Project) => {
    const formData = new FormData()
    formData.append("id", editedProject.id)
    formData.append("name", editedProject.name)
    formData.append("center", editedProject.center)
    formData.append("department", editedProject.department)
    formData.append("owner", editedProject.owner)
    formData.append("description", editedProject.description)
    formData.append("status", editedProject.status)
    
    // 添加新的字段
    if (editedProject.projectType) formData.append("projectType", editedProject.projectType)
    if (editedProject.managementDepartment) formData.append("managementDepartment", editedProject.managementDepartment)
    if (editedProject.fundAttribute) formData.append("fundAttribute", editedProject.fundAttribute)
    if (editedProject.startDate) formData.append("startDate", editedProject.startDate)
    if (editedProject.endDate) formData.append("endDate", editedProject.endDate)
    if (editedProject.necessity) formData.append("necessity", editedProject.necessity)
    if (editedProject.feasibility) formData.append("feasibility", editedProject.feasibility)
    if (editedProject.projectBasis) formData.append("projectBasis", editedProject.projectBasis)
    if (editedProject.implementationPlan) formData.append("implementationPlan", editedProject.implementationPlan)
    if (editedProject.departmentHead) formData.append("departmentHead", editedProject.departmentHead)
    if (editedProject.remarks) formData.append("remarks", editedProject.remarks)
    if (editedProject.attachmentFileName) formData.append("attachmentFileName", editedProject.attachmentFileName)
    
    // 添加财务数据
    if (editedProject.financialRows) {
      formData.append("financialRows", JSON.stringify(editedProject.financialRows))
    }

    const result = await updateProjectAction(formData)
    if (result) {
      setProjects(projects.map((p) => (p.id === result?.id ? result : p)))
      // 注意：不在这里显示alert或跳转，让调用方处理
      return result
    } else {
      throw new Error("项目更新失败")
    }
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      alert(`文件 "${file.name}" 已选择，准备导入。实际导入逻辑需后端支持。`)
      // In a real application, you would send this file to a server action
      // or parse it client-side (e.g., using 'xlsx' library) and then
      // call addProjectAction for each row.
    }
  }

  const handleSubmitForApproval = (project: Project) => {
    setSelectedProjectForApproval(project)
    
    // 获取可选审批人列表，只能选择自己中心的中心领导
    const availableApprovers = getAvailableApprovers(currentUser.department, currentUser.center)
    if (availableApprovers.length > 0) {
      setSelectedApprover(availableApprovers[0].name)
    } else {
      setSelectedApprover("")
    }
    
    setIsApprovalModalOpen(true)
  }

    const handleApprovalSubmit = async () => {
    if (!selectedProjectForApproval || !selectedApprover) {
      alert("请选择审批人")
      return
    }

    const result = await submitProjectForApprovalAction(
      selectedProjectForApproval.id,
      currentUser.name,
      selectedApprover
    )

    if (result.success) {
      // Update the project in the state
      setProjects(projects.map(p => 
        p.id === selectedProjectForApproval.id 
          ? { ...p, isSubmittedForApproval: true, approver: selectedApprover }
          : p
      ))
      alert("项目已成功提交审批！")
    } else {
      alert(`提交审批失败: ${result.message}`)
    }

    setIsApprovalModalOpen(false)
    setSelectedProjectForApproval(null)
    setSelectedApprover("")
  }

  const handleInitializeData = async () => {
    // 允许所有用户执行数据初始化，用于测试和开发环境
    const result = await initializeDataAction()
    if (result.success) {
      // 等待一小段时间确保数据完全保存
      await new Promise(resolve => setTimeout(resolve, 100))
      
      await fetchProjects() // Refresh the projects list
      
      // 通知其他组件数据已初始化，需要刷新
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dataInitialized', {
          detail: { timestamp: Date.now() }
        }))
      }
      
      alert(result.message)
    } else {
      alert(result.message)
    }
  }

  // 权限控制：发展策划部门、院领导办公室和分管院领导角色不做限制，中心部门的人看不到部分页签
  const canViewMonthlyReviews = currentUser.department === "发展策划部门" || currentUser.department === "院领导办公室" || currentUser.role === "分管院领导"
  
  const canViewComprehensivePlan = currentUser.department === "发展策划部门" || currentUser.department === "院领导办公室" || currentUser.role === "分管院领导"
  
  const canViewApprovals = 
    currentUser.role === "中心领导" || currentUser.role === "部门领导" || currentUser.role === "分管院领导"

  // Tab configuration - moved before useEffect
  const tabConfig = {
    "储备及综合计划": {
      icon: ListFilter,
      subTabs: [
        { key: "评审", label: "储备管理", icon: ClipboardCheck, action: () => setCurrentView("projects") },
        ...(canViewMonthlyReviews ? [{ key: "批复", label: "可研评审及批复", icon: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, action: () => {} }] : []),
        ...(canViewComprehensivePlan ? [{ key: "下达", label: "计划编制及调整", icon: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>, action: () => {} }] : [])
      ]
    },
    "招标采购": {
      icon: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      subTabs: [
        { key: "招标管理", label: "招标管理", icon: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>, action: () => {} },
        { key: "采购管理", label: "采购管理", icon: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>, action: () => {} }
      ]
    },
    "合同管理": {
      icon: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      subTabs: []
    },
    "进度管理": {
      icon: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      subTabs: (() => {
        const subTabs = [
          { key: "进度报销", label: "进度报销", icon: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>, action: () => setActiveSubTab("进度报销") }
        ]
        
        // 只有财务部门专职可以看到开票管理
        if (checkUserPermission(currentUser, PermissionMatrix.VIEW_INVOICE_MANAGEMENT)) {
          subTabs.push({ key: "开票管理", label: "开票管理", icon: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, action: () => setActiveSubTab("开票管理") })
        }
        
        return subTabs
      })()
    },
    "结算管理": {
      icon: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      subTabs: [
        { key: "收款汇总", label: "收款汇总", icon: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>, action: () => {} },
        { key: "银行对账", label: "银行对账", icon: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>, action: () => {} }
      ]
    }
  }

  // 监听用户变化，重置页面状态到用户有权限访问的默认页面
  useEffect(() => {
    // 重置页面视图状态
    setCurrentView("projects")
    
    // 检查当前标签页是否对新用户可见，如果不可见则切换到"储备及综合计划"
    const availableTabs = Object.keys(tabConfig).filter(tabKey => {
      const tabData = tabConfig[tabKey as keyof typeof tabConfig]
      // 合同管理没有子标签但是需要显示，其他标签页需要有子标签才显示
      return tabKey === "合同管理" || tabData.subTabs.length > 0
    })
    
    // 如果当前标签页不在可用标签列表中，切换到第一个可用标签
    if (!availableTabs.includes(activeTab)) {
      const defaultTab = "储备及综合计划"
      setActiveTab(defaultTab)
      setActiveSubTab("评审") // 储备管理是所有用户都能访问的
    } else {
      // 检查当前子标签页是否对新用户可见
      const currentTabData = tabConfig[activeTab as keyof typeof tabConfig]
      const availableSubTabs = currentTabData.subTabs.map(subTab => subTab.key)
      
      if (!availableSubTabs.includes(activeSubTab)) {
        // 如果当前子标签页不可见，切换到第一个可见的子标签页
        if (availableSubTabs.length > 0) {
          setActiveSubTab(availableSubTabs[0])
        }
      }
    }
  }, [currentUser.id, canViewMonthlyReviews, canViewComprehensivePlan]) // 依赖用户ID和权限变化

  // 获取待办数量
  const fetchTodoCount = useCallback(async () => {
    try {
      const items = await getTodoItemsAction(currentUser.id)
      // 过滤掉月度审核参与人确认的待办事项
      const filteredItems = items.filter(item => 
        item.type !== "monthly_review_participant_confirm" && 
        item.status === "待处理"
      )
      setTodoCount(filteredItems.length)
    } catch (error) {
      console.error('获取待办数量失败:', error)
      setTodoCount(0)
    }
  }, [currentUser.id])

  // 初始化和定期更新待办数量
  useEffect(() => {
    if (currentUser.id) {
      fetchTodoCount()
      // 每30秒更新一次待办数量
      const interval = setInterval(fetchTodoCount, 30000)
      return () => clearInterval(interval)
    }
  }, [currentUser.id, fetchTodoCount])

  // Handle tab changes
  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey)
    // 重置视图为项目列表，这样切换标签页时会显示对应的内容
    setCurrentView("projects")
    const tabData = tabConfig[tabKey as keyof typeof tabConfig]
    if (tabData.subTabs.length > 0) {
      setActiveSubTab(tabData.subTabs[0].key)
      tabData.subTabs[0].action()
    } else {
      // 对于没有子标签的标签页，不做任何操作或显示空页面
      setActiveSubTab("")
    }
  }

  const handleSubTabChange = (subTabKey: string) => {
    setActiveSubTab(subTabKey)
    const currentTabData = tabConfig[activeTab as keyof typeof tabConfig]
    const subTab = currentTabData.subTabs.find(st => st.key === subTabKey)
    if (subTab) {
      subTab.action()
    }
  }

  const handleEditSubmit = async () => {
    if (!currentProject) return

    try {
      // 先保存项目
      await handleSaveProjectEdit(currentProject)
      
      // 检查项目状态，如果是编制状态且未提交审批，则自动提交审批
      if (currentProject.status === "编制" && !currentProject.isSubmittedForApproval) {
        const availableApprovers = getAvailableApprovers(currentUser.department, currentUser.center)
        if (availableApprovers.length > 0) {
          const selectedApprover = availableApprovers[0].name
          const approvalResult = await submitProjectForApprovalAction(
            currentProject.id,
            currentUser.name,
            selectedApprover
          )
          
          if (approvalResult.success) {
            // 更新项目状态为已提交审批
            setProjects(projects.map(p => 
              p.id === currentProject.id 
                ? { ...p, isSubmittedForApproval: true }
                : p
            ))
            alert("项目更新并重新提交审批成功！")
            setCurrentView("projects") // 返回项目列表
          } else {
            alert(`项目更新成功，但重新提交审批失败: ${approvalResult.message}`)
          }
        } else {
          alert("项目更新成功，但没有可用的审批人，请手动提交审批。")
        }
      } else {
        alert("项目更新成功！")
        setCurrentView("projects") // 返回项目列表
      }
    } catch (error) {
      console.error("项目提交失败:", error)
      alert("项目提交失败，请重试")
    }
  }

  return (
    <>
      {/* 自定义动画样式 */}
      <style jsx>{`
        @keyframes flash {
          0%, 50% { opacity: 1; }
          25%, 75% { opacity: 0.5; }
        }
        .flash-animation {
          animation: flash 2s infinite;
        }
      `}</style>
      
      <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between min-h-12 sm:min-h-16 h-auto py-2 sm:py-3 px-2 sm:px-4 lg:px-6">
          <div className="text-base sm:text-lg md:text-2xl lg:text-3xl xl:text-4xl font-semibold text-gray-800 flex-shrink-0 truncate">
            运营管控平台
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-shrink-0">
            <Link href="/operation-guide">
              <Button variant="outline" size="sm" className="text-purple-600 border-purple-600 hover:bg-purple-50 hover:text-purple-700 p-1 sm:px-3">
                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden md:inline">操作说明</span>
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-orange-600 border-orange-600 hover:bg-orange-50 hover:text-orange-700 p-1 sm:px-3"
                >
                  <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden md:inline">数据初始化</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认数据初始化</AlertDialogTitle>
                  <AlertDialogDescription>
                    此操作将清空所有当前数据并恢复到初始状态，包括项目、审批记录和月度评审记录。
                    <br />
                    <strong className="text-red-600">此操作不可逆，确定要继续吗？</strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleInitializeData}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    确认初始化
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">
              当前用户: {currentUser.name} ({currentUser.role} - {currentUser.center || currentUser.department})
            </span>
            <Select
              value={currentUser.id}
              onValueChange={(userId) => {
                const selectedUser = mockUsers.find((user) => user.id === userId)
                if (selectedUser) {
                  setCurrentUser(selectedUser)
                }
              }}
            >
              <SelectTrigger className={cn(
                "text-xs sm:text-sm",
                isMobile ? "w-[80px] h-8 py-1 px-2" : "w-[100px] lg:w-[120px]"
              )}>
                <SelectValue placeholder="切换用户">
                  {currentUser.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="[&_.select-item-indicator]:hidden [&_svg]:hidden [&_[data-state=checked]_svg]:hidden">
                {mockUsers.map((user) => (
                  <SelectItem 
                    key={user.id} 
                    value={user.id}
                    className={cn(
                      isMobile ? "!py-2 !px-3 !min-h-0" : "",
                      "[&>span[data-radix-select-item-indicator]]:hidden [&>span>svg]:hidden"
                    )}
                  >
                    <div className={cn(
                      "flex flex-col",
                      isMobile ? "py-0 gap-0.5" : ""
                    )}>
                      <span className={cn(
                        "font-medium",
                        isMobile ? "leading-tight text-sm" : "leading-tight"
                      )}>{user.name}</span>
                      <span className={cn(
                        "text-muted-foreground",
                        isMobile ? "text-xs leading-tight" : "text-sm leading-tight"
                      )}>
                        {user.role} - {user.center || user.department}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Navigation Tab Bar */}
        <div className="bg-white border-t">
          {/* Main Tabs */}
          <div className="flex items-center justify-between px-2 sm:px-4 lg:px-6 py-2 border-b border-gray-200">
            <nav className="flex space-x-0.5 sm:space-x-1 overflow-x-auto scrollbar-hide flex-1 mr-2">
              {Object.keys(tabConfig)
                .filter(tabKey => {
                  const tabData = tabConfig[tabKey as keyof typeof tabConfig]
                  // 合同管理没有子标签但是需要显示，其他标签页需要有子标签才显示
                  return tabKey === "合同管理" || tabData.subTabs.length > 0
                })
                .map((tabKey) => {
                const tabData = tabConfig[tabKey as keyof typeof tabConfig]
                const IconComponent = tabData.icon
                const isActive = activeTab === tabKey
                
                return (
                  <button
                    key={tabKey}
                    onClick={() => handleTabChange(tabKey)}
                    className={`flex items-center px-1.5 sm:px-2 lg:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded transition-colors duration-200 ease-in-out whitespace-nowrap flex-shrink-0 ${
                      isActive
                        ? "bg-teal-500 text-white"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <IconComponent className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
                    <span className="hidden xs:inline sm:inline">{tabKey}</span>
                  </button>
                )
              })}
              

            </nav>
            
            {/* 待办 - 移至最右侧，集中处理所有审批和待办功能 */}
            <button
              onClick={() => {
                setCurrentView("todo")
                // 切换到待办页面时，清除主标签的选中状态
                setActiveTab("")
                setActiveSubTab("")
                // 切换到待办页面时刷新待办数量
                fetchTodoCount()
              }}
              className={`relative flex items-center px-1.5 sm:px-2 lg:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded transition-colors duration-200 ease-in-out flex-shrink-0 ${
                currentView === "todo" 
                  ? "bg-teal-500 text-white" 
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="hidden xs:inline sm:inline">待办</span>
              
              {/* 待办数量显示 */}
              {todoCount > 0 && (
                <span 
                  className={`ml-1.5 min-w-[18px] h-[18px] px-1 text-xs font-semibold rounded-full flex items-center justify-center transition-all duration-300 ${
                    currentView === "todo"
                      ? "bg-white text-teal-600 animate-pulse"
                      : "bg-red-500 text-white animate-bounce flash-animation"
                  }`}
                >
                  {todoCount > 99 ? '99+' : todoCount}
                </span>
              )}
            </button>
          </div>
          
          {/* Sub Tabs */}
          {tabConfig[activeTab as keyof typeof tabConfig]?.subTabs.length > 0 && (
            <div className="flex items-center px-2 sm:px-4 lg:px-6 py-1.5 sm:py-2 bg-gray-50 overflow-x-auto scrollbar-hide">
              <nav className="flex space-x-0.5 sm:space-x-1 whitespace-nowrap">
                {tabConfig[activeTab as keyof typeof tabConfig].subTabs.map((subTab) => {
                  const SubIconComponent = subTab.icon
                  const isActive = activeSubTab === subTab.key
                  
                  return (
                    <button
                      key={subTab.key}
                      onClick={() => handleSubTabChange(subTab.key)}
                      className={`flex items-center px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded text-xs transition-colors duration-200 ease-in-out flex-shrink-0 ${
                        isActive
                          ? "bg-teal-500 text-white"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                      }`}
                    >
                      <SubIconComponent className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                      <span className="text-xs">{subTab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(
        "flex-1 bg-gray-100 overflow-auto",
        isMobile ? "p-2" : "p-4 sm:p-6"
      )}>
        {currentView === "add-project" ? (
          <AddProjectReserve onBack={handleBackToProjects} currentUser={currentUser} />
        ) : currentView === "view-project" && currentProject ? (
          <ProjectDetailView onBack={handleBackToProjects} project={currentProject} />
        ) : currentView === "projects" && activeTab === "储备及综合计划" && activeSubTab === "评审" ? (
          <div className={cn(
            "bg-white rounded-lg shadow-md h-full flex flex-col",
            isMobile ? "p-1" : "p-2 sm:p-4 lg:p-6"
          )}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 lg:mb-6 gap-3 sm:gap-4">
              <div className="flex items-center">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">储备项目列表</h2>
              </div>
              <div className={cn(
                "flex gap-2 sm:gap-3",
                isMobile ? "flex-row" : "flex-row"
              )}>
                {(currentUser.role === "中心专职" || currentUser.role === "部门专职") && (
                  <Button 
                    onClick={handleAddProject} 
                    size="sm"
                    className={cn(
                      "bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-sm",
                      isMobile ? "flex-1" : "flex-none"
                    )}
                  >
                    <Plus className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> 
                    <span className="hidden xs:inline sm:inline">新增项目</span>
                    <span className="xs:hidden sm:hidden">新增</span>
                  </Button>
                )}
                {(currentUser.role === "中心专职" || currentUser.role === "部门专职") && (
                  <Button 
                    size="sm"
                    className={cn(
                      "bg-green-600 text-white hover:bg-green-700 px-3 py-2 text-sm",
                      isMobile ? "flex-1" : "flex-none"
                    )}
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <FileUp className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> 
                    <span className="hidden xs:inline sm:inline">批量导入</span>
                    <span className="xs:hidden sm:hidden">导入</span>
                  </Button>
                )}
                <Input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileImport}
                  className="sr-only"
                  id="file-upload"
                />
              </div>
            </div>

            {/* Search and Filter Section */}
            {/* 移动端筛选器切换按钮 */}
            {isMobile && (
              <div className="mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="w-full flex items-center justify-between h-10 text-sm font-medium"
                >
                  <span className="flex items-center">
                    <ListFilter className="h-4 w-4 mr-2" />
                    筛选条件
                  </span>
                  {showMobileFilters ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </Button>
              </div>
            )}

            {/* 筛选器区域 */}
            <div className={cn(
              "mb-3 sm:mb-4 lg:mb-6 flex gap-2 sm:gap-4 items-end flex-shrink-0",
              isMobile ? (
                showMobileFilters ? "flex-col items-stretch space-y-3 p-3 bg-gray-50 rounded-lg" : "hidden"
              ) : "flex-row"
            )}>
              <div className={cn(isMobile ? "w-full" : "w-[300px]")}>
                <Label htmlFor="search-input" className="block text-sm font-medium text-gray-700 mb-2">
                  搜索项目
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 z-10" />
                  <Input
                    id="search-input"
                    placeholder="搜索项目名称或编码"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-10"
                  />
                </div>
              </div>

              {(currentUser.role === "部门专职" || currentUser.role === "部门领导") && (
                <div className={cn(isMobile ? "w-full" : "w-[150px]")}>
                  <Label htmlFor="filter-affiliation" className="block text-sm font-medium text-gray-700 mb-2">
                    项目所属
                  </Label>
                  <Select
                    value={filterAffiliation}
                    onValueChange={(value) => setFilterAffiliation(value as string | "所有")}
                    name="filter-affiliation"
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueAffiliations.map((affiliation) => (
                        <SelectItem key={affiliation} value={affiliation}>
                          {affiliation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className={cn(isMobile ? "w-full" : "w-[130px]")}>
                <Label htmlFor="filter-status" className="block text-sm font-medium text-gray-700 mb-2">
                  项目状态
                </Label>
                <Select
                  value={filterStatus}
                  onValueChange={(value) => setFilterStatus(value as ProjectStatus | "所有")}
                  name="filter-status"
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(currentUser.role === "中心领导" || currentUser.role === "部门专职" || currentUser.role === "部门领导") && (
                <div className={cn(isMobile ? "w-full" : "w-[140px]")}>
                  <Label htmlFor="filter-owner" className="block text-sm font-medium text-gray-700 mb-2">
                    项目负责人
                  </Label>
                  <Select value={filterOwner} onValueChange={(value) => setFilterOwner(value as string | "所有")} name="filter-owner">
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueOwners.map((owner) => (
                        <SelectItem key={owner} value={owner}>
                          {owner}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* 时间查询条件 */}
              <div className={cn(isMobile ? "w-full" : "w-[150px]")}>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  开始日期
                </Label>
                <EnhancedDatePicker
                  date={filterStartDate}
                  onDateChange={setFilterStartDate}
                  placeholder="选择开始日期"
                />
              </div>

              <div className={cn(isMobile ? "w-full" : "w-[150px]")}>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  结束日期
                </Label>
                <EnhancedDatePicker
                  date={filterEndDate}
                  onDateChange={setFilterEndDate}
                  placeholder="选择结束日期"
                />
              </div>

              {/* Reset Filters Button */}
              <div className={cn(
                isMobile ? "w-full" : "flex items-end"
              )}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setFilterStatus("所有")
                    setFilterAffiliation("所有")
                    setFilterOwner("所有")
                    setFilterStartDate(undefined)
                    setFilterEndDate(undefined)
                    setCurrentPage(1)
                  }}
                  className={cn(
                    "whitespace-nowrap",
                    isMobile ? "w-full h-10" : ""
                  )}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  重置筛选
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-600 flex-1 flex items-center justify-center">加载中...</div>
            ) : isMobile ? (
              // 移动端卡片布局
              <div className="flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1 w-full">
                  <div className="space-y-4 p-0">
                    {paginatedProjects.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        无匹配项目。
                      </div>
                    ) : (
                      paginatedProjects.map((project) => (
                        <div key={project.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                          {/* 项目标题行 */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0 pr-3">
                              <h3 className="font-medium text-gray-900 text-base leading-5 mb-2 break-words">
                                {project.name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                编码: {project.id}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                project.status === "编制" ? "bg-blue-100 text-blue-800" :
                                project.status === "评审" ? "bg-yellow-100 text-yellow-800" :
                                project.status === "批复" ? "bg-green-100 text-green-800" :
                                "bg-purple-100 text-purple-800"
                              }`}>
                                {project.status}
                              </span>
                            </div>
                          </div>
                          
                          {/* 项目信息网格 - 优化布局 */}
                          <div className="space-y-3 mb-4">
                            <div className="grid grid-cols-1 gap-3">
                              <div className="flex flex-col space-y-1">
                                <span className="text-xs text-gray-500 font-medium">项目类型</span>
                                <span className="text-sm text-gray-900 break-words">{project.projectType || "未设置"}</span>
                              </div>
                              <div className="flex flex-col space-y-1">
                                <span className="text-xs text-gray-500 font-medium">项目负责人</span>
                                <span className="text-sm text-gray-900">{project.owner}</span>
                              </div>
                              <div className="flex flex-col space-y-1">
                                <span className="text-xs text-gray-500 font-medium">归口管理部门</span>
                                <span className="text-sm text-gray-900 break-words">{project.managementDepartment || "未设置"}</span>
                              </div>
                              <div className="flex flex-col space-y-1">
                                <span className="text-xs text-gray-500 font-medium">储备项目版本</span>
                                <span className="text-sm text-gray-900">{project.version}</span>
                              </div>
                              {/* 项目时间 */}
                              {project.startDate && project.endDate && (
                                <div className="flex flex-col space-y-1">
                                  <span className="text-xs text-gray-500 font-medium">项目时间</span>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-900 font-medium">
                                      {format(new Date(project.startDate), "yyyy-MM-dd", { locale: zhCN })}
                                    </span>
                                    <span className="text-gray-500 px-2">至</span>
                                    <span className="text-gray-900 font-medium">
                                      {format(new Date(project.endDate), "yyyy-MM-dd", { locale: zhCN })}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* 操作按钮 */}
                          <div className="flex flex-col space-y-3 pt-3 border-t border-gray-100">
                                                        <div className="flex items-center justify-between">
                              {/* 根据项目状态和用户权限显示不同按钮 */}
                              {(() => {
                                // 判断用户是否有操作权限
                                const hasOperationPermission = project.owner === currentUser.name || 
                                  (currentUser.role === "中心领导" && project.center === currentUser.center && (project.department === "" || !project.department))
                                
                                if (project.status === "编制" && hasOperationPermission) {
                                  if (!project.isSubmittedForApproval) {
                                    // 编制状态且未提交审核：显示编辑和提交审核按钮
                                    return (
                                      <div className="flex items-center space-x-2 flex-1">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleEditProject(project)}
                                          className="h-8 px-3 text-xs flex-1"
                                        >
                                          <Edit className="h-3 w-3 mr-1" />
                                          编辑
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => handleSubmitForApproval(project)}
                                          className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 flex-1"
                                        >
                                          提交审核
                                        </Button>
                                      </div>
                                    )
                                  } else {
                                    // 编制状态但已提交审核：只显示编辑按钮
                                    return (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditProject(project)}
                                        className="h-8 px-3 text-xs flex-1"
                                      >
                                        <Edit className="h-3 w-3 mr-1" />
                                        编辑
                                      </Button>
                                    )
                                  }
                                } else {
                                  // 其他情况：只显示查看按钮
                                  return (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleViewProject(project)}
                                      className="h-8 px-3 text-xs flex-1"
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      查看详情
                                    </Button>
                                  )
                                }
                              })()}
                            </div>
                            
                            {/* 审批状态显示 */}
                            {project.isSubmittedForApproval && (
                              <div className="flex justify-center">
                                <span className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full font-medium">
                                  审批中
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
                
                {/* 移动端分页控件 - 优化布局 */}
                <div className="mt-3 pt-3 border-t border-gray-200 flex-shrink-0 bg-white">
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-center space-x-3">
                      <Label htmlFor="items-per-page" className="text-sm font-medium text-gray-700">每页显示</Label>
                      <Select
                        value={String(itemsPerPage)}
                        onValueChange={(value) => {
                          setItemsPerPage(Number(value))
                          setCurrentPage(1)
                        }}
                        disabled={loading}
                      >
                        <SelectTrigger className="w-[70px] h-9 text-sm">
                          <SelectValue placeholder="10" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="15">15</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-center space-x-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1 || loading}
                        className="h-9 px-3"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-gray-700 font-medium min-w-[120px] text-center">
                        第 {currentPage} 页 / 共 {totalPages} 页
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || loading}
                        className="h-9 px-3"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // 桌面端表格布局
              <div className="flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1 w-full">
                  <div className="min-w-[1200px] w-full">
                    <Table className="w-full table-fixed text-sm">
                    <TableHeader>
                      <TableRow className="h-12">
                        <TableHead className="w-[10%] text-center text-sm font-semibold text-gray-700 px-3 py-3 whitespace-nowrap">
                          储备项目编码
                        </TableHead>
                        <TableHead className="w-[20%] text-center text-sm font-semibold text-gray-700 px-3 py-3 whitespace-nowrap">
                          储备项目名称
                        </TableHead>
                        <TableHead className="w-[10%] text-center text-sm font-semibold text-gray-700 px-3 py-3 whitespace-nowrap">
                          项目类型
                        </TableHead>
                        <TableHead className="w-[8%] text-center text-sm font-semibold text-gray-700 px-3 py-3 whitespace-nowrap">
                          项目负责人
                        </TableHead>
                        <TableHead className="w-[12%] text-center text-sm font-semibold text-gray-700 px-3 py-3 whitespace-nowrap">
                          归口管理部门
                        </TableHead>
                        <TableHead className="w-[12%] text-center text-sm font-semibold text-gray-700 px-3 py-3 whitespace-nowrap">
                          储备项目状态
                        </TableHead>
                        <TableHead className="w-[6%] text-center text-sm font-semibold text-gray-700 px-3 py-3 whitespace-nowrap">
                          储备项目版本
                        </TableHead>
                        <TableHead className="w-[12%] text-center text-sm font-semibold text-gray-700 px-3 py-3 whitespace-nowrap">
                          项目时间
                        </TableHead>
                        <TableHead className="w-[16%] text-center text-sm font-semibold text-gray-700 px-3 py-3 whitespace-nowrap">
                          操作
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedProjects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                            无匹配项目。
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedProjects.map((project) => (
                          <TableRow key={project.id} className="h-12 hover:bg-gray-50">
                            <TableCell className="text-sm text-gray-600 px-2 py-3 whitespace-nowrap text-center" data-label="储备项目编码">
                              {project.id}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600 px-2 py-3 text-center" data-label="储备项目名称">
                              <div className="truncate max-w-[180px] mx-auto" title={project.name}>
                                {project.name}
                              </div>
                            </TableCell>
                            <TableCell className="text-center px-2 py-3" data-label="项目类型">
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                {project.projectType || "未设置"}
                              </span>
                            </TableCell>
                            <TableCell className="text-center text-sm text-gray-700 px-2 py-3 whitespace-nowrap" data-label="项目负责人">
                              {project.owner}
                            </TableCell>
                            <TableCell className="text-center text-sm text-gray-700 px-2 py-3 whitespace-nowrap" data-label="归口管理部门">
                              {getProjectAffiliationDisplay(project)}
                            </TableCell>
                            <TableCell className="text-center px-2 py-3" data-label="储备项目状态">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                                  project.status === "编制"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : project.status === "评审"
                                    ? "bg-blue-100 text-blue-800"
                                    : project.status === "批复"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {project.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-center text-sm text-gray-600 px-2 py-3 whitespace-nowrap" data-label="储备项目版本">
                              {project.version || 'V1'}
                            </TableCell>
                            <TableCell className="text-center text-sm text-gray-600 px-2 py-3 whitespace-nowrap" data-label="项目时间">
                              <div className="text-xs">
                                {project.startDate && project.endDate ? (
                                  `${project.startDate} 至 ${project.endDate}`
                                ) : project.startDate ? (
                                  `${project.startDate} 开始`
                                ) : project.endDate ? (
                                  `截止 ${project.endDate}`
                                ) : (
                                  "未设置"
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center px-2 py-3" data-label="操作">
                                                            <div className="flex flex-wrap gap-1 justify-center">
                                {/* 根据项目状态和用户权限显示不同按钮 */}
                                {(() => {
                                  // 判断用户是否有操作权限
                                  const hasOperationPermission = project.owner === currentUser.name || 
                                    (currentUser.role === "中心领导" && project.center === currentUser.center && (project.department === "" || !project.department))
                                  
                                  if (project.status === "编制" && hasOperationPermission) {
                                    if (!project.isSubmittedForApproval) {
                                      // 编制状态且未提交审核：显示编辑和提交审核按钮
                                      return (
                                        <>
                                          <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => handleEditProject(project)} 
                                            className="h-7 px-2 text-xs"
                                          >
                                            <Edit className="h-3 w-3 mr-1" /> 编辑
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            onClick={() => handleSubmitForApproval(project)} 
                                            className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700"
                                          >
                                            提交审核
                                          </Button>
                                        </>
                                      )
                                    } else {
                                      // 编制状态但已提交审核：显示编辑按钮和审批状态
                                      return (
                                        <>
                                          <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => handleEditProject(project)} 
                                            className="h-7 px-2 text-xs"
                                          >
                                            <Edit className="h-3 w-3 mr-1" /> 编辑
                                          </Button>
                                          <span className="text-xs text-orange-600 font-medium px-2 py-1 bg-orange-50 rounded-md">
                                            审批中
                                          </span>
                                        </>
                                      )
                                    }
                                  } else {
                                    // 其他情况：只显示查看按钮
                                    return (
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => handleViewProject(project)} 
                                        className="h-7 px-2 text-xs"
                                      >
                                        <Eye className="h-3 w-3 mr-1" /> 查看
                                      </Button>
                                    )
                                  }
                                })()}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
                
                {/* 分页控件 - 移到表格容器内部 */}
                <div className={cn(
                "mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-gray-200 flex-shrink-0",
                isMobile ? "flex flex-col space-y-2" : "flex items-center justify-between"
              )}>
                  <div className={cn(
                    "flex items-center space-x-1 sm:space-x-2",
                    isMobile && "justify-center"
                  )}>
                    <Label htmlFor="items-per-page" className="text-xs sm:text-sm">每页显示</Label>
                    <Select
                      value={String(itemsPerPage)}
                      onValueChange={(value) => {
                        setItemsPerPage(Number(value))
                        setCurrentPage(1)
                      }}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-[60px] sm:w-[80px] h-8 text-xs sm:text-sm">
                        <SelectValue placeholder="10" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className={cn(
                    "flex items-center space-x-1 sm:space-x-2",
                    isMobile && "justify-center"
                  )}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || loading}
                      className="h-8 px-2 sm:px-3"
                    >
                      <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                      {isMobile ? "" : "上一页"}
                    </Button>
                    <span className="text-xs sm:text-sm text-gray-700">
                      第 {currentPage} 页 / 共 {totalPages} 页
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || loading}
                      className="h-8 px-2 sm:px-3"
                    >
                      {isMobile ? "" : "下一页"}
                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : currentView === "edit-project" && currentProject ? (
          <div className={cn(
            "mx-auto space-y-6",
            isMobile ? "w-full p-4" : "w-[95%] p-6"
          )}>
            {/* 页面标题 */}
            <div className={cn(
              "flex items-center mb-6",
              isMobile ? "space-x-2" : "space-x-4"
            )}>
              <Button variant="ghost" onClick={handleBackToProjects} className="p-2">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h1 className={cn(
                "font-bold text-gray-900 truncate",
                isMobile ? "text-lg" : "text-2xl"
              )}>
                {isEditing ? '编辑项目' : '查看项目'} - {currentProject.name}
              </h1>
            </div>

            {/* 权限提示 */}
            {!isEditing && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-sm text-yellow-800">
                  您没有编辑此项目的权限，只能查看项目信息。
                </p>
              </div>
            )}

            {/* 基本信息区 */}
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className={cn(
                  "grid gap-6",
                  isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                )}>
                  {/* 责任部门（只读） */}
                  <div className="space-y-2">
                    <Label>责任部门</Label>
                    <Input 
                      value={currentProject.department || currentProject.center || "未设置部门"} 
                      disabled 
                      className="bg-gray-50"
                    />
                  </div>

                  {/* 项目负责人（只读） */}
                  <div className="space-y-2">
                    <Label>项目负责人</Label>
                    <Input 
                      value={currentProject.owner} 
                      disabled 
                      className="bg-gray-50"
                    />
                  </div>

                  {/* 项目名称（必填） */}
                  <div className="space-y-2">
                    <Label>项目名称 <span className="text-red-500">*</span></Label>
                    <Input 
                      value={currentProject.name}
                      onChange={(e) => setCurrentProject(prev => prev ? { ...prev, name: e.target.value } : null)}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                      placeholder="请输入项目名称"
                      required
                    />
                  </div>

                  {/* 项目类型（必填） */}
                  <div className="space-y-2">
                    <Label>项目类型 <span className="text-red-500">*</span></Label>
                    {isEditing ? (
                      <Select 
                        value={currentProject.projectType || ''} 
                        onValueChange={(value) => setCurrentProject(prev => prev ? { ...prev, projectType: value } : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="请选择项目类型" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROJECT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input 
                        value={currentProject.projectType || ''} 
                        disabled 
                        className="bg-gray-50"
                      />
                    )}
                  </div>

                  {/* 归口管理部门 */}
                  <div className="space-y-2">
                    <Label>归口管理部门</Label>
                    {isEditing ? (
                      <Select 
                        value={currentProject.managementDepartment || ''} 
                        onValueChange={(value) => setCurrentProject(prev => prev ? { ...prev, managementDepartment: value } : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="请选择归口管理部门" />
                        </SelectTrigger>
                        <SelectContent>
                          {MANAGEMENT_DEPARTMENTS.map((dept) => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input 
                        value={currentProject.managementDepartment || ''} 
                        disabled 
                        className="bg-gray-50"
                      />
                    )}
                  </div>

                  {/* 资金属性（必填） */}
                  <div className="space-y-2">
                    <Label>资金属性 <span className="text-red-500">*</span></Label>
                    {isEditing ? (
                      <Select 
                        value={currentProject.fundAttribute || ''} 
                        onValueChange={(value) => setCurrentProject(prev => prev ? { ...prev, fundAttribute: value } : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="请选择资金属性" />
                        </SelectTrigger>
                        <SelectContent>
                          {FUND_ATTRIBUTES.map((attr) => (
                            <SelectItem key={attr} value={attr}>{attr}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input 
                        value={currentProject.fundAttribute || ''} 
                        disabled 
                        className="bg-gray-50"
                      />
                    )}
                  </div>

                  {/* 实施年份（起止时间） */}
                  <div className="space-y-2">
                    <Label>实施开始时间</Label>
                    <EnhancedDatePicker
                      date={startDate}
                      onDateChange={setStartDate}
                      placeholder="请选择开始时间"
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>实施结束时间</Label>
                    <EnhancedDatePicker
                      date={endDate}
                      onDateChange={setEndDate}
                      placeholder="请选择结束时间"
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {/* 必要性、可行性、立项依据 - 响应式布局 */}
                <div className={cn(
                  "grid gap-6",
                  isMobile ? "grid-cols-1" : "grid-cols-3"
                )}>
                  {/* 必要性（必填） */}
                  <div className="space-y-2">
                    <Label>必要性 <span className="text-red-500">*</span></Label>
                    <Input 
                      value={currentProject.necessity || ''}
                      onChange={(e) => setCurrentProject(prev => prev ? { ...prev, necessity: e.target.value } : null)}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                      placeholder="请输入项目必要性"
                      required
                    />
                  </div>

                  {/* 可行性 */}
                  <div className="space-y-2">
                    <Label>可行性</Label>
                    <Input 
                      value={currentProject.feasibility || ''}
                      onChange={(e) => setCurrentProject(prev => prev ? { ...prev, feasibility: e.target.value } : null)}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                      placeholder="请输入项目可行性"
                    />
                  </div>

                  {/* 立项依据 */}
                  <div className="space-y-2">
                    <Label>立项依据</Label>
                    <Input 
                      value={currentProject.projectBasis || ''}
                      onChange={(e) => setCurrentProject(prev => prev ? { ...prev, projectBasis: e.target.value } : null)}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                      placeholder="请输入立项依据"
                    />
                  </div>
                </div>

                {/* 项目实施方案 */}
                <div className="space-y-2">
                  <Label>项目实施方案</Label>
                  <Textarea 
                    value={currentProject.implementationPlan || ''}
                    onChange={(e) => setCurrentProject(prev => prev ? { ...prev, implementationPlan: e.target.value } : null)}
                    disabled={!isEditing}
                    className={cn("min-h-[120px]", !isEditing && "bg-gray-50")}
                    placeholder="请输入项目实施方案"
                  />
                  <div className="text-sm text-gray-500 text-right">
                    {(currentProject.implementationPlan || '').length}/200
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 财务/预算表格区 */}
            <Card>
              <CardHeader>
                <CardTitle>财务/预算信息</CardTitle>
                <div className="text-sm text-gray-600 mt-2">
                  💡 当项目实施时间跨年时，系统会自动按年拆分为多个时间段，请分别填写各年度的收入和支出预算
                </div>
              </CardHeader>
              <CardContent>
                {isMobile ? (
                  // 移动端卡片式布局
                  <div className="space-y-4">
                    {(!currentProject.financialRows || currentProject.financialRows.length === 0) ? (
                      <div className="text-center text-gray-500 py-8">
                        暂无财务数据
                      </div>
                    ) : (
                      currentProject.financialRows.map((row, index) => (
                        <Card key={index} className="border border-gray-200">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-sm">时间段 {index + 1}</span>
                              <span className="text-xs text-gray-500">
                                {row.startTime} - {row.endTime}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">计划收入（含税元）</Label>
                                <Input
                                  type="number"
                                  value={row.plannedIncome || ''}
                                  onChange={(e) => updateFinancialRow(index, 'plannedIncome', Number(e.target.value) || 0)}
                                  disabled={!isEditing}
                                  className={cn("text-sm", !isEditing && "bg-gray-50")}
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">收入税率（%）</Label>
                                <Input
                                  type="number"
                                  value={row.incomeTaxRate || ''}
                                  onChange={(e) => updateFinancialRow(index, 'incomeTaxRate', Number(e.target.value) || 0)}
                                  disabled={!isEditing}
                                  className={cn("text-sm", !isEditing && "bg-gray-50")}
                                  placeholder="13"
                                  max="100"
                                  min="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">计划支出（含税元）</Label>
                                <Input
                                  type="number"
                                  value={row.plannedExpense || ''}
                                  onChange={(e) => updateFinancialRow(index, 'plannedExpense', Number(e.target.value) || 0)}
                                  disabled={!isEditing}
                                  className={cn("text-sm", !isEditing && "bg-gray-50")}
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">支出税率（%）</Label>
                                <Input
                                  type="number"
                                  value={row.expenseTaxRate || ''}
                                  onChange={(e) => updateFinancialRow(index, 'expenseTaxRate', Number(e.target.value) || 0)}
                                  disabled={!isEditing}
                                  className={cn("text-sm", !isEditing && "bg-gray-50")}
                                  placeholder="13"
                                  max="100"
                                  min="0"
                                />
                              </div>
                            </div>
                            
                            <div className="pt-2 border-t border-gray-100">
                              <div className="flex justify-between items-center">
                                <Label className="text-xs">毛利率</Label>
                                <span className="font-medium text-sm">
                                  {row.grossMargin?.toFixed(2) || '0.00'}%
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                ) : (
                  // 桌面端表格布局
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>开始时间</TableHead>
                          <TableHead>结束时间</TableHead>
                          <TableHead>计划收入（含税元）</TableHead>
                          <TableHead>收入税率（%）</TableHead>
                          <TableHead>计划支出（含税元）</TableHead>
                          <TableHead>支出税率（%）</TableHead>
                          <TableHead>毛利率（%）</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(!currentProject.financialRows || currentProject.financialRows.length === 0) ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                              暂无数据
                            </TableCell>
                          </TableRow>
                        ) : (
                          currentProject.financialRows.map((row, index) => (
                            <TableRow key={index}>
                              <TableCell>{row.startTime}</TableCell>
                              <TableCell>{row.endTime}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={row.plannedIncome || ''}
                                  onChange={(e) => updateFinancialRow(index, 'plannedIncome', Number(e.target.value) || 0)}
                                  disabled={!isEditing}
                                  className={cn("w-36", !isEditing && "bg-gray-50")}
                                  placeholder="0"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={row.incomeTaxRate || ''}
                                  onChange={(e) => updateFinancialRow(index, 'incomeTaxRate', Number(e.target.value) || 0)}
                                  disabled={!isEditing}
                                  className={cn("w-24", !isEditing && "bg-gray-50")}
                                  placeholder="13"
                                  max="100"
                                  min="0"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={row.plannedExpense || ''}
                                  onChange={(e) => updateFinancialRow(index, 'plannedExpense', Number(e.target.value) || 0)}
                                  disabled={!isEditing}
                                  className={cn("w-36", !isEditing && "bg-gray-50")}
                                  placeholder="0"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={row.expenseTaxRate || ''}
                                  onChange={(e) => updateFinancialRow(index, 'expenseTaxRate', Number(e.target.value) || 0)}
                                  disabled={!isEditing}
                                  className={cn("w-24", !isEditing && "bg-gray-50")}
                                  placeholder="13"
                                  max="100"
                                  min="0"
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                {row.grossMargin?.toFixed(2) || '0.00'}%
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 项目财务摘要 */}
            <Card>
              <CardHeader>
                <CardTitle>项目财务摘要</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn(
                  "grid gap-6",
                  isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
                )}>
                  <div className="space-y-2">
                    <Label>项目总收入（含税）</Label>
                    <Input 
                      value={financialSummary.totalIncomeWithTax.toFixed(2)} 
                      disabled 
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>项目总收入（不含税）</Label>
                    <Input 
                      value={financialSummary.totalIncomeWithoutTax.toFixed(2)} 
                      disabled 
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>项目总支出（含税）</Label>
                    <Input 
                      value={financialSummary.totalExpenseWithTax.toFixed(2)} 
                      disabled 
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>项目总支出（不含税）</Label>
                    <Input 
                      value={financialSummary.totalExpenseWithoutTax.toFixed(2)} 
                      disabled 
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>全周期毛利率（%）</Label>
                    <Input 
                      value={financialSummary.overallGrossMargin.toFixed(2)} 
                      disabled 
                      className="bg-gray-50"
                    />
                  </div>
                </div>
                
                {/* 备注 */}
                <div className="space-y-2 mt-4">
                  <Label>备注</Label>
                  <Textarea 
                    value={currentProject.remarks || ''}
                    onChange={(e) => setCurrentProject(prev => prev ? { ...prev, remarks: e.target.value } : null)}
                    disabled={!isEditing}
                    className={cn("min-h-[100px]", !isEditing && "bg-gray-50")}
                    placeholder="请输入备注信息"
                  />
                  <div className="text-sm text-gray-500 text-right">
                    {(currentProject.remarks || '').length}/200
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 附件上传 */}
            <Card>
              <CardHeader>
                <CardTitle>附件上传</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>可研项目建议书</Label>
                    <div className={cn(
                      "flex items-center space-x-2",
                      isMobile && "flex-col space-x-0 space-y-2 items-stretch"
                    )}>
                      {isEditing ? (
                        <>
                          <Input
                            type="file"
                            accept=".rar,.zip,.doc,.docx,.pdf"
                            className="hidden"
                            id="file-upload-edit"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('file-upload-edit')?.click()}
                            className={cn(
                              "flex items-center space-x-2",
                              isMobile && "w-full justify-center"
                            )}
                          >
                            <Upload className="h-4 w-4" />
                            <span>选择文件</span>
                          </Button>
                          {currentProject.attachmentFileName && (
                            <span className={cn(
                              "text-sm text-gray-600",
                              isMobile && "text-center"
                            )}>
                              当前文件: {currentProject.attachmentFileName}
                            </span>
                          )}
                        </>
                      ) : (
                        <Input
                          value={currentProject.attachmentFileName || ''}
                          disabled
                          className="bg-gray-50"
                          placeholder="无附件"
                        />
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      支持格式：rar、zip、doc、docx、pdf，单个文件不超过20MB
                    </div>
                  </div>

                  {/* 部门/中心负责人 */}
                  <div className="space-y-2">
                    <Label>部门/中心负责人</Label>
                    {isEditing ? (
                      <Select 
                        value={currentProject.departmentHead || ''} 
                        onValueChange={(value) => setCurrentProject(prev => prev ? { ...prev, departmentHead: value } : null)}
                      >
                        <SelectTrigger className={cn(
                          isMobile ? "w-[100px] h-8 py-1 px-2" : "w-[8rem]"
                        )}>
                          <SelectValue placeholder="请选择负责人">
                            {currentProject.departmentHead}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="[&_[data-radix-select-item-indicator]]:hidden">
                          {getAvailableLeaders(currentUser).map((leader) => (
                            <SelectItem 
                              key={leader.id} 
                              value={leader.name}
                              className={cn(
                                isMobile ? "!py-2 !px-3 !min-h-0" : "",
                                "[&>span[data-radix-select-item-indicator]]:hidden [&>span>svg]:hidden"
                              )}
                            >
                              <div className={cn(
                                "flex flex-col",
                                isMobile ? "py-0 gap-0.5" : ""
                              )}>
                                <span className={cn(
                                  "font-medium",
                                  isMobile ? "leading-tight text-sm" : "leading-tight"
                                )}>{leader.name}</span>
                                <span className={cn(
                                  "text-muted-foreground",
                                  isMobile ? "text-xs leading-tight" : "text-sm leading-tight"
                                )}>
                                  {leader.role} - {leader.center || ""}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={currentProject.departmentHead || ''}
                        disabled
                        className={cn(
                          "bg-gray-50",
                          isMobile ? "w-full" : "w-[12rem]"
                        )}
                        placeholder="无负责人"
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 底部操作按钮 */}
            <div className={cn(
              "flex pt-6",
              isMobile ? "flex-col space-y-3" : "justify-end space-x-4"
            )}>
              <Button 
                variant="outline" 
                onClick={handleBackToProjects}
                className={isMobile ? "w-full" : ""}
              >
                取消
              </Button>
              {isEditing && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={async () => {
                      if (currentProject) {
                        await handleSaveProjectEdit(currentProject)
                      }
                    }}
                    className={isMobile ? "w-full" : ""}
                  >
                    暂存
                  </Button>
                  <Button 
                    onClick={handleEditSubmit}
                    className={cn(
                      "bg-blue-600 hover:bg-blue-700",
                      isMobile && "w-full"
                    )}
                  >
                    提交
                  </Button>
                </>
              )}
            </div>
          </div>

        ) : currentView === "todo" ? (
          <TodoList onTodoProcessed={fetchTodoCount} />
        ) : activeTab === "储备及综合计划" && activeSubTab === "批复" ? (
          <MonthlyReviewsEmbedded />
        ) : activeTab === "储备及综合计划" && activeSubTab === "下达" ? (
          <ComprehensivePlanManagement currentUser={currentUser} />
        ) : activeTab === "合同管理" ? (
          <ContractManagement currentUser={currentUser} />
        ) : activeTab === "招标采购" && activeSubTab === "招标管理" ? (
          <BiddingDocumentManagement currentUser={currentUser} />
        ) : activeTab === "招标采购" && activeSubTab === "采购管理" ? (
          <ProcurementDocumentManagement currentUser={currentUser} />
        ) : activeTab === "招标采购" ? (
          <BiddingDocumentManagement currentUser={currentUser} />
        ) : activeTab === "进度管理" ? (
          <div className="bg-white rounded-lg shadow-md">
            {(activeSubTab === "进度报销" || !activeSubTab) ? (
              <ProgressReimbursementManagement currentUser={currentUser} />
            ) : activeSubTab === "开票管理" ? (
              <InvoiceManagementComponent currentUser={currentUser} />
            ) : (
              <ProgressReimbursementManagement currentUser={currentUser} />
            )}
          </div>
        ) : activeTab === "结算管理" ? (
          <div className="bg-white rounded-lg shadow-md">
            {(activeSubTab === "收款汇总" || !activeSubTab) ? (
              <ProjectSettlementManagement currentUser={currentUser} />
            ) : activeSubTab === "银行对账" ? (
              <BankReconciliationManagement />
            ) : (
              <ProjectSettlementManagement currentUser={currentUser} />
            )}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md h-full flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-600 mb-2">页面未找到</h2>
              <p className="text-gray-500">请选择有效的功能模块</p>
            </div>
          </div>
        )}
      </main>

      {/* Project Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open)
        if (!open) {
          setCurrentProject(null)
          setIsEditing(false)
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentProject?.id ? "编辑项目" : "新增项目"}</DialogTitle>
            <DialogDescription>
              {currentProject?.id ? "修改项目基本信息。" : "填写新项目基本信息。"}
              {currentProject?.id && !isEditing && (
                <p className="text-red-500 text-sm mt-2">您没有编辑此项目的权限，只能查看。</p>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveProject}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  项目名称
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={currentProject?.name || ""}
                  onChange={(e) => setCurrentProject(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="col-span-3"
                  disabled={!isEditing}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="center" className="text-right">
                  所属中心
                </Label>
                <Input
                  id="center"
                  name="center"
                  value={currentProject?.center || ""}
                  onChange={(e) => setCurrentProject(prev => prev ? { ...prev, center: e.target.value } : null)}
                  className="col-span-3"
                  disabled={!isEditing}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="department" className="text-right">
                  所属部门
                </Label>
                <Input
                  id="department"
                  name="department"
                  value={currentProject?.department || ""}
                  onChange={(e) => setCurrentProject(prev => prev ? { ...prev, department: e.target.value } : null)}
                  className="col-span-3"
                  disabled={!isEditing}
                  placeholder="中心项目可留空"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="owner" className="text-right">
                  项目负责人
                </Label>
                <Input
                  id="owner"
                  name="owner"
                  value={currentProject?.owner || ""}
                  onChange={(e) => setCurrentProject(prev => prev ? { ...prev, owner: e.target.value } : null)}
                  className="col-span-3"
                  disabled={!isEditing}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  项目状态
                </Label>
                <Select
                  value={currentProject?.status || "编制"}
                  onValueChange={(value: ProjectStatus) => setCurrentProject(prev => prev ? { ...prev, status: value } : null)}
                  disabled={!isEditing}
                  name="status"
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                                              <SelectItem value="编制">编制</SelectItem>
                          <SelectItem value="评审">评审</SelectItem>
                          <SelectItem value="批复">批复</SelectItem>
                          <SelectItem value="下达">下达</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  项目描述
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={currentProject?.description || ""}
                  onChange={(e) => setCurrentProject(prev => prev ? { ...prev, description: e.target.value } : null)}
                  className="col-span-3 min-h-[100px]"
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                取消
              </Button>
              {currentProject?.id ? (
                // 编辑现有项目时显示提交按钮，提交后自动发送审批
                <Button type="button" onClick={handleEditSubmit} disabled={!isEditing}>
                  {isEditing ? '提交' : '确定'}
                </Button>
              ) : (
                // 新增项目时显示暂存和提交两个按钮
                <>
                  <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={!isEditing}>
                    暂存
                  </Button>
                  <Button type="button" onClick={handleSubmitProject} disabled={!isEditing}>
                    提交
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 提交审批确认模态框 */}
      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogContent className={cn(
          isMobile ? "max-w-[95vw] w-full" : "sm:max-w-[500px]"
        )}>
          <DialogHeader>
            <DialogTitle>提交审批</DialogTitle>
            <DialogDescription>
              请选择审批人并确认提交项目 "{selectedProjectForApproval?.name}" 进行审批
            </DialogDescription>
          </DialogHeader>
          {selectedProjectForApproval && (
            <div className="grid gap-4 py-4">
              <div className={cn(
                "items-center gap-4",
                isMobile ? "flex flex-row" : "grid grid-cols-4"
              )}>
                <Label htmlFor="approver" className={cn(
                  "whitespace-nowrap",
                  isMobile ? "text-left flex-shrink-0" : "text-right"
                )}>
                  选择审批人
                </Label>
                <Select
                  value={selectedApprover}
                  onValueChange={setSelectedApprover}
                  name="approver"
                >
                  <SelectTrigger className={cn(
                    isMobile ? "w-[100px] h-8 py-1 px-2" : "col-span-2"
                  )}>
                    <SelectValue placeholder="请选择审批人">
                      {selectedApprover}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="[&_[data-radix-select-item-indicator]]:hidden">
                    {getAvailableApprovers(currentUser.department, currentUser.center).map((user) => (
                      <SelectItem 
                        key={user.id} 
                        value={user.name}
                        className={cn(
                          isMobile ? "!py-2 !px-3 !min-h-0" : "",
                          "[&>span[data-radix-select-item-indicator]]:hidden [&>span>svg]:hidden"
                        )}
                      >
                        <div className={cn(
                          "flex flex-col",
                          isMobile ? "py-0 gap-0.5" : ""
                        )}>
                          <span className={cn(
                            "font-medium",
                            isMobile ? "leading-tight text-sm" : "leading-tight"
                          )}>{user.name}</span>
                          <span className={cn(
                            "text-muted-foreground",
                            isMobile ? "text-xs leading-tight" : "text-sm leading-tight"
                          )}>
                            {user.role} - {user.center || user.department}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-4">
                <p className="text-sm text-gray-600">
                  <strong>说明：</strong>提交后项目将无法编辑，直到审批完成。
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  • 中心用户只能提交给同中心的中心领导<br/>
                  • 部门用户只能提交给同部门的部门领导
                </p>
              </div>
            </div>
          )}
          <DialogFooter className={cn(
            isMobile ? "flex-col space-y-2" : "flex-row space-x-2"
          )}>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsApprovalModalOpen(false)}
              className={isMobile ? "w-full" : ""}
            >
              取消
            </Button>
            <Button 
              type="button" 
              onClick={handleApprovalSubmit} 
              disabled={!selectedApprover}
              className={isMobile ? "w-full" : ""}
            >
              确认提交
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
    </>
  )
}

// 主导出组件，使用 Suspense 包装
export default function ReserveProjectManagement() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8">加载中...</div>}>
      <ReserveProjectManagementWithParams />
    </Suspense>
  )
}
