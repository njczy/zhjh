'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useUser } from '@/contexts/UserContext'
import { 
  BankTransaction, 
  MatchResult, 
  AdjustmentRecord, 
  ReconciliationReport,
  InvoiceManagement,
  getBankTransactions,
  getMatchResults,
  getAdjustmentRecords,
  getInvoiceManagements,
  importBankTransactions,
  performAutoMatching,
  confirmMatchResult,
  manualLinkTransaction,
  generateDailyReconciliationReport,
  getReconciliationReports
} from '@/lib/data'
import { 
  Upload, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock,
  FileText,
  TrendingUp,
  DollarSign,
  Calendar,
  RefreshCw,
  Download,
  Eye,
  Link,
  AlertCircle,
  Target
} from 'lucide-react'
import { toast } from "sonner"

export default function BankReconciliationManagement() {
  const { currentUser: user } = useUser()
  const [activeTab, setActiveTab] = useState('overview')
  
  // 数据状态
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [matchResults, setMatchResults] = useState<MatchResult[]>([])
  const [adjustmentRecords, setAdjustmentRecords] = useState<AdjustmentRecord[]>([])
  const [invoices, setInvoices] = useState<InvoiceManagement[]>([])
  const [reports, setReports] = useState<ReconciliationReport[]>([])
  
  // UI状态
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showMatchDialog, setShowMatchDialog] = useState(false)
  const [showManualLinkDialog, setShowManualLinkDialog] = useState(false)
  
  // 表单状态
  const [importData, setImportData] = useState('')
  const [reviewComments, setReviewComments] = useState('')
  const [linkReason, setLinkReason] = useState('')
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('')

  // 权限检查 - 基于角色判断
  const canManageReconciliation = user?.role === '部门专职' || user?.role === '部门领导' || user?.role === '中心专职' || user?.role === '中心领导'
  const canApproveAdjustments = user?.role === '部门领导' || user?.role === '中心领导' || user?.role === '分管院领导'
  const canViewReports = user?.role === '部门专职' || user?.role === '部门领导' || user?.role === '中心专职' || user?.role === '中心领导' || user?.role === '分管院领导'

  // 数据加载
  const loadData = async () => {
    setLoading(true)
    try {
      const [transactionsData, matchesData, adjustmentsData, invoicesData, reportsData] = await Promise.all([
        getBankTransactions(),
        getMatchResults(),
        getAdjustmentRecords(),
        getInvoiceManagements(),
        getReconciliationReports()
      ])
      
      setTransactions(transactionsData)
      setMatchResults(matchesData)
      setAdjustmentRecords(adjustmentsData)
      setInvoices(invoicesData)
      setReports(reportsData)
    } catch (error) {
      console.error('加载数据失败:', error)
      toast.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // 计算概览数据
  const getOverviewData = () => {
    const totalTransactions = transactions.length
    const matchedTransactions = matchResults.filter(m => m.status === 'confirmed').length
    const pendingMatches = matchResults.filter(m => m.status === 'pending').length
    const unmatchedTransactions = totalTransactions - matchedTransactions
    
    const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0)
    const matchedAmount = matchResults
      .filter(m => m.status === 'confirmed')
      .reduce((sum, match) => {
        const tx = transactions.find(t => t.id === match.bankTransactionId)
        return sum + (tx?.amount || 0)
      }, 0)
    
    const matchSuccessRate = totalTransactions > 0 ? (matchedTransactions / totalTransactions) * 100 : 0
    
    return {
      totalTransactions,
      matchedTransactions,
      pendingMatches,
      unmatchedTransactions,
      totalAmount,
      matchedAmount,
      unmatchedAmount: totalAmount - matchedAmount,
      matchSuccessRate
    }
  }

  // 导入银行流水
  const handleImportTransactions = async () => {
    if (!importData.trim()) {
      toast.error('请输入银行流水数据')
      return
    }

    try {
      // 解析CSV数据
      const lines = importData.trim().split('\n')
      const header = lines[0].split(',')
      
      if (header.length < 4) {
        toast.error('数据格式不正确，需要包含：交易日期,金额,对方户名,流水号')
        return
      }

      const newTransactions = lines.slice(1).map((line, index) => {
        const cols = line.split(',')
        return {
          transactionDate: cols[0]?.trim() || '',
          amount: parseFloat(cols[1]?.trim() || '0'),
          counterpartyName: cols[2]?.trim() || '',
          transactionNumber: cols[3]?.trim() || `IMPORT-${Date.now()}-${index}`,
          transactionType: 'credit' as const,
          description: cols[4]?.trim() || '银行流水导入',
          remarks: '手动导入'
        }
      }).filter(tx => tx.amount > 0 && tx.transactionDate)

      if (newTransactions.length === 0) {
        toast.error('没有有效的流水数据')
        return
      }

      setLoading(true)
      await importBankTransactions(newTransactions, user?.id || '', user?.name || '未知用户')
      await loadData()
      
      setShowImportDialog(false)
      setImportData('')
      toast.success(`成功导入 ${newTransactions.length} 条银行流水`)
    } catch (error) {
      console.error('导入失败:', error)
      toast.error('导入银行流水失败')
    } finally {
      setLoading(false)
    }
  }

  // 执行自动匹配
  const handleAutoMatch = async () => {
    setLoading(true)
    try {
      await performAutoMatching()
      await loadData()
      toast.success('自动匹配完成')
    } catch (error) {
      console.error('自动匹配失败:', error)
      toast.error('自动匹配失败')
    } finally {
      setLoading(false)
    }
  }

  // 确认匹配结果
  const handleConfirmMatch = async () => {
    if (!selectedMatch) return

    setLoading(true)
    try {
      await confirmMatchResult(
        selectedMatch.id,
        user?.id || '',
        user?.name || '未知用户',
        reviewComments
      )
      await loadData()
      setShowMatchDialog(false)
      setSelectedMatch(null)
      setReviewComments('')
      toast.success('匹配结果已确认')
    } catch (error) {
      console.error('确认匹配失败:', error)
      toast.error('确认匹配失败')
    } finally {
      setLoading(false)
    }
  }

  // 手动关联
  const handleManualLink = async () => {
    if (!selectedTransaction || !selectedInvoiceId || !linkReason.trim()) {
      toast.error('请填写完整信息')
      return
    }

    setLoading(true)
    try {
      await manualLinkTransaction(
        selectedTransaction.id,
        selectedInvoiceId,
        user?.id || '',
        user?.name || '未知用户',
        linkReason
      )
      await loadData()
      setShowManualLinkDialog(false)
      setSelectedTransaction(null)
      setSelectedInvoiceId('')
      setLinkReason('')
      toast.success('手动关联成功')
    } catch (error) {
      console.error('手动关联失败:', error)
      toast.error('手动关联失败')
    } finally {
      setLoading(false)
    }
  }

  // 生成对账报告
  const handleGenerateReport = async () => {
    setLoading(true)
    try {
      await generateDailyReconciliationReport()
      await loadData()
      toast.success('对账报告生成成功')
    } catch (error) {
      console.error('生成报告失败:', error)
      toast.error('生成报告失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取匹配状态图标
  const getMatchStatusIcon = (match: MatchResult) => {
    switch (match.matchType) {
      case 'exact':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'suspected':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'manual':
        return <Link className="h-4 w-4 text-blue-500" />
      default:
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  // 获取匹配状态文本
  const getMatchStatusText = (match: MatchResult) => {
    switch (match.matchType) {
      case 'exact':
        return '精确匹配'
      case 'suspected':
        return '疑似匹配'
      case 'manual':
        return '手动关联'
      default:
        return '无匹配'
    }
  }

  // 过滤数据
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = !searchTerm || 
      tx.counterpartyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.transactionNumber.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || tx.status === filterStatus
    
    return matchesSearch && matchesFilter
  })

  const filteredMatches = matchResults.filter(match => {
    const tx = transactions.find(t => t.id === match.bankTransactionId)
    const invoice = invoices.find(inv => inv.id === match.invoiceId)
    
    const matchesSearch = !searchTerm || 
      tx?.counterpartyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice?.contractName.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const overviewData = getOverviewData()

  if (!canManageReconciliation) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            您没有权限访问银行对账管理功能。
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">银行对账管理</h1>
          <p className="text-gray-600">智能匹配银行流水与开票记录，确保财务数据一致性</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleAutoMatch}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            自动匹配
          </Button>
          <Button
            onClick={handleGenerateReport}
            disabled={loading}
            variant="outline"
          >
            <FileText className="h-4 w-4 mr-2" />
            生成报告
          </Button>
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button disabled={loading}>
                <Upload className="h-4 w-4 mr-2" />
                导入流水
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概览仪表板</TabsTrigger>
          <TabsTrigger value="transactions">银行流水</TabsTrigger>
          <TabsTrigger value="matching">匹配管理</TabsTrigger>
          <TabsTrigger value="reports">对账报告</TabsTrigger>
        </TabsList>

        {/* 概览仪表板 */}
        <TabsContent value="overview" className="space-y-6">
          {/* 关键指标卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总流水数</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewData.totalTransactions}</div>
                <div className="text-xs text-muted-foreground">
                  已匹配 {overviewData.matchedTransactions} 笔
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">匹配成功率</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewData.matchSuccessRate.toFixed(1)}%</div>
                <Progress value={overviewData.matchSuccessRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总金额</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">¥{overviewData.totalAmount.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  已匹配 ¥{overviewData.matchedAmount.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">待处理</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewData.pendingMatches}</div>
                <div className="text-xs text-muted-foreground">
                  疑似匹配需审核
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 状态分布图表 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>匹配状态分布</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>精确匹配</span>
                  </div>
                  <span className="font-medium">
                    {matchResults.filter(m => m.matchType === 'exact').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span>疑似匹配</span>
                  </div>
                  <span className="font-medium">
                    {matchResults.filter(m => m.matchType === 'suspected').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link className="h-4 w-4 text-blue-500" />
                    <span>手动关联</span>
                  </div>
                  <span className="font-medium">
                    {matchResults.filter(m => m.matchType === 'manual').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span>未匹配</span>
                  </div>
                  <span className="font-medium">{overviewData.unmatchedTransactions}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>最近对账报告</CardTitle>
              </CardHeader>
              <CardContent>
                {reports.length > 0 ? (
                  <div className="space-y-3">
                    {reports.slice(-5).reverse().map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{report.reportDate}</div>
                          <div className="text-sm text-gray-600">
                            成功率: {report.matchSuccessRate.toFixed(1)}%
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    暂无对账报告
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 银行流水 */}
        <TabsContent value="transactions" className="space-y-6">
          {/* 搜索和过滤 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="搜索流水号、客户名称..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="unmatched">未匹配</SelectItem>
                    <SelectItem value="matched">已匹配</SelectItem>
                    <SelectItem value="manual_linked">手动关联</SelectItem>
                    <SelectItem value="frozen">已冻结</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 银行流水表格 */}
          <Card>
            <CardHeader>
              <CardTitle>银行流水列表</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>交易日期</TableHead>
                    <TableHead>流水号</TableHead>
                    <TableHead>对方户名</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>关联开票</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => {
                    const relatedMatch = matchResults.find(m => m.bankTransactionId === transaction.id)
                    const relatedInvoice = transaction.relatedInvoiceId 
                      ? invoices.find(inv => inv.id === transaction.relatedInvoiceId)
                      : null
                    
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.transactionDate}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {transaction.transactionNumber}
                        </TableCell>
                        <TableCell>{transaction.counterpartyName}</TableCell>
                        <TableCell className="font-medium">
                          ¥{transaction.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              transaction.status === 'matched' ? 'default' :
                              transaction.status === 'manual_linked' ? 'secondary' :
                              transaction.status === 'frozen' ? 'destructive' : 'outline'
                            }
                          >
                            {transaction.status === 'matched' ? '已匹配' :
                             transaction.status === 'manual_linked' ? '手动关联' :
                             transaction.status === 'frozen' ? '已冻结' : '未匹配'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {relatedInvoice ? (
                            <span className="text-sm text-blue-600">
                              {relatedInvoice.contractName}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedTransaction(transaction)
                                setShowManualLinkDialog(true)
                              }}
                              disabled={transaction.status !== 'unmatched'}
                            >
                              <Link className="h-4 w-4" />
                            </Button>
                            {relatedMatch && relatedMatch.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedMatch(relatedMatch)
                                  setShowMatchDialog(true)
                                }}
                              >
                                审核
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 匹配管理 */}
        <TabsContent value="matching" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>匹配结果管理</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>匹配类型</TableHead>
                    <TableHead>银行流水</TableHead>
                    <TableHead>关联开票</TableHead>
                    <TableHead>置信度</TableHead>
                    <TableHead>金额差异</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMatches.map((match) => {
                    const transaction = transactions.find(t => t.id === match.bankTransactionId)
                    const invoice = invoices.find(inv => inv.id === match.invoiceId)
                    
                    return (
                      <TableRow key={match.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getMatchStatusIcon(match)}
                            <span className="text-sm">{getMatchStatusText(match)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {transaction && (
                            <div className="space-y-1">
                              <div className="font-medium">{transaction.counterpartyName}</div>
                              <div className="text-sm text-gray-600">
                                ¥{transaction.amount.toLocaleString()}
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {invoice && (
                            <div className="space-y-1">
                              <div className="font-medium">{invoice.contractName}</div>
                              <div className="text-sm text-gray-600">
                                ¥{invoice.invoiceAmount.toLocaleString()}
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={match.confidence} className="w-16" />
                            <span className="text-sm">{match.confidence}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={match.amountDifference > 0 ? 'text-red-600' : 'text-green-600'}>
                            ¥{match.amountDifference.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              match.status === 'confirmed' ? 'default' :
                              match.status === 'pending' ? 'secondary' : 'destructive'
                            }
                          >
                            {match.status === 'confirmed' ? '已确认' :
                             match.status === 'pending' ? '待审核' : '已拒绝'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {match.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedMatch(match)
                                setShowMatchDialog(true)
                              }}
                            >
                              审核
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 对账报告 */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>对账报告列表</CardTitle>
            </CardHeader>
            <CardContent>
              {reports.length > 0 ? (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold">{report.reportDate} 对账报告</h3>
                          <p className="text-sm text-gray-600">
                            生成时间: {new Date(report.generatedAt).toLocaleString()}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          下载
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">总流水数</div>
                          <div className="font-semibold">{report.totalTransactions}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">匹配成功率</div>
                          <div className="font-semibold">{report.matchSuccessRate.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-gray-600">总金额</div>
                          <div className="font-semibold">¥{report.totalAmount.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">异常流水</div>
                          <div className="font-semibold">{report.exceptionTransactions.length}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  暂无对账报告
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 导入银行流水对话框 */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>导入银行流水</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                请按照格式输入：交易日期,金额,对方户名,流水号,摘要
                <br />
                示例：2024-01-15,50000,北京科技有限公司,TX202401150001,转账收入
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="import-data">银行流水数据</Label>
              <Textarea
                id="import-data"
                placeholder="请粘贴CSV格式的银行流水数据..."
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                取消
              </Button>
              <Button onClick={handleImportTransactions} disabled={loading}>
                {loading ? '导入中...' : '导入'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 匹配审核对话框 */}
      <Dialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>审核匹配结果</DialogTitle>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>匹配信息</Label>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm space-y-1">
                    <div>匹配类型: {getMatchStatusText(selectedMatch)}</div>
                    <div>置信度: {selectedMatch.confidence}%</div>
                    <div>金额差异: ¥{selectedMatch.amountDifference.toLocaleString()}</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="review-comments">审核意见</Label>
                <Textarea
                  id="review-comments"
                  placeholder="请输入审核意见..."
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowMatchDialog(false)}>
                  取消
                </Button>
                <Button onClick={handleConfirmMatch} disabled={loading}>
                  {loading ? '确认中...' : '确认匹配'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 手动关联对话框 */}
      <Dialog open={showManualLinkDialog} onOpenChange={setShowManualLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>手动关联开票记录</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>银行流水信息</Label>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm space-y-1">
                    <div>对方户名: {selectedTransaction.counterpartyName}</div>
                    <div>金额: ¥{selectedTransaction.amount.toLocaleString()}</div>
                    <div>交易日期: {selectedTransaction.transactionDate}</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="select-invoice">选择开票记录</Label>
                <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择要关联的开票记录" />
                  </SelectTrigger>
                  <SelectContent>
                    {invoices
                      .filter(inv => inv.status === 'issued' || inv.status === 'pending_payment')
                      .map((invoice) => (
                        <SelectItem key={invoice.id} value={invoice.id}>
                          {invoice.contractName} - ¥{invoice.invoiceAmount.toLocaleString()}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="link-reason">关联原因</Label>
                <Textarea
                  id="link-reason"
                  placeholder="请说明手动关联的原因..."
                  value={linkReason}
                  onChange={(e) => setLinkReason(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowManualLinkDialog(false)}>
                  取消
                </Button>
                <Button onClick={handleManualLink} disabled={loading}>
                  {loading ? '关联中...' : '确认关联'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 