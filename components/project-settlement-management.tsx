"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { ScrollArea } from "./ui/scroll-area"
import { Alert, AlertDescription } from "./ui/alert"
import { useIsMobile } from "./ui/use-mobile"
import { cn } from "@/lib/utils"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Mail,
  Eye,
  Edit,
  RefreshCw,
  ArrowUpDown,
  FileText
} from 'lucide-react'

import {
  ProjectSettlement,
  SettlementSummary,
  PaymentRecord,
  getProjectSettlements,
  getSettlementSummary,
  getPaymentRecordsByContract,
  updatePaymentAmount,
  sendCollectionNotice,
  User
} from '../lib/data'

interface ProjectSettlementManagementProps {
  currentUser: User
}

export default function ProjectSettlementManagement({ currentUser }: ProjectSettlementManagementProps) {
  const isMobile = useIsMobile()
  const [settlements, setSettlements] = useState<ProjectSettlement[]>([])
  const [summary, setSummary] = useState<SettlementSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'paid' | 'partial_payment' | 'pending_payment' | 'overdue_serious'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<keyof ProjectSettlement>('contractCode')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // 对话框状态
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedSettlement, setSelectedSettlement] = useState<ProjectSettlement | null>(null)
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([])
  const [newPaymentAmount, setNewPaymentAmount] = useState('')

  // 加载数据
  const loadData = async () => {
    setLoading(true)
    try {
      const [settlementsData, summaryData] = await Promise.all([
        getProjectSettlements(),
        getSettlementSummary()
      ])
      setSettlements(settlementsData)
      setSummary(summaryData)
    } catch (error) {
      console.error('加载结算数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // 格式化金额
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2
    }).format(amount)
  }

  // 格式化增长率
  const formatGrowthRate = (rate: number) => {
    const isPositive = rate >= 0
    const Icon = isPositive ? TrendingUp : TrendingDown
    const color = isPositive ? "text-green-600" : "text-red-600"
    
    return (
      <div className={`flex items-center ${color}`}>
        <Icon className="h-4 w-4 mr-1" />
        <span>{Math.abs(rate).toFixed(1)}%</span>
      </div>
    )
  }

  // 获取状态标识
  const getStatusBadge = (status: ProjectSettlement['status']) => {
    const configs = {
      paid: { label: '✅ 已回款', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
      partial_payment: { label: '⚠ 部分回款', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
      pending_payment: { label: '⌛ 待回款', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
      overdue_serious: { label: '🚨 严重逾期', className: 'bg-red-100 text-red-800 hover:bg-red-100' }
    }
    
    const config = configs[status]
    return <Badge className={config.className}>{config.label}</Badge>
  }

  // 过滤和排序数据
  const filteredAndSortedSettlements = settlements
    .filter(settlement => {
      if (filter !== 'all' && settlement.status !== filter) return false
      if (searchTerm && !settlement.contractCode.toLowerCase().includes(searchTerm.toLowerCase()) 
          && !settlement.contractName.toLowerCase().includes(searchTerm.toLowerCase())
          && !settlement.clientName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue)
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }
      
      return 0
    })

  // 处理排序
  const handleSort = (field: keyof ProjectSettlement) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // 处理回款金额更新
  const handleUpdatePayment = async () => {
    if (!selectedSettlement || !newPaymentAmount) return

    const amount = parseFloat(newPaymentAmount)
    if (amount > selectedSettlement.contractAmount) {
      alert('回款金额不能超过合同金额')
      return
    }

    try {
      const success = await updatePaymentAmount(
        selectedSettlement.contractId,
        amount,
        currentUser.id,
        currentUser.name
      )

      if (success) {
        alert('回款金额更新成功')
        setIsPaymentDialogOpen(false)
        setNewPaymentAmount('')
        await loadData() // 重新加载数据
      } else {
        alert('更新失败，请重试')
      }
    } catch (error) {
      alert('更新失败，请重试')
    }
  }

  // 查看详情
  const handleViewDetail = async (settlement: ProjectSettlement) => {
    setSelectedSettlement(settlement)
    const records = await getPaymentRecordsByContract(settlement.contractId)
    setPaymentRecords(records)
    setIsDetailDialogOpen(true)
  }

  // 发送催收通知
  const handleSendNotice = async (settlement: ProjectSettlement) => {
    try {
      const success = await sendCollectionNotice(settlement.contractId)
      if (success) {
        alert(`已发送催收通知给 ${settlement.clientName}`)
      }
    } catch (error) {
      alert('发送失败，请重试')
    }
  }

  // 修改回款金额
  const handleEditPayment = (settlement: ProjectSettlement) => {
    setSelectedSettlement(settlement)
    setNewPaymentAmount(settlement.totalPaidAmount.toString())
    setIsPaymentDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>加载结算数据中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-2 sm:p-4 lg:p-6 rounded-lg shadow-md h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 lg:mb-6 gap-3 sm:gap-4">
        <div className="flex items-center">
          <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">项目结算管理</h2>
            <p className="text-xs sm:text-sm text-gray-600">合同收款汇总看板</p>
          </div>
        </div>
        <div className="flex flex-row gap-2 sm:gap-3">
          <Button 
            onClick={loadData} 
            size="sm"
            className="px-3 py-2 text-sm"
          >
            <RefreshCw className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
            刷新数据
          </Button>
        </div>
      </div>

      {/* 全局概览卡片 */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">累计合同金额</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatAmount(summary.totalContractAmount)}</div>
              <p className="text-xs text-muted-foreground">总计 {settlements.length} 个合同</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已回款总额</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatAmount(summary.totalPaidAmount)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                本月: {formatAmount(summary.currentMonthPaid)} 
                <span className="ml-2">{formatGrowthRate(summary.growthRate)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">逾期账款金额</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatAmount(summary.overdueAmount)}</div>
              <p className="text-xs text-muted-foreground">超期≥30天 {summary.overdueCount} 个合同</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">回款完成率</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {((summary.totalPaidAmount / summary.totalContractAmount) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                已回款 {summary.paidContractCount} / 部分 {summary.partialPaidCount} / 待收 {summary.pendingCount}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 合同状态看板 */}
      <Card>
        <CardHeader>
          <CardTitle>合同状态看板</CardTitle>
          <CardDescription>按状态筛选查看合同收款情况</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={(value: any) => setFilter(value)} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">全部合同</TabsTrigger>
              <TabsTrigger value="paid">✅ 已回款</TabsTrigger>
              <TabsTrigger value="partial_payment">⚠ 部分回款</TabsTrigger>
              <TabsTrigger value="pending_payment">⌛ 待回款</TabsTrigger>
              <TabsTrigger value="overdue_serious">🚨 严重逾期</TabsTrigger>
            </TabsList>

            <div className="mt-4 flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="搜索合同编号、名称或客户..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <TabsContent value={filter} className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort('contractCode')}
                          className="h-auto p-0 font-medium"
                        >
                          合同编号 <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>客户名称</TableHead>
                      <TableHead className="text-right">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort('contractAmount')}
                          className="h-auto p-0 font-medium"
                        >
                          合同金额 <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort('lastInvoiceDate')}
                          className="h-auto p-0 font-medium"
                        >
                          最近开票 <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">应回款金额</TableHead>
                      <TableHead className="text-right">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort('totalPaidAmount')}
                          className="h-auto p-0 font-medium"
                        >
                          实际回款 <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort('remainingAmount')}
                          className="h-auto p-0 font-medium"
                        >
                          欠款差额 <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedSettlements.map((settlement) => (
                      <TableRow key={settlement.id}>
                        <TableCell className="font-medium">
                          <Button
                            variant="link"
                            className="p-0 h-auto text-blue-600"
                            onClick={() => handleViewDetail(settlement)}
                          >
                            {settlement.contractCode}
                          </Button>
                        </TableCell>
                        <TableCell>{settlement.clientName}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatAmount(settlement.contractAmount)}
                        </TableCell>
                        <TableCell>
                          {settlement.lastInvoiceDate ? (
                            <div className={`text-sm ${settlement.overdueDays && settlement.overdueDays > 15 ? 'text-red-600 font-medium' : ''}`}>
                              {settlement.lastInvoiceDate}
                              {settlement.overdueDays && settlement.overdueDays > 0 && (
                                <div className="text-xs text-gray-500">
                                  {settlement.overdueDays}天前
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">未开票</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatAmount(settlement.totalInvoiceAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="link"
                            className="p-0 h-auto text-green-600 font-medium"
                            onClick={() => handleEditPayment(settlement)}
                          >
                            {formatAmount(settlement.totalPaidAmount)}
                          </Button>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${settlement.remainingAmount < 0 ? 'text-red-600' : ''}`}>
                          {formatAmount(settlement.remainingAmount)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(settlement.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetail(settlement)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            {settlement.status === 'pending_payment' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSendNotice(settlement)}
                                className="text-orange-600 border-orange-200 hover:bg-orange-50"
                              >
                                <Mail className="h-3 w-3" />
                              </Button>
                            )}
                            {currentUser.department === '财务部' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditPayment(settlement)}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 回款金额修改对话框 */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改回款金额</DialogTitle>
            <DialogDescription>
              合同: {selectedSettlement?.contractName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-gray-600">合同金额:</Label>
                <p className="font-medium">{selectedSettlement && formatAmount(selectedSettlement.contractAmount)}</p>
              </div>
              <div>
                <Label className="text-gray-600">当前回款:</Label>
                <p className="font-medium text-green-600">{selectedSettlement && formatAmount(selectedSettlement.totalPaidAmount)}</p>
              </div>
            </div>
            <div>
              <Label htmlFor="payment-amount">新回款金额</Label>
              <Input
                id="payment-amount"
                type="number"
                value={newPaymentAmount}
                onChange={(e) => setNewPaymentAmount(e.target.value)}
                placeholder="请输入回款金额"
              />
            </div>
            {selectedSettlement && parseFloat(newPaymentAmount || '0') > selectedSettlement.contractAmount && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  回款金额不能超过合同金额
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdatePayment}>
              确认修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 详情查看对话框 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>合同收款详情</DialogTitle>
            <DialogDescription>
              {selectedSettlement?.contractCode} - {selectedSettlement?.contractName}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedSettlement && (
              <div className="space-y-6">
                {/* 基本信息 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">客户名称</Label>
                    <p className="mt-1 text-sm">{selectedSettlement.clientName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">合同状态</Label>
                    <div className="mt-1">{getStatusBadge(selectedSettlement.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">合同金额</Label>
                    <p className="mt-1 text-sm font-medium">{formatAmount(selectedSettlement.contractAmount)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">回款进度</Label>
                    <p className="mt-1 text-sm">
                      {((selectedSettlement.totalPaidAmount / selectedSettlement.contractAmount) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* 回款记录 */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">回款记录</Label>
                  {paymentRecords.length > 0 ? (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>回款日期</TableHead>
                            <TableHead>回款金额</TableHead>
                            <TableHead>回款方式</TableHead>
                            <TableHead>备注</TableHead>
                            <TableHead>记录人</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paymentRecords.map((record) => (
                            <TableRow key={record.id}>
                              <TableCell>{record.paymentDate}</TableCell>
                              <TableCell className="font-medium text-green-600">
                                {formatAmount(record.amount)}
                              </TableCell>
                              <TableCell>{record.paymentMethod}</TableCell>
                              <TableCell>{record.remarks}</TableCell>
                              <TableCell>{record.recordedBy}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 border rounded-lg">
                      <FileText className="h-8 w-8 mx-auto mb-2" />
                      <p>暂无回款记录</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 