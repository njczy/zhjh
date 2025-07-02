"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Plus, Search, FileText, Eye, AlertTriangle, DollarSign, Calendar, RefreshCw, XCircle } from 'lucide-react'
import { useIsMobile } from "@/components/ui/use-mobile"
import { cn } from "@/lib/utils"
import { 
  User, 
  Contract, 
  InvoiceManagement,
  ProgressReimbursement,
  PermissionMatrix,
  getContracts, 
  getInvoiceManagements,
  getProgressReimbursements,
  addInvoiceManagement,
  updateInvoiceManagement,
  validateInvoiceConditions,
  processPayment,
  redReverseInvoice,
  checkUserPermission,
  generateWarningMessages,
  checkOverdueInvoices
} from '@/lib/data'

interface InvoiceManagementProps {
  currentUser: User
}

export default function InvoiceManagementComponent({ currentUser }: InvoiceManagementProps) {
  const isMobile = useIsMobile()
  
  // 状态管理
  const [contracts, setContracts] = useState<Contract[]>([])
  const [invoices, setInvoices] = useState<InvoiceManagement[]>([])
  const [reimbursements, setReimbursements] = useState<ProgressReimbursement[]>([])
  const [warningMessages, setWarningMessages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  // 新增开票对话框状态
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [invoiceMode, setInvoiceMode] = useState<'auto' | 'manual'>('auto')
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceAmount: 0,
    invoiceDate: new Date().toISOString().split('T')[0],
    invoiceType: 'normal' as 'normal' | 'red_reverse' | 'partial',
    partialReason: '',
    expectedPaymentDate: '',
    relatedProgressIds: [] as string[]
  })
  
  // 详情查看对话框状态
  const [viewingInvoice, setViewingInvoice] = useState<InvoiceManagement | null>(null)
  
  // 回款处理对话框状态
  const [paymentInvoice, setPaymentInvoice] = useState<InvoiceManagement | null>(null)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  
  // 红冲处理对话框状态
  const [redReverseInvoiceData, setRedReverseInvoiceData] = useState<InvoiceManagement | null>(null)
  const [redReverseReason, setRedReverseReason] = useState('')
  const [isRedReverseDialogOpen, setIsRedReverseDialogOpen] = useState(false)

  // 权限检查
  const canManualInvoice = checkUserPermission(currentUser, PermissionMatrix.MANUAL_INVOICE)

  // 加载数据
  useEffect(() => {
    fetchData()
    loadWarningMessages()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [contractsData, invoicesData, reimbursementsData] = await Promise.all([
        getContracts(),
        getInvoiceManagements(),
        getProgressReimbursements()
      ])
      setContracts(contractsData)
      setInvoices(invoicesData)
      setReimbursements(reimbursementsData)
      
      console.log('开票管理数据加载完成:', {
        合同数量: contractsData.length,
        开票记录数量: invoicesData.length,
        进度报销数量: reimbursementsData.length,
        当前用户: currentUser.name,
        用户角色: currentUser.role,
        权限检查: {
          手动开票: canManualInvoice
        }
      })
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadWarningMessages = async () => {
    try {
      await checkOverdueInvoices() // 更新逾期状态
      const messages = await generateWarningMessages()
      setWarningMessages(messages)
    } catch (error) {
      console.error('加载预警信息失败:', error)
    }
  }

  // 过滤数据
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const searchMatch = !searchTerm || 
        invoice.contractName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.contractCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.issuedBy.toLowerCase().includes(searchTerm.toLowerCase())
      
      const statusMatch = statusFilter === "all" || invoice.status === statusFilter
      
      return searchMatch && statusMatch
    })
  }, [invoices, searchTerm, statusFilter])

  // 获取状态显示
  const getStatusBadge = (status: InvoiceManagement['status']) => {
    const statusConfig = {
      issued: { label: '已开票', className: 'bg-blue-100 text-blue-800' },
      pending_payment: { label: '待回款', className: 'bg-yellow-100 text-yellow-800' },
      partial_payment: { label: '部分回款', className: 'bg-orange-100 text-orange-800' },
      full_payment: { label: '完全回款', className: 'bg-green-100 text-green-800' },
      overdue_15: { label: '逾期15天', className: 'bg-red-100 text-red-800' },
      overdue_30: { label: '逾期30天', className: 'bg-red-600 text-white' },
      cancelled: { label: '已作废', className: 'bg-gray-100 text-gray-800' }
    }
    
    const config = statusConfig[status]
    return <Badge className={`${config.className} hover:${config.className}`}>{config.label}</Badge>
  }

  // 获取预警级别显示
  const getWarningBadge = (warningLevel: InvoiceManagement['warningLevel']) => {
    if (warningLevel === 'warning_15') {
      return <Badge className="bg-yellow-100 text-yellow-800">15天预警</Badge>
    } else if (warningLevel === 'serious_30') {
      return <Badge className="bg-red-100 text-red-800">30天预警</Badge>
    }
    return null
  }

  // 获取开票类型显示
  const getInvoiceTypeLabel = (type: 'normal' | 'red_reverse' | 'partial') => {
    const types = {
      normal: '正常开票',
      red_reverse: '红冲处理',
      partial: '部分开票'
    }
    return types[type]
  }

  // 处理新增开票
  const handleCreateInvoice = () => {
    if (!canManualInvoice) {
      alert('您没有权限手动开票')
      return
    }
    setIsCreateDialogOpen(true)
  }

  // 处理合同选择
  const handleContractSelect = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId)
    setSelectedContract(contract || null)
    if (contract) {
      // 重置表单数据
      setFormData({
        invoiceNumber: '',
        invoiceAmount: 0,
        invoiceDate: new Date().toISOString().split('T')[0],
        invoiceType: 'normal',
        partialReason: '',
        expectedPaymentDate: '',
        relatedProgressIds: []
      })
      
      // 如果是自动模式，查找相关的已支付进度报销
      if (invoiceMode === 'auto') {
        const contractReimbursements = reimbursements.filter(r => 
          r.contractId === contractId && r.status === 'finance_approved'
        )
        setFormData(prev => ({
          ...prev,
          relatedProgressIds: contractReimbursements.map(r => r.id),
          invoiceAmount: contractReimbursements.reduce((sum, r) => sum + r.reimbursementAmount, 0)
        }))
      }
    }
  }

  // 处理开票提交
  const handleSubmitInvoice = async () => {
    if (!selectedContract) {
      alert('请选择合同')
      return
    }

    // 验证必填字段
    if (!formData.invoiceNumber) {
      alert('请填写发票号码')
      return
    }

    if (formData.invoiceAmount <= 0) {
      alert('请填写有效的开票金额')
      return
    }

    if (!formData.expectedPaymentDate) {
      alert('请选择预期回款日期')
      return
    }

    // 验证开票条件
    const validation = await validateInvoiceConditions(selectedContract.id, formData.invoiceAmount)
    if (!validation.valid) {
      alert(validation.message)
      return
    }

    try {
      const invoiceData: Omit<InvoiceManagement, 'id' | 'createdAt' | 'updatedAt'> = {
        contractId: selectedContract.id,
        contractCode: selectedContract.contractNumber,
        contractName: selectedContract.contractName,
        contractAmount: selectedContract.amount,
        invoiceMode,
        relatedProgressIds: formData.relatedProgressIds.length > 0 ? formData.relatedProgressIds : undefined,
        invoiceNumber: formData.invoiceNumber,
        invoiceAmount: formData.invoiceAmount,
        invoiceDate: formData.invoiceDate,
        invoiceType: formData.invoiceType,
        partialReason: formData.invoiceType === 'partial' ? formData.partialReason : undefined,
        status: 'pending_payment',
        issuedAt: new Date().toISOString(),
        issuedBy: currentUser.name,
        expectedPaymentDate: formData.expectedPaymentDate,
        paidAmount: 0,
        remainingAmount: formData.invoiceAmount,
        warningLevel: 'none'
      }

      await addInvoiceManagement(invoiceData, currentUser.id, currentUser.name)
      
      alert('开票成功')
      setIsCreateDialogOpen(false)
      setSelectedContract(null)
      await fetchData()
      await loadWarningMessages()
    } catch (error) {
      console.error('开票失败:', error)
      alert('开票失败：' + (error instanceof Error ? error.message : '请重试'))
    }
  }

  // 处理回款
  const handlePayment = async (isPartial: boolean) => {
    if (!paymentInvoice || paymentAmount <= 0) {
      alert('请填写有效的回款金额')
      return
    }

    if (paymentAmount > paymentInvoice.remainingAmount) {
      alert(`回款金额不能超过剩余金额 ${paymentInvoice.remainingAmount.toLocaleString()} 元`)
      return
    }

    try {
      await processPayment(paymentInvoice.id, paymentAmount, currentUser.id, currentUser.name, isPartial)
      
      alert('回款处理成功')
      setIsPaymentDialogOpen(false)
      setPaymentInvoice(null)
      setPaymentAmount(0)
      await fetchData()
      await loadWarningMessages()
    } catch (error) {
      console.error('回款处理失败:', error)
      alert('回款处理失败，请重试')
    }
  }

  // 处理红冲
  const handleRedReverse = async () => {
    if (!redReverseInvoiceData || !redReverseReason) {
      alert('请填写红冲原因')
      return
    }

    try {
      await redReverseInvoice(redReverseInvoiceData.id, currentUser.id, currentUser.name, redReverseReason)
      
      alert('红冲处理成功')
      setIsRedReverseDialogOpen(false)
      setRedReverseInvoiceData(null)
      setRedReverseReason('')
      await fetchData()
      await loadWarningMessages()
    } catch (error) {
      console.error('红冲处理失败:', error)
      alert('红冲处理失败，请重试')
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

  return (
    <div className="bg-white p-2 sm:p-4 lg:p-6 rounded-lg shadow-md h-full flex flex-col">
      {/* 页面标题和操作按钮 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 lg:mb-6 gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">开票管理</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">管理发票开具和回款跟踪</p>
        </div>
        <div className="flex flex-row gap-2 sm:gap-3">
          <Button 
            variant="outline" 
            onClick={loadWarningMessages}
            size="sm"
            className="text-orange-600 border-orange-600 hover:bg-orange-50 px-3 py-2 text-sm"
          >
            <RefreshCw className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">刷新预警</span>
            <span className="sm:hidden">预警</span>
          </Button>
          {canManualInvoice && (
            <Button 
              onClick={handleCreateInvoice} 
              size="sm"
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 text-sm"
            >
              <Plus className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">手动开票</span>
              <span className="sm:hidden">开票</span>
            </Button>
          )}
        </div>
      </div>

      {/* 预警信息 */}
      {warningMessages.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              系统预警
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {warningMessages.map((message, index) => (
                <li key={index} className="text-orange-700 text-sm">
                  • {message}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
            <div className="flex-1">
              <Label htmlFor="search">搜索</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="search"
                  placeholder="搜索合同名称、发票号码或开票人..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Label>状态筛选</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="issued">已开票</SelectItem>
                  <SelectItem value="pending_payment">待回款</SelectItem>
                  <SelectItem value="partial_payment">部分回款</SelectItem>
                  <SelectItem value="full_payment">完全回款</SelectItem>
                  <SelectItem value="overdue_15">逾期15天</SelectItem>
                  <SelectItem value="overdue_30">逾期30天</SelectItem>
                  <SelectItem value="cancelled">已作废</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 开票列表 */}
      <Card>
        <CardHeader>
          <CardTitle>开票列表</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 桌面端表格 */}
          <div className="hidden md:block">
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>发票号码</TableHead>
                    <TableHead>合同编号</TableHead>
                    <TableHead>合同名称</TableHead>
                    <TableHead>开票金额</TableHead>
                    <TableHead>已回款</TableHead>
                    <TableHead>剩余金额</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>预警</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.contractCode}</TableCell>
                      <TableCell>{invoice.contractName}</TableCell>
                      <TableCell>¥{invoice.invoiceAmount.toLocaleString()}</TableCell>
                      <TableCell>¥{invoice.paidAmount.toLocaleString()}</TableCell>
                      <TableCell>¥{invoice.remainingAmount.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>{getWarningBadge(invoice.warningLevel)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingInvoice(invoice)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(invoice.status === 'pending_payment' || invoice.status === 'partial_payment') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setPaymentInvoice(invoice)
                                setPaymentAmount(0)
                                setIsPaymentDialogOpen(true)
                              }}
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          )}
                          {invoice.status !== 'cancelled' && canManualInvoice && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setRedReverseInvoiceData(invoice)
                                setRedReverseReason('')
                                setIsRedReverseDialogOpen(true)
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          {/* 移动端卡片布局 */}
          <div className="md:hidden space-y-3 max-h-[600px] overflow-y-auto">
            {filteredInvoices.map((invoice) => (
              <Card key={invoice.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* 头部信息 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="font-medium font-mono text-sm">
                          {invoice.invoiceNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(invoice.status)}
                        {getWarningBadge(invoice.warningLevel)}
                      </div>
                    </div>

                    {/* 合同信息 */}
                    <div className="space-y-2">
                      <div>
                        <div className="font-medium">{invoice.contractName}</div>
                        <div className="text-sm text-gray-500 font-mono">
                          {invoice.contractCode}
                        </div>
                      </div>
                    </div>

                    {/* 金额信息 */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-blue-50 p-2 rounded-lg text-center">
                        <div className="text-xs text-blue-600 mb-1">开票金额</div>
                        <div className="text-sm font-medium text-blue-800">
                          ¥{invoice.invoiceAmount.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-green-50 p-2 rounded-lg text-center">
                        <div className="text-xs text-green-600 mb-1">已回款</div>
                        <div className="text-sm font-medium text-green-800">
                          ¥{invoice.paidAmount.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-orange-50 p-2 rounded-lg text-center">
                        <div className="text-xs text-orange-600 mb-1">剩余金额</div>
                        <div className="text-sm font-medium text-orange-800">
                          ¥{invoice.remainingAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingInvoice(invoice)}
                        className="flex-1"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        查看详情
                      </Button>
                      {(invoice.status === 'pending_payment' || invoice.status === 'partial_payment') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPaymentInvoice(invoice)
                            setPaymentAmount(0)
                            setIsPaymentDialogOpen(true)
                          }}
                          className="flex-1"
                        >
                          <DollarSign className="h-3 w-3 mr-1" />
                          回款
                        </Button>
                      )}
                      {invoice.status !== 'cancelled' && canManualInvoice && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRedReverseInvoiceData(invoice)
                            setRedReverseReason('')
                            setIsRedReverseDialogOpen(true)
                          }}
                          className="flex-1"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          红冲
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredInvoices.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                暂无开票数据
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 新增开票对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>手动开票</DialogTitle>
            <DialogDescription>
              填写开票信息，系统将验证开票条件
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 开票模式选择 */}
            <div className="space-y-2">
              <Label>开票模式</Label>
              <Select value={invoiceMode} onValueChange={(value: 'auto' | 'manual') => setInvoiceMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">自动触发（关联已支付的进度报销）</SelectItem>
                  <SelectItem value="manual">手动创建（直接关联合同）</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 合同选择 */}
            <div className="space-y-2">
              <Label>选择合同 *</Label>
              <Select value={selectedContract?.id || ''} onValueChange={handleContractSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择合同" />
                </SelectTrigger>
                <SelectContent>
                  {contracts.filter(c => c.status === '已绑定').map(contract => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.contractNumber} - {contract.contractName} (¥{contract.amount.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedContract && (
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">基本信息</TabsTrigger>
                  <TabsTrigger value="advanced">高级设置</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>发票号码 *</Label>
                      <Input
                        placeholder="请输入发票号码"
                        value={formData.invoiceNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>开票金额 * (元)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="请输入开票金额"
                        value={formData.invoiceAmount || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          invoiceAmount: parseFloat(e.target.value) || 0 
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>开票日期 *</Label>
                      <Input
                        type="date"
                        value={formData.invoiceDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>预期回款日期 *</Label>
                      <Input
                        type="date"
                        value={formData.expectedPaymentDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, expectedPaymentDate: e.target.value }))}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                  <div className="space-y-2">
                    <Label>开票类型</Label>
                    <Select 
                      value={formData.invoiceType} 
                      onValueChange={(value: 'normal' | 'red_reverse' | 'partial') => 
                        setFormData(prev => ({ ...prev, invoiceType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">正常开票</SelectItem>
                        <SelectItem value="partial">部分开票</SelectItem>
                        <SelectItem value="red_reverse">红冲处理</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.invoiceType === 'partial' && (
                    <div className="space-y-2">
                      <Label>部分开票原因</Label>
                      <Textarea
                        placeholder="请说明部分开票的原因..."
                        value={formData.partialReason}
                        onChange={(e) => setFormData(prev => ({ ...prev, partialReason: e.target.value }))}
                      />
                    </div>
                  )}

                  {invoiceMode === 'auto' && formData.relatedProgressIds.length > 0 && (
                    <div className="space-y-2">
                      <Label>关联的进度报销</Label>
                      <div className="text-sm text-gray-600">
                        {reimbursements
                          .filter(r => formData.relatedProgressIds.includes(r.id))
                          .map(r => (
                            <div key={r.id} className="p-2 bg-gray-50 rounded">
                              {r.contractName} - ¥{r.reimbursementAmount.toLocaleString()}
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmitInvoice} disabled={!selectedContract}>
              确认开票
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 详情查看对话框 */}
      {viewingInvoice && (
        <Dialog open={!!viewingInvoice} onOpenChange={() => setViewingInvoice(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>开票详情</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">发票号码</Label>
                  <p className="mt-1 font-medium">{viewingInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">合同编号</Label>
                  <p className="mt-1">{viewingInvoice.contractCode}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">合同名称</Label>
                  <p className="mt-1">{viewingInvoice.contractName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">开票模式</Label>
                  <p className="mt-1">{viewingInvoice.invoiceMode === 'auto' ? '自动触发' : '手动创建'}</p>
                </div>
              </div>

              {/* 金额信息 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">金额信息</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">开票金额</Label>
                    <p className="mt-1 text-blue-600 font-medium">¥{viewingInvoice.invoiceAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">已回款金额</Label>
                    <p className="mt-1 text-green-600 font-medium">¥{viewingInvoice.paidAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">剩余金额</Label>
                    <p className="mt-1 text-orange-600 font-medium">¥{viewingInvoice.remainingAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* 时间信息 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">时间信息</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">开票日期</Label>
                    <p className="mt-1">{new Date(viewingInvoice.invoiceDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">预期回款日期</Label>
                    <p className="mt-1">{new Date(viewingInvoice.expectedPaymentDate).toLocaleDateString()}</p>
                  </div>
                  {viewingInvoice.actualPaymentDate && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">实际回款日期</Label>
                      <p className="mt-1">{new Date(viewingInvoice.actualPaymentDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 状态信息 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">状态信息</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">当前状态</Label>
                    <p className="mt-1">{getStatusBadge(viewingInvoice.status)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">预警级别</Label>
                    <p className="mt-1">{getWarningBadge(viewingInvoice.warningLevel) || '无预警'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">开票类型</Label>
                    <p className="mt-1">{getInvoiceTypeLabel(viewingInvoice.invoiceType)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">开票人</Label>
                    <p className="mt-1">{viewingInvoice.issuedBy}</p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingInvoice(null)}>
                关闭
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 回款处理对话框 */}
      <AlertDialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>处理回款</AlertDialogTitle>
            <AlertDialogDescription>
              {paymentInvoice && (
                <div className="space-y-2">
                  <p>发票号码: {paymentInvoice.invoiceNumber}</p>
                  <p>剩余金额: ¥{paymentInvoice.remainingAmount.toLocaleString()}</p>
                  <div className="mt-4">
                    <Label>回款金额 (元)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      max={paymentInvoice.remainingAmount}
                      placeholder="请输入回款金额"
                      value={paymentAmount || ''}
                      onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                      className="mt-2"
                    />
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsPaymentDialogOpen(false)
              setPaymentInvoice(null)
              setPaymentAmount(0)
            }}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handlePayment(true)}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={!paymentInvoice || paymentAmount <= 0 || paymentAmount >= paymentInvoice.remainingAmount}
            >
              部分回款
            </AlertDialogAction>
            <AlertDialogAction 
              onClick={() => handlePayment(false)}
              disabled={!paymentInvoice || paymentAmount !== paymentInvoice.remainingAmount}
            >
              全额回款
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 红冲处理对话框 */}
      <AlertDialog open={isRedReverseDialogOpen} onOpenChange={setIsRedReverseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>红冲处理</AlertDialogTitle>
            <AlertDialogDescription>
              {redReverseInvoiceData && (
                <div className="space-y-2">
                  <p>发票号码: {redReverseInvoiceData.invoiceNumber}</p>
                  <p>开票金额: ¥{redReverseInvoiceData.invoiceAmount.toLocaleString()}</p>
                  <div className="mt-4">
                    <Label>红冲原因</Label>
                    <Textarea
                      placeholder="请填写红冲原因..."
                      value={redReverseReason}
                      onChange={(e) => setRedReverseReason(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsRedReverseDialogOpen(false)
              setRedReverseInvoiceData(null)
              setRedReverseReason('')
            }}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRedReverse}
              className="bg-red-600 hover:bg-red-700"
              disabled={!redReverseReason}
            >
              确认红冲
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 