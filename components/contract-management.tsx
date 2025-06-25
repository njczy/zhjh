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
  FileSpreadsheet
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

// 合同接口定义
interface Contract {
  id: string
  contractNumber: string
  contractName: string
  contractType: string
  signDate: string
  amount: number
  supplier: string
  department: string
  status: string
  excelFileName: string
  uploadTime: string
  uploader: string
}

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

  // 模拟数据
  useEffect(() => {
    const mockContracts: Contract[] = [
      {
        id: "1",
        contractNumber: "HT-2024-001",
        contractName: "办公设备采购合同",
        contractType: "采购合同",
        signDate: "2024-01-15",
        amount: 150000,
        supplier: "北京科技有限公司",
        department: "行政部",
        status: "已签署",
        excelFileName: "办公设备采购合同清单.xlsx",
        uploadTime: "2024-01-15 10:30:00",
        uploader: "张三"
      },
      {
        id: "2",
        contractNumber: "HT-2024-002", 
        contractName: "软件服务合同",
        contractType: "服务合同",
        signDate: "2024-01-10",
        amount: 200000,
        supplier: "上海软件科技公司",
        department: "信息部",
        status: "执行中",
        excelFileName: "软件服务合同清单.xlsx",
        uploadTime: "2024-01-10 14:20:00",
        uploader: "李四"
      }
    ]
    setContracts(mockContracts)
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
      
      const newContracts: Contract[] = [
        {
          id: Date.now().toString(),
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
          uploader: currentUser.name
        }
      ]

      setContracts(prev => [...newContracts, ...prev])
      alert(`成功从Excel文件解析出 ${newContracts.length} 个合同！`)
      
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
      setContracts(prev => prev.filter(contract => contract.id !== contractId))
      alert('合同删除成功！')
    } catch (error) {
      alert('合同删除失败，请重试')
    }
  }

  // 格式化金额
  const formatAmount = (amount: number): string => {
    return `¥${amount.toLocaleString()}`
  }

  // 获取状态样式
  const getStatusBadge = (status: string) => {
    switch (status) {
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
              上传合同Excel
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
                <TableHead className="text-center text-sm font-semibold text-gray-700 px-3 py-3 w-[120px] align-middle">
                  操作
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-gray-500 py-12">
                    <div className="flex flex-col items-center space-y-2">
                      <FileSpreadsheet className="h-12 w-12 text-gray-300" />
                      <p className="text-lg">暂无合同数据</p>
                      <p className="text-sm text-gray-400">请点击"上传合同Excel"按钮上传合同信息</p>
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
                      {getStatusBadge(contract.status)}
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
    </div>
  )
} 