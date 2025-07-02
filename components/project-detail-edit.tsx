'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import type { Project, ProjectStatus, FinancialRow } from '@/lib/data'
import { useIsMobile } from "@/components/ui/use-mobile"
import { cn } from "@/lib/utils"

interface ProjectDetailEditProps {
  onBack: () => void
  project: Project
  isEditing: boolean
  onSave: (project: Project) => Promise<void>
}

export default function ProjectDetailEdit({ onBack, project, isEditing, onSave }: ProjectDetailEditProps) {
  const isMobile = useIsMobile()
  const [editedProject, setEditedProject] = useState<Project>({ ...project })
  const [isSaving, setIsSaving] = useState(false)

  // 项目类型选项
  const PROJECT_TYPES = [
    "调试试验",
    "经营计划/监督检测", 
    "经营计划/零星检测",
    "技术咨询及培训",
    "基础设施改造",
    "其他"
  ]

  // 资金属性选项
  const FUND_ATTRIBUTES = [
    "自有资金",
    "政府拨款",
    "银行贷款",
    "其他"
  ]

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(editedProject)
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: keyof Project, value: any) => {
    setEditedProject(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addFinancialRow = () => {
    const newRow: FinancialRow = {
      id: Date.now().toString(),
      startTime: '',
      endTime: '',
      plannedIncome: 0,
      incomeTaxRate: 13,
      plannedExpense: 0,
      expenseTaxRate: 13,
      grossMargin: 0
    }
    setEditedProject(prev => ({
      ...prev,
      financialRows: [...(prev.financialRows || []), newRow]
    }))
  }

  const removeFinancialRow = (id: string) => {
    setEditedProject(prev => ({
      ...prev,
      financialRows: (prev.financialRows || []).filter(row => row.id !== id)
    }))
  }

  const updateFinancialRow = (id: string, field: keyof FinancialRow, value: any) => {
    setEditedProject(prev => ({
      ...prev,
      financialRows: (prev.financialRows || []).map(row => 
        row.id === id ? { ...row, [field]: value } : row
      )
    }))
  }

  // 计算财务摘要
  const calculateFinancialSummary = () => {
    if (!editedProject.financialRows || editedProject.financialRows.length === 0) {
      return {
        totalIncomeWithTax: 0,
        totalIncomeWithoutTax: 0,
        totalExpenseWithTax: 0,
        totalExpenseWithoutTax: 0,
        overallGrossMargin: 0
      }
    }

    const totalIncomeWithTax = editedProject.financialRows.reduce((sum, row) => sum + row.plannedIncome, 0)
    const totalExpenseWithTax = editedProject.financialRows.reduce((sum, row) => sum + row.plannedExpense, 0)
    
    const totalIncomeWithoutTax = editedProject.financialRows.reduce((sum, row) => {
      return sum + (row.plannedIncome / (1 + row.incomeTaxRate / 100))
    }, 0)
    
    const totalExpenseWithoutTax = editedProject.financialRows.reduce((sum, row) => {
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

  return (
    <div className={cn(
      "mx-auto space-y-6",
      isMobile ? "w-full p-4" : "w-[95%] p-6"
    )}>
      {/* 页面标题 */}
      <div className={cn(
        "flex items-center justify-between mb-6",
        isMobile && "flex-col space-y-4 items-start"
      )}>
        <div className={cn(
          "flex items-center",
          isMobile ? "space-x-2" : "space-x-4"
        )}>
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className={cn(
            "font-bold text-gray-900 truncate",
            isMobile ? "text-lg" : "text-2xl"
          )}>
            {isEditing ? '编辑项目' : '查看项目'} - {editedProject.name}
          </h1>
        </div>
        {isEditing && (
          <Button 
            onClick={handleSave} 
            disabled={isSaving} 
            className={cn(
              "flex items-center space-x-2",
              isMobile && "w-full justify-center"
            )}
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? '提交中...' : '提交'}</span>
          </Button>
        )}
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
            {/* 项目名称 */}
            <div className="space-y-2">
              <Label>项目名称 *</Label>
              <Input 
                value={editedProject.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
                required
              />
            </div>

            {/* 责任部门 */}
            <div className="space-y-2">
              <Label>所属中心</Label>
              <Input 
                value={editedProject.center}
                onChange={(e) => handleInputChange('center', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label>所属部门</Label>
              <Input 
                value={editedProject.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
              />
            </div>

            {/* 项目负责人 */}
            <div className="space-y-2">
              <Label>项目负责人</Label>
              <Input 
                value={editedProject.owner}
                onChange={(e) => handleInputChange('owner', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
              />
            </div>

            {/* 项目类型 */}
            <div className="space-y-2">
              <Label>项目类型</Label>
              {isEditing ? (
                <Select
                  value={editedProject.projectType || ""}
                  onValueChange={(value) => handleInputChange('projectType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择项目类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input 
                  value={editedProject.projectType || "未设置"}
                  disabled 
                  className="bg-gray-50"
                />
              )}
            </div>

            {/* 归口管理部门 */}
            <div className="space-y-2">
              <Label>归口管理部门</Label>
              <Input 
                value={editedProject.managementDepartment || "未设置"}
                onChange={(e) => handleInputChange('managementDepartment', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
              />
            </div>

            {/* 资金属性 */}
            <div className="space-y-2">
              <Label>资金属性</Label>
              {isEditing ? (
                <Select
                  value={editedProject.fundAttribute || ""}
                  onValueChange={(value) => handleInputChange('fundAttribute', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择资金属性" />
                  </SelectTrigger>
                  <SelectContent>
                    {FUND_ATTRIBUTES.map((attr) => (
                      <SelectItem key={attr} value={attr}>
                        {attr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input 
                  value={editedProject.fundAttribute || "未设置"}
                  disabled 
                  className="bg-gray-50"
                />
              )}
            </div>

            {/* 项目状态 */}
            <div className="space-y-2">
              <Label>项目状态</Label>
              {isEditing ? (
                <Select
                  value={editedProject.status}
                  onValueChange={(value: ProjectStatus) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="编制">编制</SelectItem>
                    <SelectItem value="评审">评审</SelectItem>
                    <SelectItem value="批复">批复</SelectItem>
                    <SelectItem value="下达">下达</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input 
                  value={editedProject.status}
                  disabled 
                  className="bg-gray-50"
                />
              )}
            </div>
          </div>

          {/* 时间信息 - 响应式布局 */}
          <div className={cn(
            "grid gap-6",
            isMobile ? "grid-cols-1" : "grid-cols-2"
          )}>
            <div className="space-y-2">
              <Label>实施开始时间</Label>
              <Input 
                type="date"
                value={editedProject.startDate ? format(new Date(editedProject.startDate), "yyyy-MM-dd") : ""}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>实施结束时间</Label>
              <Input 
                type="date"
                value={editedProject.endDate ? format(new Date(editedProject.endDate), "yyyy-MM-dd") : ""}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
              />
            </div>
          </div>

          {/* 项目描述信息 - 响应式布局 */}
          <div className={cn(
            "grid gap-6",
            isMobile ? "grid-cols-1" : "grid-cols-3"
          )}>
            <div className="space-y-2">
              <Label>必要性</Label>
              <Textarea 
                value={editedProject.necessity || ""}
                onChange={(e) => handleInputChange('necessity', e.target.value)}
                disabled={!isEditing}
                className={cn("min-h-[80px]", !isEditing && "bg-gray-50")}
                placeholder="请输入项目必要性"
              />
            </div>
            <div className="space-y-2">
              <Label>可行性</Label>
              <Textarea 
                value={editedProject.feasibility || ""}
                onChange={(e) => handleInputChange('feasibility', e.target.value)}
                disabled={!isEditing}
                className={cn("min-h-[80px]", !isEditing && "bg-gray-50")}
                placeholder="请输入项目可行性"
              />
            </div>
            <div className="space-y-2">
              <Label>立项依据</Label>
              <Textarea 
                value={editedProject.projectBasis || ""}
                onChange={(e) => handleInputChange('projectBasis', e.target.value)}
                disabled={!isEditing}
                className={cn("min-h-[80px]", !isEditing && "bg-gray-50")}
                placeholder="请输入立项依据"
              />
            </div>
          </div>

          {/* 项目实施方案 */}
          <div className="space-y-2">
            <Label>项目实施方案</Label>
            <Textarea 
              value={editedProject.implementationPlan || ""}
              onChange={(e) => handleInputChange('implementationPlan', e.target.value)}
              disabled={!isEditing}
              className={cn("min-h-[120px]", !isEditing && "bg-gray-50")}
              placeholder="请输入项目实施方案"
            />
          </div>

          {/* 部门负责人和备注 - 响应式布局 */}
          <div className={cn(
            "grid gap-6",
            isMobile ? "grid-cols-1" : "grid-cols-2"
          )}>
            <div className="space-y-2">
              <Label>部门负责人</Label>
              <Input 
                value={editedProject.departmentHead || ""}
                onChange={(e) => handleInputChange('departmentHead', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
                placeholder="请输入部门负责人"
              />
            </div>
            <div className="space-y-2">
              <Label>附件文件名</Label>
              <Input 
                value={editedProject.attachmentFileName || ""}
                onChange={(e) => handleInputChange('attachmentFileName', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
                placeholder="请输入附件文件名"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>备注</Label>
            <Textarea 
              value={editedProject.remarks || ""}
              onChange={(e) => handleInputChange('remarks', e.target.value)}
              disabled={!isEditing}
              className={cn("min-h-[100px]", !isEditing && "bg-gray-50")}
              placeholder="请输入备注信息"
            />
          </div>
        </CardContent>
      </Card>

      {/* 财务信息区 */}
      {editedProject.financialRows && editedProject.financialRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>财务信息</span>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFinancialRow}
                  className="flex items-center space-x-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>添加</span>
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isMobile ? (
              // 移动端卡片式布局
              <div className="space-y-4">
                {editedProject.financialRows.map((row, index) => (
                  <Card key={row.id} className="border border-gray-200">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">财务记录 {index + 1}</span>
                        {isEditing && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFinancialRow(row.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">开始时间</Label>
                          <Input
                            value={row.startTime}
                            onChange={(e) => updateFinancialRow(row.id, 'startTime', e.target.value)}
                            disabled={!isEditing}
                            className={cn("text-sm", !isEditing && "bg-gray-50")}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">结束时间</Label>
                          <Input
                            value={row.endTime}
                            onChange={(e) => updateFinancialRow(row.id, 'endTime', e.target.value)}
                            disabled={!isEditing}
                            className={cn("text-sm", !isEditing && "bg-gray-50")}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">计划收入（含税元）</Label>
                          <Input
                            type="number"
                            value={row.plannedIncome || ''}
                            onChange={(e) => updateFinancialRow(row.id, 'plannedIncome', Number(e.target.value) || 0)}
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
                            onChange={(e) => updateFinancialRow(row.id, 'incomeTaxRate', Number(e.target.value) || 0)}
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
                            onChange={(e) => updateFinancialRow(row.id, 'plannedExpense', Number(e.target.value) || 0)}
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
                            onChange={(e) => updateFinancialRow(row.id, 'expenseTaxRate', Number(e.target.value) || 0)}
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
                ))}
              </div>
            ) : (
              // 桌面端表格布局
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">开始时间</TableHead>
                      <TableHead className="w-[100px]">结束时间</TableHead>
                      <TableHead className="w-[120px]">计划收入（含税元）</TableHead>
                      <TableHead className="w-[100px]">收入税率（%）</TableHead>
                      <TableHead className="w-[120px]">计划支出（含税元）</TableHead>
                      <TableHead className="w-[100px]">支出税率（%）</TableHead>
                      <TableHead className="w-[100px]">毛利率（%）</TableHead>
                      {isEditing && <TableHead className="w-[80px]">操作</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editedProject.financialRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Input
                            value={row.startTime}
                            onChange={(e) => updateFinancialRow(row.id, 'startTime', e.target.value)}
                            disabled={!isEditing}
                            className={cn("text-sm", !isEditing && "bg-gray-50")}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.endTime}
                            onChange={(e) => updateFinancialRow(row.id, 'endTime', e.target.value)}
                            disabled={!isEditing}
                            className={cn("text-sm", !isEditing && "bg-gray-50")}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={row.plannedIncome || ''}
                            onChange={(e) => updateFinancialRow(row.id, 'plannedIncome', Number(e.target.value) || 0)}
                            disabled={!isEditing}
                            className={cn("text-sm", !isEditing && "bg-gray-50")}
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={row.incomeTaxRate || ''}
                            onChange={(e) => updateFinancialRow(row.id, 'incomeTaxRate', Number(e.target.value) || 0)}
                            disabled={!isEditing}
                            className={cn("text-sm", !isEditing && "bg-gray-50")}
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
                            disabled={!isEditing}
                            className={cn("text-sm", !isEditing && "bg-gray-50")}
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={row.expenseTaxRate || ''}
                            onChange={(e) => updateFinancialRow(row.id, 'expenseTaxRate', Number(e.target.value) || 0)}
                            disabled={!isEditing}
                            className={cn("text-sm", !isEditing && "bg-gray-50")}
                            placeholder="13"
                            max="100"
                            min="0"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {row.grossMargin?.toFixed(2) || '0.00'}%
                        </TableCell>
                        {isEditing && (
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFinancialRow(row.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {/* 财务摘要 */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium mb-3">财务摘要</h3>
              <div className={cn(
                "grid gap-4",
                isMobile ? "grid-cols-1" : "grid-cols-2 md:grid-cols-5"
              )}>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">总收入（含税）</Label>
                  <div className="text-sm font-medium bg-gray-50 p-2 rounded border">
                    {financialSummary.totalIncomeWithTax.toFixed(2)}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">总收入（不含税）</Label>
                  <div className="text-sm font-medium bg-gray-50 p-2 rounded border">
                    {financialSummary.totalIncomeWithoutTax.toFixed(2)}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">总支出（含税）</Label>
                  <div className="text-sm font-medium bg-gray-50 p-2 rounded border">
                    {financialSummary.totalExpenseWithTax.toFixed(2)}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">总支出（不含税）</Label>
                  <div className="text-sm font-medium bg-gray-50 p-2 rounded border">
                    {financialSummary.totalExpenseWithoutTax.toFixed(2)}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">整体毛利率（%）</Label>
                  <div className="text-sm font-medium bg-gray-50 p-2 rounded border">
                    {financialSummary.overallGrossMargin.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 底部操作按钮 */}
      <div className={cn(
        "flex pt-6",
        isMobile ? "flex-col space-y-3" : "justify-end space-x-4"
      )}>
        <Button 
          variant="outline" 
          onClick={onBack}
          className={isMobile ? "w-full" : ""}
        >
          取消
        </Button>
        {isEditing && (
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className={cn(
              "bg-blue-600 hover:bg-blue-700",
              isMobile && "w-full"
            )}
          >
            {isSaving ? '保存中...' : '保存'}
          </Button>
        )}
      </div>
    </div>
  )
} 