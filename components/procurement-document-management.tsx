"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Upload, 
  Download, 
  FileText, 
  Trash2,
  Search,
  Calendar
} from "lucide-react"
import { useIsMobile } from "@/components/ui/use-mobile"
import { cn } from "@/lib/utils"
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

// 采购文件接口定义
interface ProcurementDocument {
  id: string
  fileName: string
  uploadTime: string
  uploader: string
  fileSize: string
  fileType: string
  downloadUrl?: string
}

interface ProcurementDocumentManagementProps {
  currentUser: {
    id: string
    name: string
    role: string
    department?: string
    center?: string
  }
}

export default function ProcurementDocumentManagement({ currentUser }: ProcurementDocumentManagementProps) {
  const isMobile = useIsMobile()
  const [documents, setDocuments] = useState<ProcurementDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // 模拟数据 - 实际项目中应从后端获取
  useEffect(() => {
    const mockDocuments: ProcurementDocument[] = [
      {
        id: "1",
        fileName: "2024年度办公用品采购文件.pdf",
        uploadTime: "2024-01-15 10:30:00",
        uploader: "张三",
        fileSize: "2.5MB",
        fileType: "PDF"
      },
      {
        id: "2", 
        fileName: "计算机设备采购技术规格书.docx",
        uploadTime: "2024-01-10 14:20:00",
        uploader: "李四",
        fileSize: "1.8MB",
        fileType: "DOCX"
      },
      {
        id: "3",
        fileName: "服务器采购文件模板.doc",
        uploadTime: "2024-01-08 09:15:00", 
        uploader: "王五",
        fileSize: "1.2MB",
        fileType: "DOC"
      }
    ]
    setDocuments(mockDocuments)
  }, [])

  // 过滤文档
  const filteredDocuments = documents.filter(doc =>
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.uploader.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // 检查文件类型
      const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.rar']
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      
      if (!allowedTypes.includes(fileExtension)) {
        alert('不支持的文件格式。请上传 PDF、Word、Excel、ZIP 或 RAR 格式的文件。')
        return
      }

      // 检查文件大小 (50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert('文件大小不能超过 50MB')
        return
      }

      setUploadingFile(file)
      setIsUploadDialogOpen(true)
    }
  }

  // 确认上传文件
  const confirmUpload = async () => {
    if (!uploadingFile) return

    setIsUploading(true)
    try {
      // 模拟上传过程
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 创建新文档记录
      const newDocument: ProcurementDocument = {
        id: Date.now().toString(),
        fileName: uploadingFile.name,
        uploadTime: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        uploader: currentUser.name,
        fileSize: formatFileSize(uploadingFile.size),
        fileType: uploadingFile.name.split('.').pop()?.toUpperCase() || "UNKNOWN"
      }

      setDocuments(prev => [newDocument, ...prev])
      alert('文件上传成功！')
      
      setIsUploadDialogOpen(false)
      setUploadingFile(null)
    } catch (error) {
      alert('文件上传失败，请重试')
    } finally {
      setIsUploading(false)
    }
  }

  // 下载模板文件
  const handleDownloadTemplate = () => {
    // 实际项目中应该从服务器下载真实的模板文件
    alert('采购文件模板下载功能正在开发中...')
  }

  // 下载文件
  const handleDownloadFile = (document: ProcurementDocument) => {
    // 实际项目中应该从服务器下载文件
    alert(`正在下载文件: ${document.fileName}`)
  }

  // 删除文件
  const handleDeleteFile = async (documentId: string) => {
    try {
      // 实际项目中应该调用后端 API
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      alert('文件删除成功！')
    } catch (error) {
      alert('文件删除失败，请重试')
    }
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // 获取文件图标
  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-600" />
      case 'doc':
      case 'docx':
        return <FileText className="h-4 w-4 text-blue-600" />
      case 'xls':
      case 'xlsx':
        return <FileText className="h-4 w-4 text-green-600" />
      case 'zip':
      case 'rar':
        return <FileText className="h-4 w-4 text-yellow-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="bg-white p-2 sm:p-4 lg:p-6 rounded-lg shadow-md h-full flex flex-col">
      {/* 页面标题和操作按钮 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 lg:mb-6 gap-3 sm:gap-4">
        <div className="flex items-center">
          <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">采购文件管理</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">管理采购相关文件的上传和下载</p>
          </div>
        </div>
        <div className="flex flex-row gap-2 sm:gap-3">
          {/* 下载模板按钮 */}
          <Button 
            variant="outline" 
            onClick={handleDownloadTemplate}
            size="sm"
            className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700 px-3 py-2 text-sm"
          >
            <Download className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">下载采购模板</span>
            <span className="sm:hidden">模板</span>
          </Button>
          
          {/* 上传文件按钮 */}
          <div className="relative flex-1 sm:flex-none">
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
              onChange={handleFileUpload}
              className="sr-only"
              id="file-upload"
            />
            <Button 
              onClick={() => document.getElementById('file-upload')?.click()}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white w-full px-3 py-2 text-sm"
            >
              <Upload className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">上传采购文件</span>
              <span className="sm:hidden">上传</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 搜索区域 */}
      <div className={cn(
        "mb-3 sm:mb-4 lg:mb-6 flex gap-2 sm:gap-4 items-end flex-shrink-0"
      )}>
        <div className={cn(isMobile ? "w-full" : "w-[300px]")}>
          <Label className="block text-sm font-medium text-gray-700 mb-1">
            搜索文件
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 z-10" />
            <Input
              placeholder="搜索文件名或上传人"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* 文件列表 */}
      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 w-full">
          {isMobile ? (
            // 移动端卡片布局
            <div className="space-y-3 p-1">
              {filteredDocuments.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <div className="flex flex-col items-center space-y-2">
                    <FileText className="h-12 w-12 text-gray-300" />
                    <p className="text-lg">暂无采购文件</p>
                    <p className="text-sm text-gray-400">请点击"上传采购文件"按钮添加文件</p>
                  </div>
                </div>
              ) : (
                filteredDocuments.map((document) => (
                  <div key={document.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    {/* 文件标题行 */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          {getFileIcon(document.fileType)}
                          <h3 className="font-medium text-gray-900 text-sm leading-tight truncate">
                            {document.fileName}
                          </h3>
                        </div>
                        <p className="text-xs text-gray-500">
                          上传人: {document.uploader}
                        </p>
                      </div>
                      <div className="ml-3 flex-shrink-0">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {document.fileType}
                        </span>
                      </div>
                    </div>
                    
                    {/* 文件信息网格 */}
                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                      <div>
                        <span className="text-gray-500">文件大小:</span>
                        <span className="ml-1 text-gray-900">{document.fileSize}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">上传时间:</span>
                        <span className="ml-1 text-gray-900">{document.uploadTime}</span>
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadFile(document)}
                          className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          下载
                        </Button>
                      </div>
                      
                      {/* 删除操作 */}
                      <div className="flex items-center space-x-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              删除
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>确认删除</AlertDialogTitle>
                              <AlertDialogDescription>
                                确定要删除文件 "{document.fileName}" 吗？此操作不可撤销。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteFile(document.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                删除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            // 桌面端表格布局
            <Table className="w-full">
            <TableHeader>
              <TableRow className="h-12">
                <TableHead className="text-center text-sm font-semibold text-gray-700 px-4 py-3">
                  文件名
                </TableHead>
                <TableHead className="text-center text-sm font-semibold text-gray-700 px-4 py-3 w-[120px]">
                  文件类型
                </TableHead>
                <TableHead className="text-center text-sm font-semibold text-gray-700 px-4 py-3 w-[100px]">
                  文件大小
                </TableHead>
                <TableHead className="text-center text-sm font-semibold text-gray-700 px-4 py-3 w-[150px]">
                  上传时间
                </TableHead>
                <TableHead className="text-center text-sm font-semibold text-gray-700 px-4 py-3 w-[100px]">
                  上传人
                </TableHead>
                <TableHead className="text-center text-sm font-semibold text-gray-700 px-4 py-3 w-[150px]">
                  操作
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-12">
                    <div className="flex flex-col items-center space-y-2">
                      <FileText className="h-12 w-12 text-gray-300" />
                      <p className="text-lg">暂无采购文件</p>
                      <p className="text-sm text-gray-400">请点击"上传采购文件"按钮添加文件</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments.map((document) => (
                  <TableRow key={document.id} className="h-16 hover:bg-gray-50">
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(document.fileType)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate" title={document.fileName}>
                            {document.fileName}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {document.fileType}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-600 px-4 py-3">
                      {document.fileSize}
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-600 px-4 py-3">
                      {document.uploadTime}
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-600 px-4 py-3">
                      {document.uploader}
                    </TableCell>
                    <TableCell className="text-center px-4 py-3">
                      <div className="flex justify-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDownloadFile(document)}
                          className="h-8 px-3 text-xs text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          下载
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-8 px-3 text-xs text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              删除
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>确认删除</AlertDialogTitle>
                              <AlertDialogDescription>
                                确定要删除文件 "{document.fileName}" 吗？此操作不可撤销。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteFile(document.id)}
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
          )}
        </ScrollArea>
      </div>

      {/* 上传确认对话框 */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认上传文件</DialogTitle>
            <DialogDescription>
              请确认要上传以下文件：
            </DialogDescription>
          </DialogHeader>
          {uploadingFile && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getFileIcon(uploadingFile.name.split('.').pop() || '')}
                  <div>
                    <p className="font-medium">{uploadingFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(uploadingFile.size)} • {uploadingFile.name.split('.').pop()?.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                上传人：{currentUser.name}
              </p>
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
              {isUploading ? '上传中...' : '确认上传'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 