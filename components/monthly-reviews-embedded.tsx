// 嵌入式月度评审组件（不包含头部和侧边栏）
"use client"

import React, { useRef, useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Eye, Edit, CalendarCheck, FileText, ClipboardList, Send, Upload, Download, CalendarIcon, ChevronDown, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { cn } from "@/lib/utils"

import {
  getMonthlyReviewsAction,
  addMonthlyReviewAction,
  getProjectsAction,
  getAllCenterProjectsAction,
  handleReviewRejectionAction,
  initiateMonthlyReviewMeetingAction,
  getMeetingMinutesByGroupAction,
  saveMeetingMinutesAction,
  getApprovalReportsByGroupAction,
  saveApprovalReportAction,
  startApprovalReportWorkflowAction,
  startMonthlyReviewParticipantConfirmationAction,
} from "@/app/actions"
import type { MonthlyReview, Project, MeetingMinutes, ApprovalReport } from "@/lib/data"
import { useUser } from "@/contexts/UserContext"
import { extractTextFromDocx, generateDocxBlob, downloadFile, validateDocxFile } from "@/lib/docx-utils"
import { generateMeetingMinutesPDF, generateReviewSummaryPDF, generateApprovalReportPDF, downloadPDF } from "@/lib/pdf-canvas-renderer"

// 日期选择器组件
function DatePicker({date, onChange, placeholder}: {date: Date|undefined, onChange: (d: Date|undefined)=>void, placeholder?: string}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="w-[140px] justify-start text-left font-normal">
          {date ? date.toLocaleDateString() : (placeholder || "选择日期")}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0">
        <Calendar 
          mode="single"
          selected={date} 
          onSelect={(selectedDate) => {
            if (selectedDate) {
              onChange(selectedDate)
            }
          }} 
          initialFocus 
        />
      </PopoverContent>
    </Popover>
  )
}

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
            "w-full justify-start text-left font-normal h-10",
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

