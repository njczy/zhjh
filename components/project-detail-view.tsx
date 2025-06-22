'use client'

import React from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft } from 'lucide-react'
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import type { Project } from '@/lib/data'

interface ProjectDetailViewProps {
  onBack: () => void
  project: Project
}

export default function ProjectDetailView({ onBack, project }: ProjectDetailViewProps) {
  // 计算财务摘要
  const calculateFinancialSummary = () => {
    if (!project.financialRows || project.financialRows.length === 0) {
      return {
        totalIncomeWithTax: 0,
        totalIncomeWithoutTax: 0,
        totalExpenseWithTax: 0,
        totalExpenseWithoutTax: 0,
        overallGrossMargin: 0
      }
    }

    const totalIncomeWithTax = project.financialRows.reduce((sum, row) => sum + row.plannedIncome, 0)
    const totalExpenseWithTax = project.financialRows.reduce((sum, row) => sum + row.plannedExpense, 0)
    
    const totalIncomeWithoutTax = project.financialRows.reduce((sum, row) => {
      return sum + (row.plannedIncome / (1 + row.incomeTaxRate / 100))
    }, 0)
    
    const totalExpenseWithoutTax = project.financialRows.reduce((sum, row) => {
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
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="ghost" onClick={onBack} className="p-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">项目详情 - {project.name}</h1>
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
                value={project.department || project.center || "未设置"} 
                disabled 
                className="bg-gray-50"
              />
            </div>

            {/* 项目负责人（只读） */}
            <div className="space-y-2">
              <Label>项目负责人</Label>
              <Input 
                value={project.owner} 
                disabled 
                className="bg-gray-50"
              />
            </div>

            {/* 项目名称（只读） */}
            <div className="space-y-2">
              <Label>项目名称</Label>
              <Input 
                value={project.name}
                disabled 
                className="bg-gray-50"
              />
            </div>

            {/* 项目类型（只读） */}
            <div className="space-y-2">
              <Label>项目类型</Label>
              <Input 
                value={project.projectType || "未设置"}
                disabled 
                className="bg-gray-50"
              />
            </div>

            {/* 归口管理部门 */}
            <div className="space-y-2">
              <Label>归口管理部门</Label>
              <Input 
                value={project.managementDepartment || "未设置"}
                disabled 
                className="bg-gray-50"
              />
            </div>

            {/* 资金属性（只读） */}
            <div className="space-y-2">
              <Label>资金属性</Label>
              <Input 
                value={project.fundAttribute || "未设置"}
                disabled 
                className="bg-gray-50"
              />
            </div>

            {/* 实施年份（起止时间） */}
            <div className="space-y-2">
              <Label>实施开始时间</Label>
              <Input 
                value={project.startDate ? format(new Date(project.startDate), "yyyy年MM月dd日", { locale: zhCN }) : "未设置"}
                disabled 
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label>实施结束时间</Label>
              <Input 
                value={project.endDate ? format(new Date(project.endDate), "yyyy年MM月dd日", { locale: zhCN }) : "未设置"}
                disabled 
                className="bg-gray-50"
              />
            </div>
          </div>

          {/* 必要性、可行性、立项依据 - 一行展示 */}
          <div className="grid grid-cols-3 gap-6">
            {/* 必要性（只读） */}
            <div className="space-y-2">
              <Label>必要性</Label>
              <Input 
                value={project.necessity || "未填写"}
                disabled 
                className="bg-gray-50"
              />
            </div>

            {/* 可行性 */}
            <div className="space-y-2">
              <Label>可行性</Label>
              <Input 
                value={project.feasibility || "未填写"}
                disabled 
                className="bg-gray-50"
              />
            </div>

            {/* 立项依据 */}
            <div className="space-y-2">
              <Label>立项依据</Label>
              <Input 
                value={project.projectBasis || "未填写"}
                disabled 
                className="bg-gray-50"
              />
            </div>
          </div>

          {/* 项目实施方案 */}
          <div className="space-y-2">
            <Label>项目实施方案</Label>
            <Textarea 
              value={project.implementationPlan || "未填写"}
              disabled 
              className="min-h-[120px] bg-gray-50"
            />
          </div>
        </CardContent>
      </Card>

      {/* 财务/预算表格区 */}
      <Card>
        <CardHeader>
          <CardTitle>财务/预算信息</CardTitle>
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
                {!project.financialRows || project.financialRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      暂无财务数据
                    </TableCell>
                  </TableRow>
                ) : (
                  project.financialRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.startTime}</TableCell>
                      <TableCell>{row.endTime}</TableCell>
                      <TableCell>{row.plannedIncome.toLocaleString()}</TableCell>
                      <TableCell>{row.incomeTaxRate}%</TableCell>
                      <TableCell>{row.plannedExpense.toLocaleString()}</TableCell>
                      <TableCell>{row.expenseTaxRate}%</TableCell>
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
              value={project.remarks || "无备注"}
              disabled 
              className="min-h-[100px] bg-gray-50"
            />
          </div>
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
                value={project.attachmentFileName || "无附件"}
                disabled 
                className="bg-gray-50"
              />
            </div>

            {/* 部门/中心负责人 */}
            <div className="space-y-2">
              <Label>部门/中心负责人</Label>
              <Input 
                value={project.departmentHead || "未设置"}
                disabled 
                className="bg-gray-50"
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
      </div>
    </div>
  )
} 