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
import { Plus, Search, FileText, Upload, Eye, CheckCircle, XCircle, Clock, DollarSign, AlertTriangle } from 'lucide-react'
import { useIsMobile } from "@/components/ui/use-mobile"
import { cn } from "@/lib/utils"
import { 
  User, 
  Contract, 
  ProgressReimbursement, 
  PermissionMatrix,
  Project,
  getContracts, 
  getProgressReimbursements,
  addProgressReimbursement,
  updateProgressReimbursement,
  approveProgressReimbursement,
  checkUserPermission,
  getProgressReimbursementsByContract,
  getProjects
} from '@/lib/data'

interface ProgressReimbursementManagementProps {
  currentUser: User
}

export default function ProgressReimbursementManagement({ currentUser }: ProgressReimbursementManagementProps) {
  const isMobile = useIsMobile()
  
  // 状态管理
  const [contracts, setContracts] = useState<Contract[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [reimbursements, setReimbursements] = useState<ProgressReimbursement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  // 新增/编辑对话框状态
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [formData, setFormData] = useState({
    progressType: 'percentage' as 'milestone' | 'percentage',
    milestoneDescription: '',
    completionPercentage: 0,
    reimbursementType: 'travel' as 'travel' | 'material' | 'outsourcing',
    reimbursementAmount: 0,
    reimbursementDescription: '',
    acceptanceCertificate: '',
    invoiceFiles: [] as string[],
    purchaseOrderFiles: [] as string[],
    serviceContractFiles: [] as string[]
  })
  
  // 详情查看对话框状态
  const [viewingReimbursement, setViewingReimbursement] = useState<ProgressReimbursement | null>(null)
  
  // 审批对话框状态
  const [approvingReimbursement, setApprovingReimbursement] = useState<ProgressReimbursement | null>(null)
  const [approvalComment, setApprovalComment] = useState('')
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false)

  // 权限检查
  const canCreateReimbursement = checkUserPermission(currentUser, PermissionMatrix.CREATE_PROGRESS_REIMBURSEMENT)
  const canApproveDept = checkUserPermission(currentUser, PermissionMatrix.APPROVE_REIMBURSEMENT_DEPT)
  const canApproveFinance = checkUserPermission(currentUser, PermissionMatrix.APPROVE_REIMBURSEMENT_FINANCE)

  // 判断合同是否已绑定项目（只有绑定了状态为"下达"的项目才算已绑定）
  const isContractBound = (contract: Contract): boolean => {
    if (!contract.boundProjectId) {
      return false
    }
    
    // 检查是否有绑定的项目且项目状态为"下达"
    const boundProject = projects.find(project => 
      project.id === contract.boundProjectId && project.status === "下达"
    )
    
    return !!boundProject
  }

  // 加载数据
  useEffect(() => {
    fetchData()
  }, [])

  // 监听数据初始化事件
  useEffect(() => {
    const handleDataInitialized = () => {
      console.log('进度报销管理：收到数据初始化事件，重新加载数据...')
      fetchData()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('dataInitialized', handleDataInitialized)
      return () => {
        window.removeEventListener('dataInitialized', handleDataInitialized)
      }
    }
  }, [])


  const fetchData = async () => {
    setLoading(true)
    try {
      console.log('开始获取数据...')
      
      // 加载项目数据
      const projectsData = await getProjects(currentUser)
      setProjects(projectsData)
      
      // 先检查localStorage中的数据
      const localStorageContracts = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('contracts') || '[]') : []
      console.log('localStorage中的合同数据:', localStorageContracts)
      
      let contractsData = await getContracts()
      console.log('getContracts()返回的数据:', contractsData)
      
      // 如果客户端localStorage中没有合同数据，尝试从服务器初始化
      if (!contractsData || contractsData.length === 0) {
        console.log('客户端没有合同数据，尝试从服务器初始化...')
        try {
          const response = await fetch('/api/initialize-data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
          
          if (response.ok) {
            const result = await response.json()
            console.log('服务器数据初始化成功:', result)
            
            // 如果API返回了合同数据，直接使用并同步到localStorage
            if (result.fullData && result.fullData.contracts && result.fullData.contracts.length > 0) {
              contractsData = result.fullData.contracts
              // 同步到localStorage
              if (typeof window !== 'undefined') {
                localStorage.setItem('contracts', JSON.stringify(result.fullData.contracts))
              }
              console.log('合同数据已同步到客户端:', contractsData)
            } else {
              // 重新获取合同数据
              contractsData = await getContracts()
              console.log('重新获取的合同数据:', contractsData)
            }
          } else {
            console.error('服务器数据初始化失败')
          }
        } catch (initError) {
          console.error('初始化数据请求失败:', initError)
        }
      }
      
      const reimbursementsData = await getProgressReimbursements()
      console.log('getProgressReimbursements()返回的数据:', reimbursementsData)
      
      setContracts(contractsData || [])
      setReimbursements(reimbursementsData)
      
      // 详细的调试信息
      console.log('进度报销数据加载完成:', {
        localStorage合同数量: localStorageContracts.length,
        合同数量: contractsData ? contractsData.length : 0,
        合同详情: contractsData ? contractsData.map(c => ({
          id: c.id,
          编号: c.contractNumber,
          名称: c.contractName,
          状态: c.status,
          金额: c.amount
        })) : [],
        已绑定合同数量: contractsData ? contractsData.filter(c => c.status === '已绑定').length : 0,
        已绑定合同详情: contractsData ? contractsData.filter(c => c.status === '已绑定').map(c => ({
          id: c.id,
          编号: c.contractNumber,
          名称: c.contractName
        })) : [],
        进度报销数量: reimbursementsData.length,
        当前用户: currentUser.name,
        用户角色: currentUser.role,
        权限检查: {
          创建进度报销: canCreateReimbursement,
          部门审批: canApproveDept,
          财务审批: canApproveFinance
        }
      })
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 过滤数据
  const filteredReimbursements = useMemo(() => {
    return reimbursements.filter(reimbursement => {
      const searchMatch = !searchTerm || 
        reimbursement.contractName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reimbursement.contractCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reimbursement.submittedBy.toLowerCase().includes(searchTerm.toLowerCase())
      
      const statusMatch = statusFilter === "all" || reimbursement.status === statusFilter
      
      return searchMatch && statusMatch
    })
  }, [reimbursements, searchTerm, statusFilter])

  // 获取状态显示
  const getStatusBadge = (status: ProgressReimbursement['status']) => {
    const statusConfig = {
      draft: { label: '草稿', className: 'bg-gray-100 text-gray-800' },
      submitted: { label: '已提交', className: 'bg-blue-100 text-blue-800' },
      dept_manager_approved: { label: '部门审批通过', className: 'bg-green-100 text-green-800' },
      finance_approved: { label: '财务审批通过', className: 'bg-purple-100 text-purple-800' },
      paid: { label: '已支付', className: 'bg-emerald-100 text-emerald-800' },
      rejected: { label: '已驳回', className: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status]
    return <Badge className={`${config.className} hover:${config.className}`}>{config.label}</Badge>
  }

  // 获取进度类型显示
  const getProgressTypeLabel = (type: 'milestone' | 'percentage') => {
    return type === 'milestone' ? '里程碑完成' : '百分比完成'
  }

  // 获取报销类型显示
  const getReimbursementTypeLabel = (type: 'travel' | 'material' | 'outsourcing') => {
    const types = {
      travel: '差旅费',
      material: '材料费',
      outsourcing: '外包服务费'
    }
    return types[type]
  }

  // 计算应付金额
  const calculatePayableAmount = (contractAmount: number, percentage: number) => {
    return contractAmount * (percentage / 100)
  }

  // 处理新增进度报销
  const handleCreateReimbursement = () => {
    if (!canCreateReimbursement) {
      alert('您没有权限创建进度报销')
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
        progressType: 'percentage',
        milestoneDescription: '',
        completionPercentage: 0,
        reimbursementType: 'travel',
        reimbursementAmount: 0,
        reimbursementDescription: '',
        acceptanceCertificate: '',
        invoiceFiles: [],
        purchaseOrderFiles: [],
        serviceContractFiles: []
      })
    }
  }

  // 处理表单提交
  const handleSubmitReimbursement = async () => {
    if (!selectedContract) {
      alert('请选择合同')
      return
    }

    // 验证必填字段
    if (formData.progressType === 'milestone' && !formData.milestoneDescription) {
      alert('请填写里程碑描述')
      return
    }

    if (formData.progressType === 'percentage' && (formData.completionPercentage <= 0 || formData.completionPercentage > 100)) {
      alert('请填写有效的完成百分比（1-100）')
      return
    }

    if (!formData.reimbursementDescription) {
      alert('请填写报销说明')
      return
    }

    // 计算应付金额
    const payableAmount = formData.progressType === 'percentage' 
      ? calculatePayableAmount(selectedContract.amount, formData.completionPercentage)
      : selectedContract.amount // 里程碑完成假设为全额

    // 验证报销金额
    if (formData.reimbursementAmount <= 0) {
      alert('请填写有效的报销金额')
      return
    }

    if (formData.reimbursementAmount > payableAmount) {
      alert(`报销金额不能超过应付金额 ${payableAmount.toLocaleString()} 元`)
      return
    }

    try {
      const reimbursementData: Omit<ProgressReimbursement, 'id' | 'createdAt' | 'updatedAt'> = {
        contractId: selectedContract.id,
        contractCode: selectedContract.contractNumber,
        contractName: selectedContract.contractName,
        contractAmount: selectedContract.amount,
        progressType: formData.progressType,
        milestoneDescription: formData.progressType === 'milestone' ? formData.milestoneDescription : undefined,
        completionPercentage: formData.progressType === 'percentage' ? formData.completionPercentage : undefined,
        payableAmount,
        reimbursementType: formData.reimbursementType,
        reimbursementAmount: formData.reimbursementAmount,
        reimbursementDescription: formData.reimbursementDescription,
        acceptanceCertificate: formData.acceptanceCertificate || undefined,
        invoiceFiles: formData.invoiceFiles.length > 0 ? formData.invoiceFiles : undefined,
        purchaseOrderFiles: formData.purchaseOrderFiles.length > 0 ? formData.purchaseOrderFiles : undefined,
        serviceContractFiles: formData.serviceContractFiles.length > 0 ? formData.serviceContractFiles : undefined,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        submittedBy: currentUser.name
      }

      await addProgressReimbursement(reimbursementData, currentUser.id, currentUser.name)
      
      alert('进度报销提交成功')
      setIsCreateDialogOpen(false)
      setSelectedContract(null)
      await fetchData()
    } catch (error) {
      console.error('提交失败:', error)
      alert('提交失败，请重试')
    }
  }

  // 处理审批
  const handleApproval = async (approved: boolean) => {
    if (!approvingReimbursement) return

    try {
      const approverType = canApproveFinance ? 'finance' : 'dept_manager'
      
      await approveProgressReimbursement(
        approvingReimbursement.id,
        approved,
        approverType,
        currentUser.id,
        currentUser.name,
        approvalComment
      )

      alert(`${approved ? '审批通过' : '审批驳回'}成功`)
      setIsApprovalDialogOpen(false)
      setApprovingReimbursement(null)
      setApprovalComment('')
      await fetchData()
    } catch (error) {
      console.error('审批失败:', error)
      alert('审批失败，请重试')
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
        <div className="flex items-center">
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">进度报销管理</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">管理合同进度报销和审批流程</p>
          </div>
        </div>
        <div className="flex flex-row gap-2 sm:gap-3">
          {canCreateReimbursement && (
            <Button 
              onClick={handleCreateReimbursement} 
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-sm"
            >
              <Plus className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">新增进度报销</span>
              <span className="sm:hidden">新增</span>
            </Button>
          )}
        </div>
      </div>

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
                  placeholder="搜索合同名称、合同编号或提交人..."
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
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="submitted">已提交</SelectItem>
                  <SelectItem value="dept_manager_approved">部门审批通过</SelectItem>
                  <SelectItem value="finance_approved">财务审批通过</SelectItem>
                  <SelectItem value="paid">已支付</SelectItem>
                  <SelectItem value="rejected">已驳回</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 进度报销列表 */}
      <Card>
        <CardHeader>
          <CardTitle>进度报销列表</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 桌面端表格 */}
          <div className="hidden md:block">
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>合同编号</TableHead>
                    <TableHead>合同名称</TableHead>
                    <TableHead>进度类型</TableHead>
                    <TableHead>报销类型</TableHead>
                    <TableHead>报销金额</TableHead>
                    <TableHead>提交人</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReimbursements.map((reimbursement) => (
                    <TableRow key={reimbursement.id}>
                      <TableCell className="font-medium">{reimbursement.contractCode}</TableCell>
                      <TableCell>{reimbursement.contractName}</TableCell>
                      <TableCell>{getProgressTypeLabel(reimbursement.progressType)}</TableCell>
                      <TableCell>{getReimbursementTypeLabel(reimbursement.reimbursementType)}</TableCell>
                      <TableCell>¥{reimbursement.reimbursementAmount.toLocaleString()}</TableCell>
                      <TableCell>{reimbursement.submittedBy}</TableCell>
                      <TableCell>{getStatusBadge(reimbursement.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingReimbursement(reimbursement)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(reimbursement.status === 'submitted' && canApproveDept) || 
                           (reimbursement.status === 'dept_manager_approved' && canApproveFinance) ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setApprovingReimbursement(reimbursement)
                                setIsApprovalDialogOpen(true)
                              }}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          ) : null}
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
            {filteredReimbursements.map((reimbursement) => (
              <Card key={reimbursement.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* 头部信息 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-lg">
                          ¥{reimbursement.reimbursementAmount.toLocaleString()}
                        </span>
                      </div>
                      {getStatusBadge(reimbursement.status)}
                    </div>

                    {/* 合同信息 */}
                    <div className="space-y-2">
                      <div>
                        <div className="font-medium">{reimbursement.contractName}</div>
                        <div className="text-sm text-gray-500 font-mono">
                          {reimbursement.contractCode}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span>{getProgressTypeLabel(reimbursement.progressType)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>{getReimbursementTypeLabel(reimbursement.reimbursementType)}</span>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600">
                        提交人: {reimbursement.submittedBy}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingReimbursement(reimbursement)}
                        className="flex-1"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        查看详情
                      </Button>
                      {(reimbursement.status === 'submitted' && canApproveDept) || 
                       (reimbursement.status === 'dept_manager_approved' && canApproveFinance) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setApprovingReimbursement(reimbursement)
                            setIsApprovalDialogOpen(true)
                          }}
                          className="flex-1"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          审批
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredReimbursements.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                暂无进度报销数据
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 新增进度报销对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增进度报销</DialogTitle>
            <DialogDescription>
              填写进度信息和报销详情，系统将自动计算应付金额
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 合同选择 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>选择合同 *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    当前合同数量: {contracts.length} | 已绑定项目: {contracts.filter(isContractBound).length}
                  </span>
                </div>
              </div>
              <Select value={selectedContract?.id || ''} onValueChange={handleContractSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择合同" />
                </SelectTrigger>
                <SelectContent>
                  {contracts.filter(isContractBound).length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">
                      没有找到已绑定项目的合同数据
                    </div>
                  ) : (
                    contracts.filter(isContractBound).map(contract => (
                      <SelectItem key={contract.id} value={contract.id}>
                        {contract.contractNumber} - {contract.contractName} (¥{contract.amount.toLocaleString()})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedContract && (
              <Tabs defaultValue="progress" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="progress">进度信息</TabsTrigger>
                  <TabsTrigger value="reimbursement">报销信息</TabsTrigger>
                  <TabsTrigger value="attachments">附件上传</TabsTrigger>
                </TabsList>
                
                <TabsContent value="progress" className="space-y-4">
                  <div className="space-y-2">
                    <Label>进度类型 *</Label>
                    <Select 
                      value={formData.progressType} 
                      onValueChange={(value: 'milestone' | 'percentage') => 
                        setFormData(prev => ({ ...prev, progressType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="milestone">里程碑完成</SelectItem>
                        <SelectItem value="percentage">百分比完成</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.progressType === 'milestone' ? (
                    <div className="space-y-2">
                      <Label>里程碑描述 *</Label>
                      <Textarea
                        placeholder="请描述完成的里程碑内容..."
                        value={formData.milestoneDescription}
                        onChange={(e) => setFormData(prev => ({ ...prev, milestoneDescription: e.target.value }))}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>完成百分比 * (1-100)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="请输入完成百分比"
                        value={formData.completionPercentage || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          completionPercentage: parseInt(e.target.value) || 0 
                        }))}
                      />
                      {formData.completionPercentage > 0 && (
                        <p className="text-sm text-gray-600">
                          应付金额: ¥{calculatePayableAmount(selectedContract.amount, formData.completionPercentage).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="reimbursement" className="space-y-4">
                  <div className="space-y-2">
                    <Label>报销类型 *</Label>
                    <Select 
                      value={formData.reimbursementType} 
                      onValueChange={(value: 'travel' | 'material' | 'outsourcing') => 
                        setFormData(prev => ({ ...prev, reimbursementType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="travel">差旅费</SelectItem>
                        <SelectItem value="material">材料费</SelectItem>
                        <SelectItem value="outsourcing">外包服务费</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>报销金额 * (元)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="请输入报销金额"
                      value={formData.reimbursementAmount || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        reimbursementAmount: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>报销说明 *</Label>
                    <Textarea
                      placeholder="请详细说明报销用途和明细..."
                      value={formData.reimbursementDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, reimbursementDescription: e.target.value }))}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="attachments" className="space-y-4">
                  {formData.progressType === 'milestone' && (
                    <div className="space-y-2">
                      <Label>验收证明</Label>
                      <Input
                        placeholder="验收证明文件名"
                        value={formData.acceptanceCertificate}
                        onChange={(e) => setFormData(prev => ({ ...prev, acceptanceCertificate: e.target.value }))}
                      />
                    </div>
                  )}

                  {formData.reimbursementType === 'travel' && (
                    <div className="space-y-2">
                      <Label>发票文件 (车票/住宿发票)</Label>
                      <Input
                        placeholder="发票文件名，多个文件用逗号分隔"
                        value={formData.invoiceFiles.join(', ')}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          invoiceFiles: e.target.value.split(',').map(f => f.trim()).filter(f => f) 
                        }))}
                      />
                    </div>
                  )}

                  {formData.reimbursementType === 'material' && (
                    <div className="space-y-2">
                      <Label>采购订单文件</Label>
                      <Input
                        placeholder="采购订单文件名，多个文件用逗号分隔"
                        value={formData.purchaseOrderFiles.join(', ')}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          purchaseOrderFiles: e.target.value.split(',').map(f => f.trim()).filter(f => f) 
                        }))}
                      />
                    </div>
                  )}

                  {formData.reimbursementType === 'outsourcing' && (
                    <div className="space-y-2">
                      <Label>服务合同文件</Label>
                      <Input
                        placeholder="服务合同文件名，多个文件用逗号分隔"
                        value={formData.serviceContractFiles.join(', ')}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          serviceContractFiles: e.target.value.split(',').map(f => f.trim()).filter(f => f) 
                        }))}
                      />
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
            <Button onClick={handleSubmitReimbursement} disabled={!selectedContract}>
              提交报销
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 详情查看对话框 */}
      {viewingReimbursement && (
        <Dialog open={!!viewingReimbursement} onOpenChange={() => setViewingReimbursement(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>进度报销详情</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">合同编号</Label>
                  <p className="mt-1">{viewingReimbursement.contractCode}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">合同名称</Label>
                  <p className="mt-1">{viewingReimbursement.contractName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">合同金额</Label>
                  <p className="mt-1">¥{viewingReimbursement.contractAmount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">状态</Label>
                  <p className="mt-1">{getStatusBadge(viewingReimbursement.status)}</p>
                </div>
              </div>

              {/* 进度信息 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">进度信息</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">进度类型</Label>
                    <p className="mt-1">{getProgressTypeLabel(viewingReimbursement.progressType)}</p>
                  </div>
                  {viewingReimbursement.progressType === 'milestone' ? (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">里程碑描述</Label>
                      <p className="mt-1">{viewingReimbursement.milestoneDescription}</p>
                    </div>
                  ) : (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">完成百分比</Label>
                      <p className="mt-1">{viewingReimbursement.completionPercentage}%</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-gray-500">应付金额</Label>
                    <p className="mt-1 text-green-600 font-medium">¥{viewingReimbursement.payableAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* 报销信息 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">报销信息</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">报销类型</Label>
                    <p className="mt-1">{getReimbursementTypeLabel(viewingReimbursement.reimbursementType)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">报销金额</Label>
                    <p className="mt-1 text-blue-600 font-medium">¥{viewingReimbursement.reimbursementAmount.toLocaleString()}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-gray-500">报销说明</Label>
                    <p className="mt-1">{viewingReimbursement.reimbursementDescription}</p>
                  </div>
                </div>
              </div>

              {/* 审批信息 */}
              {(viewingReimbursement.deptManagerApprovalAt || viewingReimbursement.financeApprovalAt) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">审批信息</h3>
                  {viewingReimbursement.deptManagerApprovalAt && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-500">部门审批</Label>
                      <div className="text-sm">
                        <p>审批人: {viewingReimbursement.deptManagerApprovalBy}</p>
                        <p>审批时间: {new Date(viewingReimbursement.deptManagerApprovalAt).toLocaleString()}</p>
                        {viewingReimbursement.deptManagerComment && (
                          <p>审批意见: {viewingReimbursement.deptManagerComment}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {viewingReimbursement.financeApprovalAt && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-500">财务审批</Label>
                      <div className="text-sm">
                        <p>审批人: {viewingReimbursement.financeApprovalBy}</p>
                        <p>审批时间: {new Date(viewingReimbursement.financeApprovalAt).toLocaleString()}</p>
                        {viewingReimbursement.financeComment && (
                          <p>审批意见: {viewingReimbursement.financeComment}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingReimbursement(null)}>
                关闭
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 审批对话框 */}
      <AlertDialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>审批进度报销</AlertDialogTitle>
            <AlertDialogDescription>
              {approvingReimbursement && (
                <div className="space-y-2">
                  <p>合同: {approvingReimbursement.contractName}</p>
                  <p>报销金额: ¥{approvingReimbursement.reimbursementAmount.toLocaleString()}</p>
                  <div className="mt-4">
                    <Label>审批意见</Label>
                    <Textarea
                      placeholder="请填写审批意见..."
                      value={approvalComment}
                      onChange={(e) => setApprovalComment(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsApprovalDialogOpen(false)
              setApprovingReimbursement(null)
              setApprovalComment('')
            }}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleApproval(false)}
              className="bg-red-600 hover:bg-red-700"
            >
              驳回
            </AlertDialogAction>
            <AlertDialogAction onClick={() => handleApproval(true)}>
              通过
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 