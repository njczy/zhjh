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

interface ProjectDetailEditProps {
  onBack: () => void
  project: Project
  isEditing: boolean
  onSave: (project: Project) => Promise<void>
}

export default function ProjectDetailEdit({ onBack, project, isEditing, onSave }: ProjectDetailEditProps) {
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
    <div className="w-[95%] mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? '编辑项目' : '查看项目'} - {editedProject.name}
          </h1>
        </div>
        {isEditing && (
          <Button onClick={handleSave} disabled={isSaving} className="flex items-center space-x-2">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
              <Label>项目负责人 *</Label>
              <Input 
                value={editedProject.owner}
                onChange={(e) => handleInputChange('owner', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
                required
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
                value={editedProject.managementDepartment || ""}
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

            {/* 实施时间 */}
            <div className="space-y-2">
              <Label>实施开始时间</Label>
              <Input 
                type={isEditing ? "date" : "text"}
                value={isEditing ? editedProject.startDate || "" : 
                       (editedProject.startDate ? format(new Date(editedProject.startDate), "yyyy年MM月dd日", { locale: zhCN }) : "未设置")}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label>实施结束时间</Label>
              <Input 
                type={isEditing ? "date" : "text"}
                value={isEditing ? editedProject.endDate || "" : 
                       (editedProject.endDate ? format(new Date(editedProject.endDate), "yyyy年MM月dd日", { locale: zhCN }) : "未设置")}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
              />
            </div>

            {/* 部门/中心负责人 */}
            <div className="space-y-2">
              <Label>部门/中心负责人</Label>
              <Input 
                value={editedProject.departmentHead || ""}
                onChange={(e) => handleInputChange('departmentHead', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
              />
            </div>
          </div>

          {/* 必要性、可行性、立项依据 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>必要性</Label>
              <Textarea 
                value={editedProject.necessity || ""}
                onChange={(e) => handleInputChange('necessity', e.target.value)}
                disabled={!isEditing}
                className={`min-h-[100px] ${!isEditing ? "bg-gray-50" : ""}`}
                placeholder="请描述项目的必要性..."
              />
            </div>

            <div className="space-y-2">
              <Label>可行性</Label>
              <Textarea 
                value={editedProject.feasibility || ""}
                onChange={(e) => handleInputChange('feasibility', e.target.value)}
                disabled={!isEditing}
                className={`min-h-[100px] ${!isEditing ? "bg-gray-50" : ""}`}
                placeholder="请描述项目的可行性..."
              />
            </div>

            <div className="space-y-2">
              <Label>立项依据</Label>
              <Textarea 
                value={editedProject.projectBasis || ""}
                onChange={(e) => handleInputChange('projectBasis', e.target.value)}
                disabled={!isEditing}
                className={`min-h-[100px] ${!isEditing ? "bg-gray-50" : ""}`}
                placeholder="请填写立项依据..."
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
              className={`min-h-[120px] ${!isEditing ? "bg-gray-50" : ""}`}
              placeholder="请详细描述项目实施方案..."
            />
          </div>

          {/* 项目描述 */}
          <div className="space-y-2">
            <Label>项目描述 *</Label>
            <Textarea 
              value={editedProject.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={!isEditing}
              className={`min-h-[100px] ${!isEditing ? "bg-gray-50" : ""}`}
              required
              placeholder="请描述项目的基本情况..."
            />
          </div>

          {/* 备注 */}
          <div className="space-y-2">
            <Label>备注</Label>
            <Textarea 
              value={editedProject.remarks || ""}
              onChange={(e) => handleInputChange('remarks', e.target.value)}
              disabled={!isEditing}
              className={`min-h-[100px] ${!isEditing ? "bg-gray-50" : ""}`}
              placeholder="其他需要说明的事项..."
            />
          </div>
        </CardContent>
      </Card>

      {/* 财务信息区 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>财务信息</CardTitle>
          {isEditing && (
            <Button onClick={addFinancialRow} size="sm" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>添加财务行</span>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {editedProject.financialRows && editedProject.financialRows.length > 0 ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间段</TableHead>
                    <TableHead>计划收入(含税)</TableHead>
                    <TableHead>收入税率</TableHead>
                    <TableHead>计划支出(含税)</TableHead>
                    <TableHead>支出税率</TableHead>
                    <TableHead>毛利率</TableHead>
                    {isEditing && <TableHead>操作</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editedProject.financialRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Input
                            type={isEditing ? "date" : "text"}
                            value={row.startTime}
                            onChange={(e) => updateFinancialRow(row.id, 'startTime', e.target.value)}
                            disabled={!isEditing}
                            className={`w-32 ${!isEditing ? "bg-gray-50" : ""}`}
                          />
                          <span className="self-center">至</span>
                          <Input
                            type={isEditing ? "date" : "text"}
                            value={row.endTime}
                            onChange={(e) => updateFinancialRow(row.id, 'endTime', e.target.value)}
                            disabled={!isEditing}
                            className={`w-32 ${!isEditing ? "bg-gray-50" : ""}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={row.plannedIncome}
                          onChange={(e) => updateFinancialRow(row.id, 'plannedIncome', parseFloat(e.target.value) || 0)}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-50" : ""}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={row.incomeTaxRate}
                          onChange={(e) => updateFinancialRow(row.id, 'incomeTaxRate', parseFloat(e.target.value) || 0)}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-50" : ""}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={row.plannedExpense}
                          onChange={(e) => updateFinancialRow(row.id, 'plannedExpense', parseFloat(e.target.value) || 0)}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-50" : ""}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={row.expenseTaxRate}
                          onChange={(e) => updateFinancialRow(row.id, 'expenseTaxRate', parseFloat(e.target.value) || 0)}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-50" : ""}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {row.plannedIncome > 0 
                            ? `${(((row.plannedIncome - row.plannedExpense) / row.plannedIncome) * 100).toFixed(2)}%`
                            : '0.00%'
                          }
                        </span>
                      </TableCell>
                      {isEditing && (
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFinancialRow(row.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* 财务摘要 */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-3">财务摘要</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">总收入(含税):</span>
                    <p className="font-semibold">{financialSummary.totalIncomeWithTax.toLocaleString()} 元</p>
                  </div>
                  <div>
                    <span className="text-gray-600">总收入(不含税):</span>
                    <p className="font-semibold">{financialSummary.totalIncomeWithoutTax.toLocaleString()} 元</p>
                  </div>
                  <div>
                    <span className="text-gray-600">总支出(含税):</span>
                    <p className="font-semibold">{financialSummary.totalExpenseWithTax.toLocaleString()} 元</p>
                  </div>
                  <div>
                    <span className="text-gray-600">总支出(不含税):</span>
                    <p className="font-semibold">{financialSummary.totalExpenseWithoutTax.toLocaleString()} 元</p>
                  </div>
                  <div>
                    <span className="text-gray-600">整体毛利率:</span>
                    <p className="font-semibold">{financialSummary.overallGrossMargin.toFixed(2)}%</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>暂无财务信息</p>
              {isEditing && (
                <Button onClick={addFinancialRow} className="mt-4">
                  添加第一条财务记录
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 附件信息 */}
      <Card>
        <CardHeader>
          <CardTitle>附件信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>可研项目建议书</Label>
              <Input 
                value={editedProject.attachmentFileName || ""}
                onChange={(e) => handleInputChange('attachmentFileName', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
                placeholder="附件文件名或路径..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 底部操作按钮 */}
      <div className="flex justify-end space-x-4 pt-6">
        <Button variant="outline" onClick={onBack}>
          返回列表
        </Button>
        {isEditing && (
          <Button onClick={handleSave} disabled={isSaving} className="flex items-center space-x-2">
            <Save className="h-4 w-4" />
            <span>{isSaving ? '提交中...' : '提交'}</span>
          </Button>
        )}
      </div>
    </div>
  )
} 