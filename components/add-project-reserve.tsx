'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CalendarIcon, Upload, ArrowLeft } from 'lucide-react'
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { addProjectAction, submitProjectForApprovalAction } from '@/app/actions'
import { getAvailableApprovers } from '@/lib/data'

// 增强的日期选择器组件，支持年份快速选择
function EnhancedDatePicker({ 
  date, 
  onDateChange, 
  placeholder 
}: { 
  date: Date | undefined
  onDateChange: (date: Date | undefined) => void
  placeholder: string 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(date || new Date())

  const currentYear = currentMonth.getFullYear()
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "yyyy年MM月dd日", { locale: zhCN }) : placeholder}
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
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
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

interface FinancialRow {
  id: string
  startTime: string
  endTime: string
  plannedIncome: number
  incomeTaxRate: number
  plannedExpense: number
  expenseTaxRate: number
  grossMargin: number
}

interface AddProjectReserveProps {
  onBack: () => void
  currentUser: {
    name: string
    department: string
    center?: string
    role?: string
  }
}

export default function AddProjectReserve({ onBack, currentUser }: AddProjectReserveProps) {
  // 获取当前用户对应的负责人列表
  const availableLeaders = getAvailableLeaders(currentUser)
  // 基本信息状态
  const [projectName, setProjectName] = useState('')
  const [projectType, setProjectType] = useState('')
  const [managementDepartment, setManagementDepartment] = useState('')
  const [fundAttribute, setFundAttribute] = useState('')
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [necessity, setNecessity] = useState('')
  const [feasibility, setFeasibility] = useState('')
  const [projectBasis, setProjectBasis] = useState('')
  const [implementationPlan, setImplementationPlan] = useState('')
  const [departmentHead, setDepartmentHead] = useState('')
  const [remarks, setRemarks] = useState('')

  // 财务数据状态
  const [financialRows, setFinancialRows] = useState<FinancialRow[]>([])

  // 附件状态
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  // 审批相关状态
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
  const [selectedApprover, setSelectedApprover] = useState<string>("")
  const [savedProjectId, setSavedProjectId] = useState<string>("")

  // 字符统计
  const implementationPlanCount = implementationPlan.length
  const remarksCount = remarks.length

  // 按年拆分时间段
  const generateFinancialRowsByYear = (start: Date, end: Date) => {
    const rows: FinancialRow[] = []
    let currentYear = start.getFullYear()
    const endYear = end.getFullYear()
    
    while (currentYear <= endYear) {
      const yearStart = currentYear === start.getFullYear() 
        ? start 
        : new Date(currentYear, 0, 1) // 1月1日
      
      const yearEnd = currentYear === endYear 
        ? end 
        : new Date(currentYear, 11, 31) // 12月31日
      
      rows.push({
        id: `${currentYear}-${Date.now()}-${Math.random()}`,
        startTime: format(yearStart, 'yyyy-MM-dd'),
        endTime: format(yearEnd, 'yyyy-MM-dd'),
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

  // 当开始和结束日期都选择后，自动生成财务行
  React.useEffect(() => {
    if (startDate && endDate && startDate <= endDate) {
      const newRows = generateFinancialRowsByYear(startDate, endDate)
      setFinancialRows(newRows)
    }
  }, [startDate, endDate])

  // 更新财务行数据
  const updateFinancialRow = (id: string, field: keyof FinancialRow, value: number) => {
    setFinancialRows(rows => 
      rows.map(row => {
        if (row.id === id) {
          const updatedRow = { ...row, [field]: value }
          // 自动计算毛利率
          if (field === 'plannedIncome' || field === 'plannedExpense') {
            const grossMargin = updatedRow.plannedIncome > 0 
              ? ((updatedRow.plannedIncome - updatedRow.plannedExpense) / updatedRow.plannedIncome * 100)
              : 0
            updatedRow.grossMargin = grossMargin
          }
          return updatedRow
        }
        return row
      })
    )
  }

  // 计算财务摘要
  const calculateFinancialSummary = () => {
    const totalIncomeWithTax = financialRows.reduce((sum, row) => sum + row.plannedIncome, 0)
    const totalExpenseWithTax = financialRows.reduce((sum, row) => sum + row.plannedExpense, 0)
    
    const totalIncomeWithoutTax = financialRows.reduce((sum, row) => {
      return sum + (row.plannedIncome / (1 + row.incomeTaxRate / 100))
    }, 0)
    
    const totalExpenseWithoutTax = financialRows.reduce((sum, row) => {
      return sum + (row.plannedExpense / (1 + row.expenseTaxRate / 100))
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
  }

  const financialSummary = calculateFinancialSummary()

  // 文件上传处理
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const allowedExtensions = ['.rar', '.zip', '.doc', '.docx', '.pdf']
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      
      if (!allowedExtensions.includes(fileExtension)) {
        alert('请上传支持的文件格式：rar、zip、doc、docx、pdf')
        return
      }
      
      if (file.size > 20 * 1024 * 1024) {
        alert('文件大小不能超过20MB')
        return
      }
      
      setUploadedFile(file)
    }
  }

  // 表单验证
  const validateForm = () => {
    if (!projectName.trim()) {
      alert('请输入项目名称')
      return false
    }
    if (!projectType) {
      alert('请选择项目类型')
      return false
    }
    if (!fundAttribute) {
      alert('请选择资金属性')
      return false
    }
    if (!necessity.trim()) {
      alert('请输入必要性')
      return false
    }
    return true
  }

  // 保存（暂存）
  const handleSave = () => {
    if (!validateForm()) return
    
    const projectData = {
      projectName,
      projectType,
      managementDepartment,
      fundAttribute,
      startDate,
      endDate,
      necessity,
      feasibility,
      projectBasis,
      implementationPlan,
      departmentHead,
      remarks,
      financialRows,
      uploadedFile,
      status: '草稿',
      responsibleDepartment: currentUser.department,
      responsiblePerson: currentUser.name
    }
    
    console.log('保存项目数据:', projectData)
    alert('项目已保存为草稿')
    onBack()
  }

  // 提交
  const handleSubmit = async () => {
    if (!validateForm()) return
    
    try {
      // 1. 先保存项目为编制状态
      const formData = new FormData()
      formData.append('name', projectName)
      formData.append('owner', currentUser.name)
      formData.append('center', currentUser.center || '')
      formData.append('department', currentUser.department || '')
      formData.append('status', '编制')
      formData.append('description', implementationPlan || `${projectType} - ${necessity}`)
      
      // 添加新增的详细字段
      if (projectType) formData.append('projectType', projectType)
      if (managementDepartment) formData.append('managementDepartment', managementDepartment)
      if (fundAttribute) formData.append('fundAttribute', fundAttribute)
      if (startDate) formData.append('startDate', startDate.toISOString())
      if (endDate) formData.append('endDate', endDate.toISOString())
      if (necessity) formData.append('necessity', necessity)
      if (feasibility) formData.append('feasibility', feasibility)
      if (projectBasis) formData.append('projectBasis', projectBasis)
      if (implementationPlan) formData.append('implementationPlan', implementationPlan)
      if (departmentHead) formData.append('departmentHead', departmentHead)
      if (remarks) formData.append('remarks', remarks)
      if (uploadedFile) formData.append('attachmentFileName', uploadedFile.name)
      
      // 添加财务数据
      if (financialRows && financialRows.length > 0) {
        formData.append('financialRows', JSON.stringify(financialRows))
      }
      
      const savedProject = await addProjectAction(formData)
      
      if (!savedProject) {
        alert('保存项目失败')
        return
      }
      
      setSavedProjectId(savedProject.id)
      
      // 2. 获取可选审批人列表
      const availableApprovers = getAvailableApprovers(currentUser.department || '', currentUser.center || '')
      if (availableApprovers.length > 0) {
        setSelectedApprover(availableApprovers[0].name)
        setIsApprovalModalOpen(true)
      } else {
        alert('没有可用的审批人')
      }
    } catch (error) {
      console.error('提交项目失败:', error)
      alert('提交项目失败')
    }
  }

  const handleApprovalSubmit = async () => {
    if (!savedProjectId || !selectedApprover) {
      alert("请选择审批人")
      return
    }

    const result = await submitProjectForApprovalAction(
      savedProjectId,
      currentUser.name,
      selectedApprover
    )

    if (result.success) {
      alert(result.message)
      setIsApprovalModalOpen(false)
      onBack()
    } else {
      alert(result.message)
    }
  }

  return (
          <div className="w-[95%] mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="ghost" onClick={onBack} className="p-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">新增项目储备</h1>
      </div>

      {/* 基本信息区 */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* 责任部门（只读） */}
            <div className="space-y-2">
              <Label>责任部门</Label>
              <Input 
                value={currentUser.department || currentUser.center || "未设置部门"} 
                disabled 
                className="bg-gray-50"
              />
            </div>

            {/* 项目负责人（只读） */}
            <div className="space-y-2">
              <Label>项目负责人</Label>
              <Input 
                value={currentUser.name} 
                disabled 
                className="bg-gray-50"
              />
            </div>

            {/* 项目名称（必填） */}
            <div className="space-y-2">
              <Label>项目名称 <span className="text-red-500">*</span></Label>
              <Input 
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="请输入项目名称"
                required
              />
            </div>

            {/* 项目类型（必填） */}
            <div className="space-y-2">
              <Label>项目类型 <span className="text-red-500">*</span></Label>
              <Select value={projectType} onValueChange={setProjectType}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择项目类型" />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 归口管理部门 */}
            <div className="space-y-2">
              <Label>归口管理部门</Label>
              <Select value={managementDepartment} onValueChange={setManagementDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择归口管理部门" />
                </SelectTrigger>
                <SelectContent>
                  {MANAGEMENT_DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 资金属性（必填） */}
            <div className="space-y-2">
              <Label>资金属性 <span className="text-red-500">*</span></Label>
              <Select value={fundAttribute} onValueChange={setFundAttribute}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择资金属性" />
                </SelectTrigger>
                <SelectContent>
                  {FUND_ATTRIBUTES.map((attr) => (
                    <SelectItem key={attr} value={attr}>{attr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 实施年份（起止时间） */}
            <div className="space-y-2">
              <Label>实施开始时间</Label>
              <EnhancedDatePicker
                date={startDate}
                onDateChange={setStartDate}
                placeholder="请选择开始时间"
              />
            </div>

            <div className="space-y-2">
              <Label>实施结束时间</Label>
              <EnhancedDatePicker
                date={endDate}
                onDateChange={setEndDate}
                placeholder="请选择结束时间"
              />
            </div>
          </div>

          {/* 必要性、可行性、立项依据 - 一行展示 */}
          <div className="grid grid-cols-3 gap-6">
            {/* 必要性（必填） */}
            <div className="space-y-2">
              <Label>必要性 <span className="text-red-500">*</span></Label>
              <Input 
                value={necessity}
                onChange={(e) => setNecessity(e.target.value)}
                placeholder="请输入项目必要性"
                required
              />
            </div>

            {/* 可行性 */}
            <div className="space-y-2">
              <Label>可行性</Label>
              <Input 
                value={feasibility}
                onChange={(e) => setFeasibility(e.target.value)}
                placeholder="请输入项目可行性"
              />
            </div>

            {/* 立项依据 */}
            <div className="space-y-2">
              <Label>立项依据</Label>
              <Input 
                value={projectBasis}
                onChange={(e) => setProjectBasis(e.target.value)}
                placeholder="请输入立项依据"
              />
            </div>
          </div>

          {/* 项目实施方案 */}
          <div className="space-y-2">
            <Label>项目实施方案</Label>
            <Textarea 
              value={implementationPlan}
              onChange={(e) => setImplementationPlan(e.target.value)}
              placeholder="请输入项目实施方案"
              className="min-h-[120px]"
            />
            <div className="text-sm text-gray-500 text-right">
              {implementationPlanCount}/200
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
                {financialRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  financialRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.startTime}</TableCell>
                      <TableCell>{row.endTime}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={row.plannedIncome || ''}
                          onChange={(e) => updateFinancialRow(row.id, 'plannedIncome', Number(e.target.value) || 0)}
                          className="w-36"
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={row.incomeTaxRate || ''}
                          onChange={(e) => updateFinancialRow(row.id, 'incomeTaxRate', Number(e.target.value) || 0)}
                          className="w-24"
                          placeholder="13"
                          max="100"
                          min="0"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={row.plannedExpense || ''}
                          onChange={(e) => updateFinancialRow(row.id, 'plannedExpense', Number(e.target.value) || 0)}
                          className="w-36"
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={row.expenseTaxRate || ''}
                          onChange={(e) => updateFinancialRow(row.id, 'expenseTaxRate', Number(e.target.value) || 0)}
                          className="w-24"
                          placeholder="13"
                          max="100"
                          min="0"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {row.grossMargin.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 项目财务摘要 */}
      <Card>
        <CardHeader>
          <CardTitle>项目财务摘要</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <div className="space-y-2">
              <Label>项目总收入（含税）</Label>
              <Input 
                value={financialSummary.totalIncomeWithTax.toLocaleString()} 
                disabled 
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label>项目总收入（不含税）</Label>
              <Input 
                value={financialSummary.totalIncomeWithoutTax.toLocaleString()} 
                disabled 
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label>项目总支出（含税）</Label>
              <Input 
                value={financialSummary.totalExpenseWithTax.toLocaleString()} 
                disabled 
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label>项目总支出（不含税）</Label>
              <Input 
                value={financialSummary.totalExpenseWithoutTax.toLocaleString()} 
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
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="请输入备注信息"
              className="min-h-[100px]"
            />
            <div className="text-sm text-gray-500 text-right">
              {remarksCount}/200
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
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept=".rar,.zip,.doc,.docx,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>选择文件</span>
                </Button>
                {uploadedFile && (
                  <span className="text-sm text-gray-600">
                    已选择: {uploadedFile.name}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">
                支持格式：rar、zip、doc、docx、pdf，单个文件不超过20MB
              </div>
            </div>

            {/* 部门/中心负责人 */}
            <div className="space-y-2">
              <Label>部门/中心负责人</Label>
              <Select value={departmentHead} onValueChange={setDepartmentHead}>
                <SelectTrigger className="w-[12rem]">
                  <SelectValue placeholder="请选择负责人" />
                </SelectTrigger>
                <SelectContent>
                  {availableLeaders.map((leader) => (
                    <SelectItem key={leader.id} value={leader.name}>{leader.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 底部操作按钮 */}
      <div className="flex justify-end space-x-4 pt-6">
        <Button variant="outline" onClick={onBack}>
          取消
        </Button>
        <Button variant="outline" onClick={handleSave}>
                      暂存
        </Button>
        <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
          提交
        </Button>
      </div>

      {/* 审批人选择对话框 */}
      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>选择审批人</DialogTitle>
            <DialogDescription>
              请选择审批人来处理您的项目申请。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="approver" className="text-right">
                审批人
              </Label>
              <Select
                value={selectedApprover}
                onValueChange={setSelectedApprover}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择审批人" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableApprovers(currentUser.department || '', currentUser.center || '').map((approver) => (
                    <SelectItem key={approver.id} value={approver.name}>
                      {approver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleApprovalSubmit}>
              提交审批
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 