export default function MonthlyReviewsEmbedded() {
  const { currentUser } = useUser()
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  const [reviews, setReviews] = useState<MonthlyReview[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [allCenterProjects, setAllCenterProjects] = useState<Project[]>([])
  const [isReviewDetailModalOpen, setIsReviewDetailModalOpen] = useState(false)
  const [currentReview, setCurrentReview] = useState<MonthlyReview | null>(null)
  const [originalReviewStatus, setOriginalReviewStatus] = useState<string>("")
  const [loading, setLoading] = useState(true)

  // 发起月度评审会相关状态
  const [isInitiateReviewModalOpen, setIsInitiateReviewModalOpen] = useState(false)
  const [selectedProjectsForReview, setSelectedProjectsForReview] = useState<string[]>([])
  const [meetingStartDate, setMeetingStartDate] = useState<Date | undefined>(undefined)
  const [meetingEndDate, setMeetingEndDate] = useState<Date | undefined>(undefined)
  const [meetingStartHour, setMeetingStartHour] = useState("09")
  const [meetingStartMinute, setMeetingStartMinute] = useState("00")
  const [meetingEndHour, setMeetingEndHour] = useState("12")
  const [meetingEndMinute, setMeetingEndMinute] = useState("00")
  const [meetingLocation, setMeetingLocation] = useState("")

  // 会议纪要相关状态
  const [isMeetingMinutesModalOpen, setIsMeetingMinutesModalOpen] = useState(false)
  const [currentMeetingGroup, setCurrentMeetingGroup] = useState("")
  const [meetingMinutesContent, setMeetingMinutesContent] = useState("")
  const [fileUploadStatus, setFileUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadMessage, setUploadMessage] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [existingMinutes, setExistingMinutes] = useState<MeetingMinutes | null>(null)
  const [submittedRecord, setSubmittedRecord] = useState<{fileName: string; uploadTime: string; extractedLength: number} | null>(null)

  // 批复报告相关状态
  const [isApprovalReportModalOpen, setIsApprovalReportModalOpen] = useState(false)
  const [approvalReportContent, setApprovalReportContent] = useState("")
  const [currentApprovalGroup, setCurrentApprovalGroup] = useState<string>("")
  const [currentApprovalReviews, setCurrentApprovalReviews] = useState<MonthlyReview[]>([])
  const [selectedApprovalProjects, setSelectedApprovalProjects] = useState<string[]>([])
  const [approvalTemplateType, setApprovalTemplateType] = useState<"adjustment2024" | "newProject2024" | "preArrange2025" | "adjustmentApproval2024" | "newProjectApproval2024" | "preArrangeApproval2025" | null>(null)
  const [approvalTableData, setApprovalTableData] = useState<{[key: string]: any}>({})
  const [isApprovalSubmitted, setIsApprovalSubmitted] = useState(false)
  const [existingApprovalReports, setExistingApprovalReports] = useState<ApprovalReport[]>([])
  const [showCreateNewReport, setShowCreateNewReport] = useState(false)
  const [currentSubmittedReportId, setCurrentSubmittedReportId] = useState<string | null>(null)

  // 筛选条件状态
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>(undefined)
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>(undefined)
  const [meetingCode, setMeetingCode] = useState("")
  const [includeTax, setIncludeTax] = useState(false)

  // 展开状态管理
  const [expandedMeetings, setExpandedMeetings] = useState<Set<string>>(new Set())

  const fetchAllData = async () => {
    setLoading(true)
    const fetchedReviews = await getMonthlyReviewsAction()
    const fetchedProjects = await getProjectsAction(currentUser)
    const fetchedAllCenterProjects = await getAllCenterProjectsAction()
    setReviews(fetchedReviews)
    setProjects(fetchedProjects)
    setAllCenterProjects(fetchedAllCenterProjects)
    setLoading(false)
  }

  useEffect(() => {
    if (isClient) {
      fetchAllData()
    }
  }, [currentUser, isClient])

  // 权限控制
  const canInitiateReview = currentUser.department === "发展策划部门"

  // 切换会议展开状态
  const toggleMeetingExpansion = (groupKey: string) => {
    const newExpanded = new Set(expandedMeetings)
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey)
    } else {
      newExpanded.add(groupKey)
    }
    setExpandedMeetings(newExpanded)
  }

  // 可发起评审的项目（状态为"评审"的项目）
  const reservableProjects = useMemo(() => allCenterProjects.filter((p) => p.status === "评审"), [allCenterProjects])

  // 获取项目归属显示
  const getProjectAffiliationDisplay = (project: Project) => {
    return project.center || project.department || "未知"
  }

  // 计算项目总收入（含税/不含税）
  const calculateProjectTotalIncome = (project: Project, includeTax: boolean): number => {
    if (!project.financialRows || project.financialRows.length === 0) return 0
    
    return project.financialRows.reduce((total, row) => {
      const baseIncome = row.plannedIncome || 0 // 存储的是含税金额
      if (includeTax) {
        // 含税金额直接返回
        return total + baseIncome
      } else {
        // 不含税金额 = 含税金额 ÷ (1 + 税率/100)
        const taxRate = row.incomeTaxRate || 0
        return total + baseIncome / (1 + taxRate / 100)
      }
    }, 0)
  }

  // 计算项目总支出（含税/不含税）
  const calculateProjectTotalExpense = (project: Project, includeTax: boolean): number => {
    if (!project.financialRows || project.financialRows.length === 0) return 0
    
    return project.financialRows.reduce((total, row) => {
      const baseExpense = row.plannedExpense || 0 // 存储的是含税金额
      if (includeTax) {
        // 含税金额直接返回
        return total + baseExpense
      } else {
        // 不含税金额 = 含税金额 ÷ (1 + 税率/100)
        const taxRate = row.expenseTaxRate || 0
        return total + baseExpense / (1 + taxRate / 100)
      }
    }, 0)
  }

  // 计算会议组中所有项目的总收入
  const calculateGroupTotalIncome = (reviewsInGroup: MonthlyReview[], includeTax: boolean): number => {
    return reviewsInGroup.reduce((total, review) => {
      const project = allCenterProjects.find(p => p.id === review.projectId)
      if (project) {
        return total + calculateProjectTotalIncome(project, includeTax)
      }
      return total
    }, 0)
  }

  // 计算会议组中所有项目的总支出
  const calculateGroupTotalExpense = (reviewsInGroup: MonthlyReview[], includeTax: boolean): number => {
    return reviewsInGroup.reduce((total, review) => {
      const project = allCenterProjects.find(p => p.id === review.projectId)
      if (project) {
        return total + calculateProjectTotalExpense(project, includeTax)
      }
      return total
    }, 0)
  }

  // 格式化金额显示
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  // 处理发起月度评审会
  const handleInitiateReviewMeeting = async () => {
    if (selectedProjectsForReview.length === 0) {
      alert("请选择至少一个项目发起评审会。")
      return
    }

    if (!meetingStartDate || !meetingStartHour || !meetingStartMinute || !meetingEndHour || !meetingEndMinute || !meetingLocation) {
      alert("请填写完整的会议时间和地点信息。")
      return
    }

    const startDateTime = new Date(meetingStartDate)
    startDateTime.setHours(parseInt(meetingStartHour), parseInt(meetingStartMinute), 0, 0)
    
    const endDateTime = new Date(meetingStartDate)
    endDateTime.setHours(parseInt(meetingEndHour), parseInt(meetingEndMinute), 0, 0)

    if (endDateTime <= startDateTime) {
      alert("会议结束时间必须晚于开始时间。")
      return
    }

    const meetingInfo = {
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      location: meetingLocation
    }

    const startTimeStr = `${startDateTime.toLocaleDateString('zh-CN')} ${meetingStartHour}:${meetingStartMinute}`
    const endTimeStr = `${endDateTime.toLocaleDateString('zh-CN')} ${meetingEndHour}:${meetingEndMinute}`

    if (window.confirm(`确定要为选中的 ${selectedProjectsForReview.length} 个项目发起月度评审会吗？\n时间：${startTimeStr} 至 ${endTimeStr}\n地点：${meetingLocation}`)) {
      const result = await initiateMonthlyReviewMeetingAction(selectedProjectsForReview, currentUser.name, meetingInfo)
      if (result.success) {
        alert(result.message)
        setIsInitiateReviewModalOpen(false)
        setSelectedProjectsForReview([])
        setMeetingStartDate(undefined)
        setMeetingEndDate(undefined)
        setMeetingLocation("")
        fetchAllData()
      } else {
        alert(result.message)
      }
    }
  }

  // 分组评审记录
  const groupedReviews = useMemo(() => {
    const groups: { [key: string]: MonthlyReview[] } = {}
    reviews.forEach(review => {
      const groupKey = review.meetingInfo?.meetingGroup || "未分组"
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(review)
    })
    return groups
  }, [reviews])

  const formatMeetingGroupDisplay = (groupKey: string): string => {
    if (groupKey === "未分组") return "未分组"
    const parts = groupKey.split('_')
    if (parts.length >= 3) {
      const date = parts[0]
      const time = parts[1]
      const location = parts.slice(2).join('_')
      return `${date} ${time} ${location}`
    }
    return groupKey
  }

  // 表格数据处理函数
  const getTableDataValue = (projectId: string, field: string): string => {
    return approvalTableData[projectId]?.[field] || ""
  }

  const updateTableData = (projectId: string, field: string, value: string) => {
    setApprovalTableData(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        [field]: value
      }
    }))
  }

  const handleSaveReview = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!currentReview) return

    if (!currentReview.projectId || !currentReview.projectName || !currentReview.reviewDate || !currentReview.reviewer) {
      alert("请填写完整的评审信息！")
      return
    }

    if (currentReview.status === "已驳回" && !currentReview.comments?.trim()) {
      alert("评审结果为不通过时，必须填写评审意见！")
      return
    }

    const formData = new FormData()
    if (currentReview.id) {
      formData.set("id", currentReview.id)
    }
    formData.set("projectId", currentReview.projectId)
    formData.set("projectName", currentReview.projectName)
    formData.set("reviewDate", currentReview.reviewDate)
    formData.set("reviewer", currentReview.reviewer)
    formData.set("status", currentReview.status)
    formData.set("comments", currentReview.comments || "")

    const result = await addMonthlyReviewAction(formData)
    if (result) {
      if (currentReview.id) {
        setReviews(reviews.map(r => r.id === currentReview.id ? result : r))
        alert("评审记录更新成功！")
      } else {
        setReviews([...reviews, result])
        alert("评审记录新增成功！")
      }
      
      if (currentReview.status === "已驳回") {
        const updateResult = await handleReviewRejectionAction(currentReview.projectId)
        if (updateResult.success) {
          alert("项目已退回给项目负责人，可重新编辑和提交。")
        } else {
          alert("项目状态更新失败：" + updateResult.message)
        }
      }
      
      setOriginalReviewStatus(result.status)
    } else {
      alert("保存失败，请重试。")
    }
    setIsReviewDetailModalOpen(false)
  }

  return (
    <>
    <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">月度评审</h2>
      </div>

      {/* 筛选区域 */}
      <div className="mb-6 flex gap-4 items-end">
        <div className="w-[150px]">
          <Label htmlFor="search-input" className="block text-sm font-medium text-gray-700 mb-1">
            会议编号
          </Label>
          <Input
            id="search-input"
            placeholder="请输入"
            value={meetingCode}
            onChange={(e) => setMeetingCode(e.target.value)}
            className="h-10"
          />
        </div>
        
        <div className="w-[150px]">
          <Label className="block text-sm font-medium text-gray-700 mb-1">
            评审时间
          </Label>
          <EnhancedDatePicker
            date={filterStartDate}
            onDateChange={setFilterStartDate}
            placeholder="开始日期"
          />
        </div>
        
        <div className="w-[20px] flex items-center justify-center h-10">
          <span className="text-gray-500 font-medium">-</span>
        </div>
        
        <div className="w-[150px]">
          <Label className="block text-sm font-medium text-gray-700 mb-1">
            结束日期
          </Label>
          <EnhancedDatePicker
            date={filterEndDate}
            onDateChange={setFilterEndDate}
            placeholder="结束日期"
          />
        </div>
        
        <div className="flex items-center space-x-2 h-10">
          <Checkbox
            id="include-tax"
            checked={includeTax}
            onCheckedChange={(checked) => setIncludeTax(checked === true)}
            className="data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500"
          />
          <Label htmlFor="include-tax" className="text-sm text-gray-700 whitespace-nowrap">
            是否含税
          </Label>
        </div>
        
        <div className="flex gap-3 ml-auto items-center h-10">
          <Button
            variant="outline"
            className="bg-gray-500 hover:bg-gray-600 text-white border-gray-500 px-6"
            onClick={() => {
              setMeetingCode("")
              setFilterStartDate(undefined)
              setFilterEndDate(undefined)
              setIncludeTax(false)
            }}
          >
            重置
          </Button>
          
          {canInitiateReview && (
            <Button
              onClick={() => setIsInitiateReviewModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              月度评审发起
            </Button>
          )}
        </div>
      </div>

      {/* 表格区域 - 始终显示 */}
      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 w-full">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="h-12">
                <TableHead className="text-center text-sm font-semibold text-gray-700 px-4 py-3 w-[40px]"></TableHead>
                <TableHead className="text-left text-sm font-semibold text-gray-700 px-4 py-3 w-[180px] whitespace-nowrap">会议编号</TableHead>
                <TableHead className="text-center text-sm font-semibold text-gray-700 px-4 py-3 w-[70px] whitespace-nowrap">项目总数量</TableHead>
                <TableHead className="text-center text-sm font-semibold text-gray-700 px-4 py-3 w-[120px] whitespace-nowrap text-xs leading-tight">项目支出总金额<br/>({includeTax ? '含税' : '不含税'}/元)</TableHead>
                <TableHead className="text-center text-sm font-semibold text-gray-700 px-4 py-3 w-[120px] whitespace-nowrap text-xs leading-tight">项目收入总金额<br/>({includeTax ? '含税' : '不含税'}/元)</TableHead>
                <TableHead className="text-center text-sm font-semibold text-gray-700 px-4 py-3 w-[80px] whitespace-nowrap">评审时间</TableHead>
                <TableHead className="text-center text-sm font-semibold text-gray-700 px-4 py-3 w-[70px] whitespace-nowrap text-xs leading-tight">归口审核<br/>通过</TableHead>
                <TableHead className="text-center text-sm font-semibold text-gray-700 px-4 py-3 w-[90px] whitespace-nowrap text-xs leading-tight">根据评审意见<br/>修改后通过</TableHead>
                <TableHead className="text-center text-sm font-semibold text-gray-700 px-4 py-3 w-[70px] whitespace-nowrap text-xs leading-tight">归口审核<br/>不通过</TableHead>
                <TableHead className="text-center text-sm font-semibold text-gray-700 px-4 py-3 w-[70px] whitespace-nowrap">总通过率</TableHead>
                <TableHead className="text-center text-sm font-semibold text-gray-700 px-4 py-3 w-[240px] whitespace-nowrap">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-gray-600">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : Object.keys(groupedReviews).length === 0 ? (
                <TableRow>
                  <TableCell className="text-center">-</TableCell>
                  <TableCell className="text-center">-</TableCell>
                  <TableCell className="text-center">-</TableCell>
                  <TableCell className="text-center">-</TableCell>
                  <TableCell className="text-center">-</TableCell>
                  <TableCell className="text-center">-</TableCell>
                  <TableCell className="text-center">-</TableCell>
                  <TableCell className="text-center">-</TableCell>
                  <TableCell className="text-center">-</TableCell>
                  <TableCell className="text-center">-</TableCell>
                  <TableCell className="text-center">-</TableCell>
                </TableRow>
              ) : (
                <>
                  {Object.entries(groupedReviews).map(([groupKey, reviewsInGroup]) => (
                    <React.Fragment key={groupKey}>
                      {/* 会议汇总行 */}
                      <TableRow className="hover:bg-gray-50 bg-blue-50 border-b-2 border-blue-200">
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleMeetingExpansion(groupKey)}
                            className="p-1 h-6 w-6"
                          >
                            {expandedMeetings.has(groupKey) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="text-left font-medium text-blue-700">
                          {groupKey.split('_')[0] + '_' + groupKey.split('_')[1]}
                        </TableCell>
                        <TableCell className="text-center font-medium">{reviewsInGroup.length}</TableCell>
                        <TableCell className="text-center">{formatAmount(calculateGroupTotalExpense(reviewsInGroup, includeTax))}</TableCell>
                        <TableCell className="text-center">{formatAmount(calculateGroupTotalIncome(reviewsInGroup, includeTax))}</TableCell>
                        <TableCell className="text-center">{reviewsInGroup[0]?.reviewDate || '-'}</TableCell>
                        <TableCell className="text-center">{reviewsInGroup.filter(r => r.status === "已评审").length}</TableCell>
                        <TableCell className="text-center">0</TableCell>
                        <TableCell className="text-center">{reviewsInGroup.filter(r => r.status === "已驳回").length}</TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium text-green-600">
                            {reviewsInGroup.length > 0 ? 
                              ((reviewsInGroup.filter(r => r.status === "已评审").length / reviewsInGroup.length) * 100).toFixed(1) + '%' 
                              : '0%'
                            }
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center space-x-1">
                            {/* 只有当所有项目都已审核完成时才显示操作按钮 */}
                            {reviewsInGroup.every(r => r.status === "已评审" || r.status === "已驳回") ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    setCurrentApprovalGroup(groupKey)
                                    setCurrentApprovalReviews(reviewsInGroup)
                                    setSelectedApprovalProjects([])
                                    setApprovalTemplateType(null)
                                    setApprovalTableData({})
                                    setIsApprovalSubmitted(false)
                                    setShowCreateNewReport(false)
                                    
                                    // 加载该会议组的历史批复报告
                                    try {
                                      const reports = await getApprovalReportsByGroupAction(groupKey)
                                      setExistingApprovalReports(reports)
                                    } catch (error) {
                                      console.error('Failed to load approval reports:', error)
                                      setExistingApprovalReports([])
                                    }
                                    
                                    setIsApprovalReportModalOpen(true)
                                  }}
                                  className="text-green-600 hover:text-green-700 text-xs px-2 py-1"
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  发起批复表
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    setCurrentMeetingGroup(groupKey)
                                    
                                    // 先重置状态
                                    setMeetingMinutesContent("")
                                    setFileUploadStatus('idle')
                                    setUploadMessage("")
                                    setIsEditing(false)
                                    setUploadedFile(null)
                                    setIsSaving(false)
                                    setIsSubmitted(false)
                                    setExistingMinutes(null)
                                    setSubmittedRecord(null)
                                    
                                    // 尝试加载已有的会议纪要
                                    try {
                                      const existingRecord = await getMeetingMinutesByGroupAction(groupKey)
                                      if (existingRecord) {
                                        setExistingMinutes(existingRecord)
                                        setMeetingMinutesContent(existingRecord.content)
                                        setIsSubmitted(true)
                                        
                                        // 如果有文件名，设置提交记录信息
                                        if (existingRecord.fileName) {
                                          setSubmittedRecord({
                                            fileName: existingRecord.fileName,
                                            uploadTime: new Date(existingRecord.updatedAt).toLocaleString('zh-CN'),
                                            extractedLength: existingRecord.content.length
                                          })
                                        }
                                      }
                                    } catch (error) {
                                      console.error('Failed to load existing meeting minutes:', error)
                                    }
                                    
                                    setIsMeetingMinutesModalOpen(true)
                                  }}
                                  className="text-blue-600 hover:text-blue-700 text-xs px-2 py-1"
                                >
                                  <ClipboardList className="h-3 w-3 mr-1" />
                                  会议纪要
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      const { generateReviewSummaryPDF, downloadPDF } = await import("@/lib/pdf-canvas-renderer")
                                      const pdfBlob = await generateReviewSummaryPDF(reviewsInGroup, formatMeetingGroupDisplay(groupKey))
                                      const filename = `评审意见汇总表_${formatMeetingGroupDisplay(groupKey).replace(/[\s:/\\]/g, '_')}.pdf`
                                      downloadPDF(pdfBlob, filename)
                                    } catch (error) {
                                      console.error('Generate review summary error:', error)
                                      alert('生成评审意见汇总表失败，请重试')
                                    }
                                  }}
                                  className="text-purple-600 hover:text-purple-700 text-xs px-2 py-1"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  评审意见汇总表
                                </Button>
                              </>
                            ) : (
                              <span className="text-gray-400 text-xs">
                                等待所有项目审核完成
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* 项目详情行 - 只在展开时显示 */}
                      {expandedMeetings.has(groupKey) && reviewsInGroup.map((review, index) => {
                        const project = allCenterProjects.find(p => p.id === review.projectId)
                        return (
                          <TableRow key={`${groupKey}-${review.id}`} className="hover:bg-gray-50 bg-gray-25">
                            <TableCell className="text-center">
                              <div className="w-4 h-4 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">└</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-left pl-8">
                              <div>
                                <div className="font-medium text-gray-800">{review.projectName}</div>
                                <div className="text-sm text-gray-500">ID: {review.projectId}</div>
                                {project && (
                                  <div className="text-xs text-gray-400">
                                    归属: {getProjectAffiliationDisplay(project)}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-gray-500">-</TableCell>
                            <TableCell className="text-center">{project ? formatAmount(calculateProjectTotalExpense(project, includeTax)) : '-'}</TableCell>
                            <TableCell className="text-center">{project ? formatAmount(calculateProjectTotalIncome(project, includeTax)) : '-'}</TableCell>
                            <TableCell className="text-center">{review.reviewDate}</TableCell>
                            <TableCell className="text-center">
                              {review.status === "已评审" ? "1" : "0"}
                            </TableCell>
                            <TableCell className="text-center">0</TableCell>
                            <TableCell className="text-center">
                              {review.status === "已驳回" ? "1" : "0"}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                review.status === "已评审" ? "bg-green-100 text-green-700" :
                                review.status === "已驳回" ? "bg-red-100 text-red-700" :
                                "bg-yellow-100 text-yellow-700"
                              }`}>
                                {review.status === "已评审" ? "通过" :
                                 review.status === "已驳回" ? "不通过" : "待审"}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center space-x-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setCurrentReview(review)
                                    setOriginalReviewStatus(review.status)
                                    setIsReviewDetailModalOpen(true)
                                  }}
                                  className="text-blue-600 hover:text-blue-700 text-xs px-2 py-1"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  审核
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </React.Fragment>
                  ))}
                </>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>

    {/* Review Detail Modal */}
    <Dialog open={isReviewDetailModalOpen} onOpenChange={setIsReviewDetailModalOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{currentReview?.id ? "评审详情" : "新增评审记录"}</DialogTitle>
          <DialogDescription>
            {currentReview?.id ? "查看月度评审的详细信息。" : "填写新的月度评审记录。"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSaveReview}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project-select" className="text-right">
                项目名称
              </Label>
              {originalReviewStatus !== "" && originalReviewStatus !== "待评审" ? (
                <Input
                  value={currentReview?.projectName || ""}
                  className="col-span-3"
                  disabled={true}
                  readOnly={true}
                />
              ) : (
                <Select
                  value={currentReview?.projectId || ""}
                  onValueChange={(value) => {
                    const selectedProject = allCenterProjects.find(p => p.id === value)
                    if (selectedProject && currentReview) {
                      setCurrentReview({
                        ...currentReview,
                        projectId: value,
                        projectName: selectedProject.name
                      })
                    }
                  }}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="选择项目" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCenterProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name} ({project.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="review-date" className="text-right">
                评审日期
              </Label>
              <Input
                id="review-date"
                type="date"
                value={currentReview?.reviewDate || ""}
                onChange={(e) => setCurrentReview(prev => prev ? { ...prev, reviewDate: e.target.value } : null)}
                className="col-span-3"
                disabled={originalReviewStatus !== "" && originalReviewStatus !== "待评审"}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reviewer" className="text-right">
                评审人
              </Label>
              <Input
                id="reviewer"
                value={currentReview?.reviewer || ""}
                onChange={(e) => setCurrentReview(prev => prev ? { ...prev, reviewer: e.target.value } : null)}
                className="col-span-3"
                disabled={originalReviewStatus !== "" && originalReviewStatus !== "待评审"}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                评审结果
              </Label>
              <Select
                value={currentReview?.status || "待评审"}
                onValueChange={(value: "待评审" | "已评审" | "已驳回") => setCurrentReview(prev => prev ? { ...prev, status: value } : null)}
                disabled={originalReviewStatus !== "" && originalReviewStatus !== "待评审"}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择评审结果" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="待评审">待评审</SelectItem>
                  <SelectItem value="已评审">通过</SelectItem>
                  <SelectItem value="已驳回">不通过</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="comments" className="text-right">
                评审意见
              </Label>
              <Textarea
                id="comments"
                value={currentReview?.comments || ""}
                onChange={(e) => setCurrentReview(prev => prev ? { ...prev, comments: e.target.value } : null)}
                className="col-span-3 min-h-[100px]"
                placeholder="请填写评审意见（不通过时必填）"
                disabled={originalReviewStatus !== "" && originalReviewStatus !== "待评审"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsReviewDetailModalOpen(false)}>
              取消
            </Button>
            <Button 
              type="submit" 
              disabled={originalReviewStatus !== "" && originalReviewStatus !== "待评审"}
            >
              {originalReviewStatus !== "" && originalReviewStatus !== "待评审" ? '确定' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* Initiate Monthly Review Meeting Modal */}
    <Dialog open={isInitiateReviewModalOpen} onOpenChange={setIsInitiateReviewModalOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>发起月度评审会</DialogTitle>
          <DialogDescription>选择状态为"评审"的项目，发起月度评审会。</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {reservableProjects.length === 0 ? (
            <p className="text-center text-gray-500">当前没有状态为"评审"的项目可供评审。</p>
          ) : (
            <ScrollArea className="max-h-[300px] w-full border rounded-md">
              <div className="p-4">
                {reservableProjects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-2 py-2 border-b last:border-b-0">
                    <Checkbox
                      id={`project-${project.id}`}
                      checked={selectedProjectsForReview.includes(project.id)}
                      onCheckedChange={(checked) => {
                        setSelectedProjectsForReview((prev) =>
                          checked ? [...prev, project.id] : prev.filter((id) => id !== project.id),
                        )
                      }}
                    />
                    <Label htmlFor={`project-${project.id}`} className="flex-1 cursor-pointer">
                      {project.name} ({project.id}) - {getProjectAffiliationDisplay(project)}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* 会议时间范围 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-green-700 mb-2 block flex items-center">
                <span className="w-2 h-2 bg-teal-500 rounded-full mr-2"></span>
                会议开始时间
              </Label>
              <div className="space-y-3">
                <DatePicker 
                  date={meetingStartDate} 
                  onChange={(date) => {
                    setMeetingStartDate(date)
                    if (date) {
                      setMeetingEndDate(date)
                    }
                  }} 
                  placeholder="选择日期" 
                />
                <div className="flex items-center justify-center bg-white rounded-lg border-2 border-green-200 p-3 shadow-sm h-[60px]">
                  <Select value={meetingStartHour} onValueChange={setMeetingStartHour}>
                    <SelectTrigger className="w-16 border-0 text-lg font-semibold focus:ring-0">
                      <SelectValue placeholder="09" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length:24},(_,i)=>i.toString().padStart(2,'0')).map(h=>(
                        <SelectItem key={h} value={h} className="text-center">{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-2xl font-bold text-gray-400 mx-2">:</span>
                  <Select value={meetingStartMinute} onValueChange={setMeetingStartMinute}>
                    <SelectTrigger className="w-16 border-0 text-lg font-semibold focus:ring-0">
                      <SelectValue placeholder="00" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length:60},(_,i)=>i.toString().padStart(2,'0')).map(m=>(
                        <SelectItem key={m} value={m} className="text-center">{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-red-700 mb-2 block flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                会议结束时间
              </Label>
              <div className="space-y-3">
                <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded-lg border border-blue-300 flex items-center h-[40px]">
                  <CalendarCheck className="w-4 h-4 mr-2" />
                  <span className="font-medium">
                    日期: {meetingStartDate ? meetingStartDate.toLocaleDateString('zh-CN') : '请先选择开始日期'}
                  </span>
                </div>
                <div className="flex items-center justify-center bg-white rounded-lg border-2 border-red-200 p-3 shadow-sm h-[60px]">
                  <Select value={meetingEndHour} onValueChange={setMeetingEndHour}>
                    <SelectTrigger className="w-16 border-0 text-lg font-semibold focus:ring-0">
                      <SelectValue placeholder="12" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length:24},(_,i)=>i.toString().padStart(2,'0')).map(h=>(
                        <SelectItem key={h} value={h} className="text-center">{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-2xl font-bold text-gray-400 mx-2">:</span>
                  <Select value={meetingEndMinute} onValueChange={setMeetingEndMinute}>
                    <SelectTrigger className="w-16 border-0 text-lg font-semibold focus:ring-0">
                      <SelectValue placeholder="00" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length:60},(_,i)=>i.toString().padStart(2,'0')).map(m=>(
                        <SelectItem key={m} value={m} className="text-center">{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* 会议地点 */}
          <div>
            <Label htmlFor="meeting-location" className="text-sm font-medium text-gray-700 mb-1 block">
              会议地点
            </Label>
            <Input
              id="meeting-location"
              type="text"
              placeholder="请输入会议地点，如：会议室A-301"
              value={meetingLocation}
              onChange={(e) => setMeetingLocation(e.target.value)}
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsInitiateReviewModalOpen(false)}>
            取消
          </Button>
          <Button
            onClick={handleInitiateReviewMeeting}
            disabled={selectedProjectsForReview.length === 0 || reservableProjects.length === 0 || !meetingStartDate || !meetingStartHour || !meetingStartMinute || !meetingEndHour || !meetingEndMinute || !meetingLocation}
          >
            确认发起评审会 ({selectedProjectsForReview.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* 会议纪要模态框 */}
    <Dialog open={isMeetingMinutesModalOpen} onOpenChange={setIsMeetingMinutesModalOpen}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>会议纪要 - {currentMeetingGroup}</DialogTitle>
          <DialogDescription>
            {existingMinutes ? 
              `查看和编辑会议纪要内容 (状态: ${existingMinutes.status})` : 
              "编辑会议纪要内容或上传Word文档"
            }
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* 文本编辑区域 */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="minutes-content">会议纪要内容</Label>
              {meetingMinutesContent && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>字数：{meetingMinutesContent.length}</span>
                  <span>行数：{meetingMinutesContent.split('\n').length}</span>
                  {isEditing && (
                    <span className="text-green-600 flex items-center">
                      <span className="w-2 h-2 bg-teal-500 rounded-full mr-1 animate-pulse"></span>
                      可编辑
                    </span>
                  )}
                </div>
              )}
            </div>
            <Textarea
              id="minutes-content"
              value={meetingMinutesContent}
              onChange={(e) => {
                setMeetingMinutesContent(e.target.value)
                if (!isEditing && e.target.value) {
                  setIsEditing(true)
                }
              }}
              placeholder="请输入会议纪要内容，或上传Word文档自动填充..."
              className="min-h-[300px] font-mono resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 whitespace-pre-wrap leading-relaxed"
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                lineHeight: '1.6',
                tabSize: '4'
              }}
            />
          </div>
          
          {/* 文件上传区域 */}
          <div className="grid gap-2">
            <Label>或上传Word文档</Label>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".doc,.docx"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    // 验证文件类型
                    const validation = validateDocxFile(file)
                    if (!validation.valid) {
                      setFileUploadStatus('error')
                      setUploadMessage(validation.message)
                      return
                    }
                    
                    setFileUploadStatus('uploading')
                    setUploadMessage('正在解析Word文件...')
                    
                    try {
                      // 真实解析docx文件内容
                      const extractedContent = await extractTextFromDocx(file)
                      
                      setUploadedFile(file)
                      setMeetingMinutesContent(extractedContent)
                      setFileUploadStatus('success')
                      setUploadMessage(`文件 ${file.name} 解析成功！提取到 ${extractedContent.length} 个字符`)
                      setIsEditing(true)
                      
                      // 保存上传信息，但不显示（只有提交成功才显示）
                      setSubmittedRecord({
                        fileName: file.name,
                        uploadTime: new Date().toLocaleString('zh-CN'),
                        extractedLength: extractedContent.length
                      })
                    } catch (error) {
                      console.error('File upload error:', error)
                      setFileUploadStatus('error')
                      setUploadMessage(`文件解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
                    }
                  }
                }}
                className="flex-1"
                disabled={fileUploadStatus === 'uploading'}
              />
              {fileUploadStatus === 'uploading' && (
                <div className="flex items-center text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  解析中...
                </div>
              )}
              {uploadedFile && fileUploadStatus === 'success' && (
                <div className="flex items-center text-sm text-green-600">
                  <FileText className="h-4 w-4 mr-1" />
                  {uploadedFile.name} ✓
                </div>
              )}
              {fileUploadStatus === 'error' && (
                <div className="flex items-center text-sm text-red-600">
                  <span className="mr-1">✗</span>
                  导入失败
                </div>
              )}
            </div>
            {uploadMessage && (
              <div className={`text-sm p-3 rounded-lg ${
                fileUploadStatus === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                fileUploadStatus === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {uploadMessage}
              </div>
            )}
            {isEditing && (
              <div className="text-sm bg-yellow-50 text-yellow-700 p-3 rounded-lg border border-yellow-200">
                💡 提示：文件内容已导入到编辑器中，您可以直接在上方文本框中编辑内容
              </div>
            )}
            {existingMinutes && (
              <div className="text-sm bg-blue-50 text-blue-700 p-3 rounded-lg border border-blue-200">
                📄 文档信息：由 {existingMinutes.submittedBy} 于 {new Date(existingMinutes.updatedAt).toLocaleString('zh-CN')} 提交
                {existingMinutes.fileName && (
                  <span className="block mt-1">原文件：{existingMinutes.fileName}</span>
                )}
              </div>
            )}
            {/* 提交成功记录 - 只在提交成功后显示 */}
            {isSubmitted && submittedRecord && (
              <div className="text-sm bg-green-50 text-green-700 p-3 rounded-lg border border-green-200">
                🎉 会议纪要提交成功！
                <div className="mt-2">
                  <div className="text-xs bg-green-100 p-2 rounded border">
                    <div className="font-medium">原文件：{submittedRecord.fileName}</div>
                    <div className="text-green-600">
                      上传时间：{submittedRecord.uploadTime} | 提取字符：{submittedRecord.extractedLength}个
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {/* 下载按钮 - 只在提交成功后显示 */}
            {(isSubmitted || existingMinutes) && meetingMinutesContent && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    if (!meetingMinutesContent) {
                      alert("没有内容可以下载")
                      return
                    }
                    
                    try {
                      const { generateDocxBlob, downloadFile } = await import("@/lib/docx-utils")
                      const blob = generateDocxBlob(meetingMinutesContent, `会议纪要_${formatMeetingGroupDisplay(currentMeetingGroup)}`)
                      const filename = `会议纪要_${formatMeetingGroupDisplay(currentMeetingGroup).replace(/[\s:/\\]/g, '_')}.docx`
                      downloadFile(blob, filename)
                    } catch (error) {
                      console.error('Download Word error:', error)
                      alert('下载失败，请重试')
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-1" />
                  下载Word
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    if (!meetingMinutesContent) {
                      alert("没有内容可以下载")
                      return
                    }
                    
                    try {
                      const { generateMeetingMinutesPDF, downloadPDF } = await import("@/lib/pdf-canvas-renderer")
                      const pdfBlob = await generateMeetingMinutesPDF(meetingMinutesContent, currentMeetingGroup)
                      const filename = `会议纪要_${formatMeetingGroupDisplay(currentMeetingGroup).replace(/[\s:/\\]/g, '_')}.pdf`
                      downloadPDF(pdfBlob, filename)
                    } catch (error) {
                      console.error('Download PDF error:', error)
                      alert('下载失败，请重试')
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-1" />
                  下载PDF
                </Button>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsMeetingMinutesModalOpen(false)}
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (!meetingMinutesContent.trim()) {
                  alert("请输入会议纪要内容")
                  return
                }
                
                setIsSaving(true)
                try {
                  const formData = new FormData()
                  if (existingMinutes) {
                    formData.set("id", existingMinutes.id)
                  }
                  formData.set("meetingGroup", currentMeetingGroup)
                  formData.set("content", meetingMinutesContent)
                  formData.set("submittedBy", currentUser.name)
                  formData.set("status", "已提交")
                  if (uploadedFile) {
                    formData.set("fileName", uploadedFile.name)
                  }
                  
                  const result = await saveMeetingMinutesAction(formData)
                  if (result) {
                    alert("会议纪要保存成功！")
                    setExistingMinutes(result)
                    setIsSubmitted(true)
                    setIsMeetingMinutesModalOpen(false)
                  } else {
                    alert("保存失败，请重试")
                  }
                } catch (error) {
                  console.error('Save error:', error)
                  alert("保存失败，请重试")
                } finally {
                  setIsSaving(false)
                }
              }}
              disabled={!meetingMinutesContent.trim() || isSaving}
            >
              {isSaving ? "保存中..." : existingMinutes ? "更新" : "提交"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* 批复报告模态框 */}
    <Dialog open={isApprovalReportModalOpen} onOpenChange={setIsApprovalReportModalOpen}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>发起批复报告</DialogTitle>
          <DialogDescription>
            为评审会 "{formatMeetingGroupDisplay(currentApprovalGroup)}" 创建批复报告
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
          {!showCreateNewReport && !isApprovalSubmitted ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">历史批复报告</h3>
                <Button
                  onClick={() => setShowCreateNewReport(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  创建新报告
                </Button>
              </div>
              
              {existingApprovalReports.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">没有批复报告</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      还没有为此评审会创建过批复报告
                    </p>
                  </div>
                </div>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="space-y-3">
                    {existingApprovalReports.map((report) => (
                      <div key={report.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{report.templateName}</h4>
                            <p className="text-sm text-gray-500">
                              提交时间: {new Date(report.submittedAt).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">
                              提交人: {report.submittedBy}
                            </p>
                            <div className="text-sm text-gray-500 mb-2">
                              <span className="font-medium">状态: </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                report.status === "已审批" ? "bg-green-100 text-green-700" :
                                report.status === "待审批" ? "bg-yellow-100 text-yellow-700" :
                                report.status === "确认中" ? "bg-blue-100 text-blue-700" :
                                report.status === "待确认" ? "bg-orange-100 text-orange-700" :
                                report.status === "已驳回" ? "bg-red-100 text-red-700" :
                                "bg-gray-100 text-gray-700"
                              }`}>
                                {report.status}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                               <span className="font-medium">包含项目:</span>
                               <div className="mt-2 space-y-2">
                                 {report.selectedProjects.map(projectId => {
                                   const review = currentApprovalReviews.find(r => r.id === projectId)
                                   if (!review) return null
                                   
                                   // 查找对应的项目详细信息
                                   const project = allCenterProjects.find(p => p.id === review.projectId)
                                   
                                   return (
                                     <div key={projectId} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-3 hover:shadow-sm transition-shadow">
                                       <div className="flex items-start justify-between">
                                         <div className="flex-1 min-w-0">
                                           <h5 className="font-semibold text-gray-900 text-sm truncate mb-1">{review.projectName}</h5>
                                           <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                             <div className="flex items-center text-gray-600">
                                               <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5 flex-shrink-0"></span>
                                               <span className="font-medium mr-1">编号:</span>
                                               <span className="truncate">{review.projectId}</span>
                                             </div>
                                             {project?.center && (
                                               <div className="flex items-center text-gray-600">
                                                 <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5 flex-shrink-0"></span>
                                                 <span className="font-medium mr-1">归属:</span>
                                                 <span className="truncate">{project.center}</span>
                                               </div>
                                             )}
                                             {project?.owner && (
                                               <div className="flex items-center text-gray-600">
                                                 <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5 flex-shrink-0"></span>
                                                 <span className="font-medium mr-1">负责人:</span>
                                                 <span className="truncate">{project.owner}</span>
                                               </div>
                                             )}
                                           </div>
                                         </div>
                                         <div className="ml-3 flex-shrink-0">
                                           <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                             ✓ 已评审
                                           </div>
                                         </div>
                                       </div>
                                     </div>
                                   )
                                 })}
                               </div>
                             </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              onClick={async () => {
                                try {
                                  // 动态导入docx生成函数
                                  const { generateApprovalReportDocx, downloadFile } = await import("@/lib/docx-utils")
                                  
                                  // 构建正确的表格数据格式
                                  const formattedTableData = report.selectedProjects.map(projectId => ({
                                    projectId: projectId,
                                    ...report.tableData[projectId] || {}
                                  }))
                                  
                                  const docxBlob = generateApprovalReportDocx(
                                    report.templateType,
                                    formattedTableData,
                                    report.selectedProjects.map(id => {
                                      const review = currentApprovalReviews.find(r => r.id === id)!
                                      return review
                                    }),
                                    currentUser
                                  )
                                  
                                  const filename = report.fileName || `${report.templateName}_${formatMeetingGroupDisplay(currentApprovalGroup).replace(/[\s:/\\]/g, '_')}.docx`
                                  
                                  downloadFile(docxBlob, filename)
                                } catch (error) {
                                  console.error('下载批复报告失败:', error)
                                  alert('下载失败，请重试')
                                }
                              }}
                              variant="outline"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              下载
                            </Button>
                            {report.status === "草稿" && (
                              <Button
                                onClick={async () => {
                                  try {
                                    // 首先启动月度审核参与人确认流程
                                    const participantResult = await startMonthlyReviewParticipantConfirmationAction(currentApprovalGroup, report.selectedProjects)
                                    if (participantResult.success) {
                                      console.log('月度审核参与人确认流程已启动:', participantResult.message)
                                      
                                      // 然后启动批复报告审批流程
                                      const result = await startApprovalReportWorkflowAction(report.id)
                                      if (result.success) {
                                        alert(`${participantResult.message}\n\n${result.message}`)
                                        // 重新加载历史报告列表以更新状态
                                        const reports = await getApprovalReportsByGroupAction(currentApprovalGroup)
                                        setExistingApprovalReports(reports)
                                      } else {
                                        alert(`参与人确认流程已启动，但批复报告审批流程启动失败：${result.message}`)
                                      }
                                    } else {
                                      alert(`启动参与人确认流程失败：${participantResult.message}`)
                                    }
                                  } catch (error) {
                                    console.error('提交评审失败:', error)
                                    alert('提交评审失败，请重试')
                                  }
                                }}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Send className="mr-2 h-4 w-4" />
                                提交评审
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          ) : !isApprovalSubmitted && showCreateNewReport ? (
            <>
              {/* 返回按钮 */}
              <div className="flex items-center mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateNewReport(false)}
                  className="mr-4"
                >
                  ← 返回报告列表
                </Button>
                <h3 className="text-lg font-semibold">创建新批复报告</h3>
              </div>
              
              {/* 步骤1和步骤2: 当进入步骤3时收缩显示 */}
              {approvalTemplateType ? (
                /* 收缩模式 - 步骤3激活时 */
                <div className="flex-shrink-0 space-y-2">
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-teal-500 text-white rounded-full flex items-center justify-center text-xs font-medium">✓</div>
                        <span className="text-sm font-medium">已选择 {selectedApprovalProjects.length} 个项目</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-teal-500 text-white rounded-full flex items-center justify-center text-xs font-medium">✓</div>
                        <span className="text-sm font-medium">
                          {approvalTemplateType === "adjustment2024" ? `${new Date().getFullYear()}年已下达项目调整评审意见汇总表` :
                           approvalTemplateType === "newProject2024" ? `${new Date().getFullYear()}年新增项目评审意见汇总表` :
                           approvalTemplateType === "preArrange2025" ? `${new Date().getFullYear() + 1}年预安排项目评审意见汇总表` :
                           approvalTemplateType === "adjustmentApproval2024" ? `${new Date().getFullYear()}年已下达项目调整批复表` :
                           approvalTemplateType === "newProjectApproval2024" ? `${new Date().getFullYear()}年新增项目批复表` :
                           approvalTemplateType === "preArrangeApproval2025" ? `${new Date().getFullYear() + 1}年预安排项目批复表` : "已选择模板"}
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setApprovalTemplateType(null)
                        setSelectedApprovalProjects([])
                      }}
                    >
                      重新选择
                    </Button>
                  </div>
                </div>
              ) : (
                /* 展开模式 - 步骤1和步骤2 */
                <>
                  {/* 步骤1: 选择已通过的项目 */}
                  <div className="space-y-3 flex-shrink-0">
                    <h4 className="font-medium">步骤1: 选择已评审通过的项目</h4>
                    <div className="border rounded-lg p-3 max-h-[150px] overflow-y-auto">
                      {currentApprovalReviews.filter(r => r.status === "已评审").map((review) => (
                        <div key={review.id} className="flex items-center space-x-3 py-2">
                          <Checkbox
                            id={`project-${review.id}`}
                            checked={selectedApprovalProjects.includes(review.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedApprovalProjects([...selectedApprovalProjects, review.id])
                              } else {
                                setSelectedApprovalProjects(selectedApprovalProjects.filter(id => id !== review.id))
                              }
                            }}
                          />
                          <Label htmlFor={`project-${review.id}`} className="flex-1 cursor-pointer">
                            <span className="font-medium">{review.projectName}</span>
                            <span className="text-sm text-gray-500 ml-2">({review.projectId})</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                    <div className="text-sm text-gray-600">
                      已选择 {selectedApprovalProjects.length} 个项目
                    </div>
                  </div>

                  {/* 步骤2: 选择模板类型 */}
                  {selectedApprovalProjects.length > 0 && (
                    <div className="space-y-3 flex-shrink-0">
                      <h4 className="font-medium">步骤2: 选择批复报告模板</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {/* 评审意见汇总表 */}
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-gray-700">评审意见汇总表</h5>
                          <div 
                            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                              approvalTemplateType === "adjustment2024" 
                                ? "border-blue-500 bg-blue-50" 
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setApprovalTemplateType("adjustment2024")}
                          >
                            <div className="flex items-center space-x-2">
                              <input 
                                type="radio" 
                                checked={approvalTemplateType === "adjustment2024"}
                                onChange={() => setApprovalTemplateType("adjustment2024")}
                              />
                              <Label className="text-sm font-medium">{new Date().getFullYear()}年已下达项目调整</Label>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">附表 2-1</p>
                          </div>
                          <div 
                            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                              approvalTemplateType === "newProject2024" 
                                ? "border-blue-500 bg-blue-50" 
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setApprovalTemplateType("newProject2024")}
                          >
                            <div className="flex items-center space-x-2">
                              <input 
                                type="radio" 
                                checked={approvalTemplateType === "newProject2024"}
                                onChange={() => setApprovalTemplateType("newProject2024")}
                              />
                              <Label className="text-sm font-medium">{new Date().getFullYear()}年新增项目</Label>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">附表 2-2</p>
                          </div>
                          <div 
                            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                              approvalTemplateType === "preArrange2025" 
                                ? "border-blue-500 bg-blue-50" 
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setApprovalTemplateType("preArrange2025")}
                          >
                            <div className="flex items-center space-x-2">
                              <input 
                                type="radio" 
                                checked={approvalTemplateType === "preArrange2025"}
                                onChange={() => setApprovalTemplateType("preArrange2025")}
                              />
                              <Label className="text-sm font-medium">{new Date().getFullYear() + 1}年预安排项目</Label>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">附表 2-3</p>
                          </div>
                        </div>

                        {/* 批复表 */}
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-gray-700">批复表</h5>
                          <div 
                            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                              approvalTemplateType === "adjustmentApproval2024" 
                                ? "border-blue-500 bg-blue-50" 
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setApprovalTemplateType("adjustmentApproval2024")}
                          >
                            <div className="flex items-center space-x-2">
                              <input 
                                type="radio" 
                                checked={approvalTemplateType === "adjustmentApproval2024"}
                                onChange={() => setApprovalTemplateType("adjustmentApproval2024")}
                              />
                              <Label className="text-sm font-medium">{new Date().getFullYear()}年已下达项目调整</Label>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">附表 3-1</p>
                          </div>
                          <div 
                            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                              approvalTemplateType === "newProjectApproval2024" 
                                ? "border-blue-500 bg-blue-50" 
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setApprovalTemplateType("newProjectApproval2024")}
                          >
                            <div className="flex items-center space-x-2">
                              <input 
                                type="radio" 
                                checked={approvalTemplateType === "newProjectApproval2024"}
                                onChange={() => setApprovalTemplateType("newProjectApproval2024")}
                              />
                              <Label className="text-sm font-medium">{new Date().getFullYear()}年新增项目</Label>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">附表 3-2</p>
                          </div>
                          <div 
                            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                              approvalTemplateType === "preArrangeApproval2025" 
                                ? "border-blue-500 bg-blue-50" 
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setApprovalTemplateType("preArrangeApproval2025")}
                          >
                            <div className="flex items-center space-x-2">
                              <input 
                                type="radio" 
                                checked={approvalTemplateType === "preArrangeApproval2025"}
                                onChange={() => setApprovalTemplateType("preArrangeApproval2025")}
                              />
                              <Label className="text-sm font-medium">{new Date().getFullYear() + 1}年预安排项目</Label>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">附表 3-3</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* 步骤3: 填写表格内容 */}
              {approvalTemplateType && (
                <div className="flex-1 flex flex-col space-y-3 min-h-0">
                  <div className="flex-shrink-0">
                    <h4 className="font-medium">步骤3: 填写表格内容</h4>
                    <div className="text-sm text-gray-600 mb-3">
                      请为每个选中的项目填写相应的表格信息
                    </div>
                  </div>
                  
                  {/* 表格编辑区域 */}
                  <div className="flex-1 border rounded-lg overflow-hidden flex flex-col">
                    <div className="bg-gray-50 p-3 border-b flex-shrink-0">
                      <h5 className="font-medium">
                        {approvalTemplateType === "adjustment2024" ? `电试院${new Date().getFullYear()}年已下达项目调整评审意见汇总表` :
                         approvalTemplateType === "newProject2024" ? `电试院${new Date().getFullYear()}年新增项目评审意见汇总表` :
                         approvalTemplateType === "preArrange2025" ? `电试院${new Date().getFullYear() + 1}年预安排项目评审意见汇总表` :
                         approvalTemplateType === "adjustmentApproval2024" ? `电试院${new Date().getFullYear()}年已下达项目调整批复表` :
                         approvalTemplateType === "newProjectApproval2024" ? `电试院${new Date().getFullYear()}年新增项目批复表` :
                         approvalTemplateType === "preArrangeApproval2025" ? `电试院${new Date().getFullYear() + 1}年预安排项目批复表` : "批复报告表格"}
                      </h5>
                      <p className="text-sm text-gray-600">归口管理部门: {currentUser.department || currentUser.center}</p>
                    </div>
                    
                    <div className="flex-1 overflow-auto p-3">
                      <div className="space-y-6">
                        {selectedApprovalProjects.map((projectId, index) => {
                          const review = currentApprovalReviews.find(r => r.id === projectId)
                          if (!review) return null
                          
                          return (
                            <div key={projectId} className="relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 border border-blue-200/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                              {/* 装饰性背景 */}
                              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/20 to-indigo-100/10 rounded-full -mr-16 -mt-16"></div>
                              
                              {/* 项目基本信息 */}
                              <div className="relative mb-6">
                                <div className="flex items-center mb-6">
                                  <div className="relative">
                                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold mr-4 shadow-md">
                                      项目 {index + 1}
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal-400 rounded-full border-2 border-white"></div>
                                  </div>
                                  <h3 className="text-xl font-bold text-gray-800 flex-1">{review.projectName}</h3>
                                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold border border-green-200">
                                    ✓ 通过
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  <div className="space-y-2">
                                    <label className="flex items-center text-sm font-semibold text-gray-700">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                      项目类型
                                    </label>
                                    <Input 
                                      placeholder="请输入项目类型" 
                                      className="w-full border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                                      value={getTableDataValue(projectId, "projectType")}
                                      onChange={(e) => updateTableData(projectId, "projectType", e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="flex items-center text-sm font-semibold text-gray-700">
                                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                                      责任部门
                                    </label>
                                    <Input 
                                      placeholder="请输入责任部门" 
                                      className="w-full border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                                      value={getTableDataValue(projectId, "responsibleDept")}
                                      onChange={(e) => updateTableData(projectId, "responsibleDept", e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="flex items-center text-sm font-semibold text-gray-700">
                                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                                      项目负责人
                                    </label>
                                    <Input 
                                      placeholder="请输入负责人" 
                                      className="w-full border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all duration-200"
                                      value={getTableDataValue(projectId, "projectManager")}
                                      onChange={(e) => updateTableData(projectId, "projectManager", e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="flex items-center text-sm font-semibold text-gray-700">
                                      <div className="w-2 h-2 bg-teal-500 rounded-full mr-2"></div>
                                      评审结论
                                    </label>
                                    <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-lg border border-green-200 text-sm font-semibold text-center shadow-sm">
                                      ✅ 通过
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* 财务信息 */}
                              {approvalTemplateType === "adjustment2024" || approvalTemplateType === "adjustmentApproval2024" ? (
                                <div className="relative mb-6 bg-gradient-to-r from-amber-50/50 to-orange-50/30 rounded-xl p-5 border border-amber-200/50">
                                  <div className="absolute top-3 left-3 w-1 h-8 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full"></div>
                                  <h4 className="text-lg font-bold text-gray-800 mb-4 pl-6 flex items-center">
                                    <span className="text-amber-600 mr-2">💰</span>
                                    财务调整信息
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                      <label className="flex items-center text-sm font-semibold text-gray-700">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                        计划总收入 (万元)
                                      </label>
                                      <Input className="w-full border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all duration-200" placeholder="请输入金额"
                                        value={getTableDataValue(projectId, "plannedTotalIncome")}
                                        onChange={(e) => updateTableData(projectId, "plannedTotalIncome", e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="flex items-center text-sm font-semibold text-gray-700">
                                        <div className="w-2 h-2 bg-teal-500 rounded-full mr-2"></div>
                                        调整后总收入 (万元)
                                      </label>
                                      <Input className="w-full border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all duration-200" placeholder="请输入金额"
                                        value={getTableDataValue(projectId, "adjustedTotalIncome")}
                                        onChange={(e) => updateTableData(projectId, "adjustedTotalIncome", e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="flex items-center text-sm font-semibold text-gray-700">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                                        当年计划收入 (万元)
                                      </label>
                                      <Input className="w-full border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all duration-200" placeholder="请输入金额"
                                        value={getTableDataValue(projectId, "currentYearPlannedIncome")}
                                        onChange={(e) => updateTableData(projectId, "currentYearPlannedIncome", e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="flex items-center text-sm font-semibold text-gray-700">
                                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                                        调整后当年收入 (万元)
                                      </label>
                                      <Input className="w-full border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all duration-200" placeholder="请输入金额"
                                        value={getTableDataValue(projectId, "adjustedCurrentYearIncome")}
                                        onChange={(e) => updateTableData(projectId, "adjustedCurrentYearIncome", e.target.value)} />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="relative mb-6 bg-gradient-to-r from-emerald-50/50 to-teal-50/30 rounded-xl p-5 border border-emerald-200/50">
                                  <div className="absolute top-3 left-3 w-1 h-8 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full"></div>
                                  <h4 className="text-lg font-bold text-gray-800 mb-4 pl-6 flex items-center">
                                    <span className="text-emerald-600 mr-2">📊</span>
                                    财务计划
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                      <label className="flex items-center text-sm font-semibold text-gray-700">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                                        收入计划 (万元)
                                      </label>
                                      <Input className="w-full border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all duration-200" placeholder="请输入金额"
                                        value={getTableDataValue(projectId, "incomePlan")}
                                        onChange={(e) => updateTableData(projectId, "incomePlan", e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="flex items-center text-sm font-semibold text-gray-700">
                                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                                        支出计划 (万元)
                                      </label>
                                      <Input className="w-full border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all duration-200" placeholder="请输入金额"
                                        value={getTableDataValue(projectId, "expensePlan")}
                                        onChange={(e) => updateTableData(projectId, "expensePlan", e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="flex items-center text-sm font-semibold text-gray-700">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                        实施年份
                                      </label>
                                      <Input className="w-full border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all duration-200" placeholder="请输入年份"
                                        value={getTableDataValue(projectId, "implementationYear")}
                                        onChange={(e) => updateTableData(projectId, "implementationYear", e.target.value)} />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* 详细信息 */}
                              <div className="relative mb-6 bg-gradient-to-r from-slate-50/50 to-gray-50/30 rounded-xl p-5 border border-slate-200/50">
                                <div className="absolute top-3 left-3 w-1 h-8 bg-gradient-to-b from-slate-400 to-gray-500 rounded-full"></div>
                                <h4 className="text-lg font-bold text-gray-800 mb-4 pl-6 flex items-center">
                                  <span className="text-slate-600 mr-2">📝</span>
                                  {approvalTemplateType === "adjustment2024" || approvalTemplateType === "adjustmentApproval2024" ? "调整详情" : "项目详情"}
                                </h4>
                                <div className="pl-6">
                                  <Textarea 
                                    placeholder="请详细填写项目的具体信息、实施方案、调整原因或其他重要说明..."
                                    className="min-h-[120px] border-gray-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all duration-200 resize-none"
                                    value={getTableDataValue(projectId, "projectDetails")}
                                    onChange={(e) => updateTableData(projectId, "projectDetails", e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Download className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    ✅ 批复报告已生成成功！
                  </h3>
                  <p className="text-gray-600">
                    您可以下载Word格式的批复报告文件
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              setIsApprovalReportModalOpen(false)
              setApprovalTemplateType(null)
              setSelectedApprovalProjects([])
              setApprovalTableData({})
              setIsApprovalSubmitted(false)
              setShowCreateNewReport(false)
              setExistingApprovalReports([])
              setCurrentSubmittedReportId(null)
            }}
          >
            {isApprovalSubmitted ? "关闭" : "取消"}
          </Button>
                    {!isApprovalSubmitted && showCreateNewReport && approvalTemplateType && selectedApprovalProjects.length > 0 && (
            <Button
              onClick={async () => {
                if (!approvalTemplateType) {
                  alert("请先选择批复报告模板")
                  return
                }

                try {
                  // 保存批复报告到数据库
                  const templateName = 
                    approvalTemplateType === "adjustment2024" ? "项目调整评审意见汇总表" :
                    approvalTemplateType === "newProject2024" ? "新增项目评审意见汇总表" :
                    approvalTemplateType === "preArrange2025" ? "预安排项目评审意见汇总表" :
                    approvalTemplateType === "adjustmentApproval2024" ? "已下达项目调整批复表" :
                    approvalTemplateType === "newProjectApproval2024" ? "新增项目批复表" :
                    approvalTemplateType === "preArrangeApproval2025" ? "预安排项目批复表" : "批复报告"
                  
                  const fileName = `${templateName}_${formatMeetingGroupDisplay(currentApprovalGroup).replace(/[\s:/\\]/g, '_')}.docx`
                  
                  const formData = new FormData()
                  formData.append("meetingGroup", currentApprovalGroup)
                  formData.append("templateType", approvalTemplateType)
                  formData.append("templateName", templateName)
                  formData.append("selectedProjects", JSON.stringify(selectedApprovalProjects))
                  formData.append("tableData", JSON.stringify(approvalTableData))
                  formData.append("submittedBy", currentUser.name)
                  formData.append("fileName", fileName)
                  
                  const savedReport = await saveApprovalReportAction(formData)
                  
                  if (savedReport) {
                    setIsApprovalSubmitted(true)
                    setCurrentSubmittedReportId(savedReport.id)
                                          // 重新加载历史报告列表
                      const reports = await getApprovalReportsByGroupAction(currentApprovalGroup)
                      setExistingApprovalReports(reports)
                      alert(`批复报告已成功保存！请点击"提交评审"按钮启动审批流程。`)
                      console.log(`批复报告已保存。报告ID: ${savedReport.id}, 涉及 ${selectedApprovalProjects.length} 个项目。`)
                  } else {
                    throw new Error("保存失败")
                  }
                } catch (error) {
                  console.error('提交批复报告失败:', error)
                  alert('提交批复报告失败，请重试')
                }
              }}
              disabled={selectedApprovalProjects.length === 0}
            >
              提交批复报告
            </Button>
          )}
          {isApprovalSubmitted && (
            <>
              <Button
                onClick={async () => {
                  try {
                    // 动态导入docx生成函数
                    const { generateApprovalReportDocx, downloadFile } = await import("@/lib/docx-utils")
                    
                    // 构建正确的表格数据格式
                    const formattedTableData = selectedApprovalProjects.map(projectId => ({
                      projectId: projectId,
                      ...approvalTableData[projectId] || {}
                    }))
                    
                    const docxBlob = generateApprovalReportDocx(
                      approvalTemplateType!,
                      formattedTableData,
                      selectedApprovalProjects.map(id => {
                        const review = currentApprovalReviews.find(r => r.id === id)!
                        return review
                      }),
                      currentUser
                    )
                    
                    const templateName = 
                      approvalTemplateType === "preArrangeApproval2025" ? "预安排项目批复表" : "批复报告"
                    const filename = `${templateName}_${formatMeetingGroupDisplay(currentApprovalGroup).replace(/[\s:/\\]/g, '_')}.docx`
                    
                    downloadFile(docxBlob, filename)
                  } catch (error) {
                    console.error('下载批复报告失败:', error)
                    alert('下载失败，请重试')
                  }
                }}
                variant="outline"
                className="text-blue-600 hover:text-blue-700"
              >
                <Download className="mr-2 h-4 w-4" />
                下载批复报告
              </Button>
              {currentSubmittedReportId && (
                <Button
                  onClick={async () => {
                    try {
                      // 首先启动月度审核参与人确认流程
                      const participantResult = await startMonthlyReviewParticipantConfirmationAction(currentApprovalGroup, selectedApprovalProjects)
                      if (participantResult.success) {
                        console.log('月度审核参与人确认流程已启动:', participantResult.message)
                        
                        // 然后启动批复报告审批流程
                        const result = await startApprovalReportWorkflowAction(currentSubmittedReportId)
                        if (result.success) {
                          alert(`${participantResult.message}\n\n${result.message}`)
                          // 重新加载历史报告列表以更新状态
                          const reports = await getApprovalReportsByGroupAction(currentApprovalGroup)
                          setExistingApprovalReports(reports)
                          // 清除当前提交的报告ID，因为已经提交评审了
                          setCurrentSubmittedReportId(null)
                        } else {
                          alert(`参与人确认流程已启动，但批复报告审批流程启动失败：${result.message}`)
                        }
                      } else {
                        alert(`启动参与人确认流程失败：${participantResult.message}`)
                      }
                    } catch (error) {
                      console.error('提交评审失败:', error)
                      alert('提交评审失败，请重试')
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Send className="mr-2 h-4 w-4" />
                  提交评审
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
} 