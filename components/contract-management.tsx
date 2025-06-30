"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Upload, 
  Download, 
  FileText, 
  Trash2,
  Search,
  Eye,
  FileSpreadsheet,
  Link as LinkIcon
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getProjects, type Project, getContracts, addContract, updateContract, deleteContract, bindProjectToContract, unbindProjectFromContract, type Contract } from "@/lib/data"

// 合同接口定义已移到 lib/data.ts 中
// interface Contract {
//   id: string
//   contractNumber: string
//   contractName: string
//   contractType: string
//   signDate: string
//   amount: number
//   supplier: string
//   department: string
//   status: string
//   excelFileName: string
//   uploadTime: string
//   uploader: string
//   boundProjectIds?: string[] // 绑定的项目ID列表
// }

interface ContractManagementProps {
  currentUser: {
    id: string
    name: string
    role: string
    department?: string
    center?: string
  }
}

export default function ContractManagement({ currentUser }: ContractManagementProps) {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  
  // 新增：项目绑定相关状态
  const [projects, setProjects] = useState<Project[]>([])
  const [isBindProjectDialogOpen, setIsBindProjectDialogOpen] = useState(false)
  const [contractToBindProject, setContractToBindProject] = useState<Contract | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")

  // 合同数据加载函数
  const loadContracts = async () => {
    try {
      setLoading(true)
      let contractsData = await getContracts()
        
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
        
      setContracts(contractsData || [])
    } catch (error) {
      console.error('加载合同数据失败:', error)
      alert('加载合同数据失败，请刷新页面重试')
    } finally {
      setLoading(false)
    }
  }

  // 加载合同数据
  useEffect(() => {
    loadContracts()
  }, [])

  // 监听数据初始化事件
  useEffect(() => {
    const handleDataInitialized = () => {
      console.log('收到数据初始化事件，清除本地缓存并重新加载数据...')
      // 先清除localStorage中的相关数据
      if (typeof window !== 'undefined') {
        localStorage.removeItem('contracts')
        localStorage.removeItem('projects')
      }
      // 重新加载项目和合同数据
      loadProjects()
      loadContracts()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('dataInitialized', handleDataInitialized)
      return () => {
        window.removeEventListener('dataInitialized', handleDataInitialized)
      }
    }
  }, [])

  // 项目数据加载函数
  const loadProjects = async () => {
    try {
      let allProjects = await getProjects()
      
      // 如果没有项目数据或者没有"下达"状态的项目，尝试初始化数据
      const deliveredProjects = allProjects.filter(project => project.status === "下达")
      if (deliveredProjects.length === 0) {
        console.log('没有找到状态为"下达"的项目，尝试初始化数据...')
        try {
          const response = await fetch('/api/initialize-data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
          
          if (response.ok) {
            const result = await response.json()
            console.log('项目数据初始化成功:', result)
            
            // 如果API返回了项目数据，使用返回的数据
            if (result.fullData && result.fullData.projects && result.fullData.projects.length > 0) {
              allProjects = result.fullData.projects
              console.log('使用API返回的项目数据:', allProjects)
            } else {
              // 重新获取项目数据
              allProjects = await getProjects()
              console.log('重新获取的项目数据:', allProjects)
            }
          }
        } catch (initError) {
          console.error('初始化项目数据失败:', initError)
        }
      }
      
      // 只获取状态为"下达"的项目
      const finalDeliveredProjects = allProjects.filter(project => project.status === "下达")
      setProjects(finalDeliveredProjects)
      console.log('最终加载的下达状态项目:', finalDeliveredProjects)
    } catch (error) {
      console.error('加载项目数据失败:', error)
    }
  }

  // 加载项目数据
  useEffect(() => {
    loadProjects()
  }, [])

  // 过滤合同
  const filteredContracts = contracts.filter(contract =>
    contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.contractName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.department.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 处理Excel文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const allowedTypes = ['.xls', '.xlsx']
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      
      if (!allowedTypes.includes(fileExtension)) {
        alert('请上传Excel格式的文件（.xls 或 .xlsx）')
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        alert('文件大小不能超过 10MB')
        return
      }

      setUploadingFile(file)
      setIsUploadDialogOpen(true)
    }
  }

  // 确认上传Excel文件
  const confirmUpload = async () => {
    if (!uploadingFile) return

    setIsUploading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const newContract: Omit<Contract, "id"> = {
        contractNumber: `HT-2024-${String(contracts.length + 1).padStart(3, '0')}`,
        contractName: "从Excel解析的合同名称",
        contractType: "采购合同",
        signDate: format(new Date(), "yyyy-MM-dd"),
        amount: 100000,
        supplier: "Excel中的供应商",
        department: currentUser.department || "默认部门",
        status: "待审批",
        excelFileName: uploadingFile.name,
        uploadTime: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        uploader: currentUser.name,
        boundProjectId: undefined
      }

      const addedContract = await addContract(newContract)
      setContracts(prev => [addedContract, ...prev])
      alert(`成功从Excel文件解析出合同信息！`)
      
      setIsUploadDialogOpen(false)
      setUploadingFile(null)
    } catch (error) {
      alert('Excel文件解析失败，请检查文件格式')
    } finally {
      setIsUploading(false)
    }
  }

  // 下载Excel模板
  const handleDownloadTemplate = () => {
    alert('合同Excel模板下载功能正在开发中...')
  }

  // 查看合同详情
  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract)
    setIsDetailDialogOpen(true)
  }

  // 删除合同
  const handleDeleteContract = async (contractId: string) => {
    try {
      const success = await deleteContract(contractId)
      if (success) {
        setContracts(prev => prev.filter(contract => contract.id !== contractId))
        alert('合同删除成功！')
      } else {
        alert('合同删除失败，请重试')
      }
    } catch (error) {
      alert('合同删除失败，请重试')
    }
  }

  // 新增：处理绑定项目
  const handleBindProject = (contract: Contract) => {
    setContractToBindProject(contract)
    setSelectedProjectId(contract.boundProjectId || "")
    setIsBindProjectDialogOpen(true)
  }

  // 新增：确认绑定项目
  const handleConfirmBindProject = async () => {
    if (!contractToBindProject || !selectedProjectId) return

    try {
      const success = await bindProjectToContract(contractToBindProject.id, selectedProjectId)
      if (success) {
        // 更新本地状态
        setContracts(prev => 
          prev.map(contract => 
            contract.id === contractToBindProject.id 
              ? { ...contract, boundProjectId: selectedProjectId }
              : contract
          )
        )
        
        const projectName = projects.find(p => p.id === selectedProjectId)?.name || "未知项目"
        alert(`成功为合同 "${contractToBindProject.contractName}" 绑定了项目 "${projectName}"！`)
        setIsBindProjectDialogOpen(false)
        setContractToBindProject(null)
        setSelectedProjectId("")
      } else {
        alert('绑定项目失败，请重试')
      }
    } catch (error) {
      alert('绑定项目失败，请重试')
    }
  }

  // 新增：处理解绑项目
  const handleUnbindProject = async (contract: Contract) => {
    try {
      const success = await unbindProjectFromContract(contract.id)
      if (success) {
        // 更新本地状态
        setContracts(prev => 
          prev.map(c => 
            c.id === contract.id 
              ? { ...c, boundProjectId: undefined }
              : c
          )
        )
        
        alert(`成功解绑合同 "${contract.contractName}" 的项目绑定！`)
      } else {
        alert('解绑项目失败，请重试')
      }
    } catch (error) {
      alert('解绑项目失败，请重试')
    }
  }

  // 新增：获取绑定项目状态
  const getBoundProjectStatus = (boundProjectId?: string): string => {
    if (!boundProjectId) {
      return "未绑定"
    }
    
    // 检查是否有绑定的项目（只考虑状态为"下达"的项目）
    const boundProject = projects.find(project => 
      project.id === boundProjectId && project.status === "下达"
    )
    
    if (boundProject) {
      return "已绑定"
    } else {
      return "未绑定"
    }
  }

  // 新增：获取绑定项目名称
  const getBoundProjectNames = (boundProjectId?: string): string => {
    if (!boundProjectId) {
      return "无"
    }
    
    const boundProject = projects.find(project => project.id === boundProjectId)
    if (!boundProject) {
      return "无"
    }
    
    return boundProject.name
  }

  // 格式化金额
  const formatAmount = (amount: number): string => {
    return `¥${amount.toLocaleString()}`
  }

  // 获取状态样式
  const getStatusBadge = (status: string) => {
    switch (status) {
      case '已绑定':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{status}</Badge>
      case '未绑定':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{status}</Badge>
      // 保留原有状态样式（用于合同详情对话框）
      case '已签署':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{status}</Badge>
      case '执行中':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{status}</Badge>
      case '待审批':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{status}</Badge>
      case '已完成':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{status}</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{status}</Badge>
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">合同管理</h2>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={handleDownloadTemplate}
            className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700"
          >
            <Download className="mr-2 h-4 w-4" />
            下载Excel模板
          </Button>
          
          <div className="relative">
            <Input
              type="file"
              accept=".xls,.xlsx"
              onChange={handleFileUpload}
              className="sr-only"
              id="excel-upload"
            />
            <Button 
              onClick={() => document.getElementById('excel-upload')?.click()}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Upload className="mr-2 h-4 w-4" />
                              上传合同
            </Button>
          </div>
        </div>
      </div>

      {/* 搜索区域 */}
      <div className="mb-6 flex gap-4 items-end flex-shrink-0">
        <div className="w-[300px]">
          <Label className="block text-sm font-medium text-gray-700 mb-1">
            搜索合同
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 z-10" />
            <Input
              placeholder="搜索合同编号、名称、供应商或部门"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* 合同列表 */}
      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 w-full">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="h-12 bg-gray-50">
                <TableHead className="text-center text-sm font-semibold text-gray-700 px-3 py-3 w-[120px] align-middle">
                  合同编号
                </TableHead>
                <TableHead className="text-center text-sm font-semibold text-gray-700 px-3 py-3 w-[180px] align-middle">
                  合同名称
                </TableHead>
                <TableHead className="text-center text-sm font-semibold text-gray-700 px-3 py-3 w-[100px] align-middle">
                  合同类型
                </TableHead>
                <TableHead className="text-center text-sm font-semibold text-gray-700 px-3 py-3 w-[100px] align-middle">
                  签署日期
                </TableHead>
                <TableHead className="text-center text-sm font-semibold text-gray-700 px-3 py-3 w-[110px] align-middle">
                  合同金额
                </TableHead>
                <TableHead className="text-center text-sm font-semibold text-gray-700 px-3 py-3 w-[120px] align-middle">
                  供应商
                </TableHead>
                <TableHead className="text-center text-sm font-semibold text-gray-700 px-3 py-3 w-[90px] align-middle">
                  责任部门
                </TableHead>
                <TableHead className="text-center text-sm font-semibold text-gray-700 px-3 py-3 w-[80px] align-middle">
                  状态
                </TableHead>
                <TableHead className="text-center text-sm font-semibold text-gray-700 px-3 py-3 w-[150px] align-middle">
                  绑定项目
                </TableHead>
                <TableHead className="text-center text-sm font-semibold text-gray-700 px-3 py-3 w-[150px] align-middle">
                  操作
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-gray-500 py-12">
                    <div className="flex flex-col items-center space-y-2">
                      <FileSpreadsheet className="h-12 w-12 text-gray-300" />
                      <p className="text-lg">暂无合同数据</p>
                      <p className="text-sm text-gray-400">请点击"上传合同"按钮上传合同信息</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredContracts.map((contract, index) => (
                  <TableRow key={contract.id} className={`h-14 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                    <TableCell className="text-center px-3 py-2 align-middle">
                      <span className="font-mono text-sm font-medium text-blue-600">{contract.contractNumber}</span>
                    </TableCell>
                    <TableCell className="text-center px-3 py-2 align-middle">
                      <div className="font-medium text-gray-900 text-sm leading-5" title={contract.contractName}>
                        {contract.contractName}
                      </div>
                    </TableCell>
                    <TableCell className="text-center px-3 py-2 align-middle">
                      <span className="text-sm text-gray-700">{contract.contractType}</span>
                    </TableCell>
                    <TableCell className="text-center px-3 py-2 align-middle">
                      <span className="text-sm text-gray-600">{contract.signDate}</span>
                    </TableCell>
                    <TableCell className="text-center px-3 py-2 align-middle">
                      <span className="font-semibold text-green-600 text-sm">{formatAmount(contract.amount)}</span>
                    </TableCell>
                    <TableCell className="text-center px-3 py-2 align-middle">
                      <div className="text-sm text-gray-700 truncate" title={contract.supplier}>
                        {contract.supplier}
                      </div>
                    </TableCell>
                    <TableCell className="text-center px-3 py-2 align-middle">
                      <span className="text-sm text-gray-700">{contract.department}</span>
                    </TableCell>
                    <TableCell className="text-center px-3 py-2 align-middle">
                      {getStatusBadge(getBoundProjectStatus(contract.boundProjectId))}
                    </TableCell>
                    <TableCell className="text-center px-3 py-2 align-middle">
                                      <div className="text-sm text-gray-700 truncate max-w-[150px]" title={getBoundProjectNames(contract.boundProjectId)}>
                  {getBoundProjectNames(contract.boundProjectId)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center px-3 py-2 align-middle">
                      <div className="flex justify-center space-x-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewContract(contract)}
                          className="h-7 px-2 text-xs text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          详情
                        </Button>
                        {getBoundProjectStatus(contract.boundProjectId) === "已绑定" ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 px-2 text-xs text-red-600 border-red-600 hover:bg-red-50"
                              >
                                <LinkIcon className="h-3 w-3 mr-1" />
                                解绑
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>确认解绑项目</AlertDialogTitle>
                                <AlertDialogDescription>
                                  确定要解绑合同 "{contract.contractName}" 与项目 "{getBoundProjectNames(contract.boundProjectId)}" 的绑定关系吗？此操作不可撤销。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleUnbindProject(contract)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  确认解绑
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleBindProject(contract)}
                            className="h-7 px-2 text-xs text-orange-600 border-orange-600 hover:bg-orange-50"
                          >
                            <LinkIcon className="h-3 w-3 mr-1" />
                            绑定
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-7 px-2 text-xs text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              删除
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>确认删除</AlertDialogTitle>
                              <AlertDialogDescription>
                                确定要删除合同 "{contract.contractName}" 吗？此操作不可撤销。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteContract(contract.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                删除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* 上传确认对话框 */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认上传Excel文件</DialogTitle>
            <DialogDescription>
              请确认要上传以下Excel文件，系统将自动解析其中的合同信息：
            </DialogDescription>
          </DialogHeader>
          {uploadingFile && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileSpreadsheet className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium">{uploadingFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(uploadingFile.size / (1024 * 1024)).toFixed(2)} MB • Excel文件
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                上传人：{currentUser.name}
              </p>
              <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                <strong>注意：</strong>请确保Excel文件包含完整的合同信息（合同编号、名称、类型、签署日期、金额、供应商等）
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsUploadDialogOpen(false)}
              disabled={isUploading}
            >
              取消
            </Button>
            <Button 
              onClick={confirmUpload}
              disabled={isUploading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUploading ? "解析中..." : "确认上传"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 合同详情对话框 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>合同详情</DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">合同编号</Label>
                  <p className="mt-1 text-sm text-blue-600 font-medium">{selectedContract.contractNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">合同状态</Label>
                  <div className="mt-1">{getStatusBadge(selectedContract.status)}</div>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-700">合同名称</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedContract.contractName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">合同类型</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedContract.contractType}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">签署日期</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedContract.signDate}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">合同金额</Label>
                  <p className="mt-1 text-sm font-medium text-green-600">{formatAmount(selectedContract.amount)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">供应商</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedContract.supplier}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">责任部门</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedContract.department}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Excel文件名</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedContract.excelFileName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">上传时间</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedContract.uploadTime}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">上传人</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedContract.uploader}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-700">绑定项目</Label>
                  {selectedContract.boundProjectId ? (
                    <div className="mt-1">
                      {(() => {
                        const project = projects.find(p => p.id === selectedContract.boundProjectId)
                        return project ? (
                          <div className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {project.name} ({project.center || project.department})
                          </div>
                        ) : null
                      })()}
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">未绑定项目</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 绑定项目对话框 */}
      <Dialog open={isBindProjectDialogOpen} onOpenChange={setIsBindProjectDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>绑定项目</DialogTitle>
            <DialogDescription>
              为合同 "{contractToBindProject?.contractName}" 绑定状态为"下达"的项目。一个合同只能绑定一个项目。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                可绑定项目列表 (状态为"下达"的项目)
              </Label>
              {projects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>暂无状态为"下达"的项目可供绑定</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] border rounded-md">
                  <div className="p-4 space-y-2">
                    {projects.map((project) => (
                      <div key={project.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                        <input
                          type="radio"
                          name="selectedProject"
                          id={`project-${project.id}`}
                          checked={selectedProjectId === project.id}
                          onChange={() => setSelectedProjectId(project.id)}
                          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <label 
                            htmlFor={`project-${project.id}`}
                            className="block text-sm font-medium text-gray-900 cursor-pointer"
                          >
                            {project.name}
                          </label>
                          <div className="mt-1 text-xs text-gray-500 space-y-1">
                            <p>归属：{project.center || project.department}</p>
                            <p>负责人：{project.owner}</p>
                            <p>项目类型：{project.projectType || "未设置"}</p>
                            {project.description && (
                              <p className="truncate" title={project.description}>
                                描述：{project.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          {project.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
            
            {selectedProjectId && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  已选择项目：
                </p>
                <div className="mt-2">
                  {(() => {
                    const project = projects.find(p => p.id === selectedProjectId)
                    return project ? (
                      <Badge variant="secondary" className="text-xs">
                        {project.name}
                      </Badge>
                    ) : null
                  })()}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsBindProjectDialogOpen(false)
                setContractToBindProject(null)
                setSelectedProjectId("")
              }}
            >
              取消
            </Button>
            <Button 
              onClick={handleConfirmBindProject}
              className="bg-orange-600 hover:bg-orange-700"
            >
              确认绑定{selectedProjectId ? " (1)" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 