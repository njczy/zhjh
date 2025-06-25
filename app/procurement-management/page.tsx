import ProcurementDocumentManagement from "@/components/procurement-document-management"

// 模拟当前用户数据用于测试
const mockCurrentUser = {
  id: "1",
  name: "张三",
  role: "中心专职",
  department: "发展策划部",
  center: "运营中心"
}

export default function ProcurementManagementPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <ProcurementDocumentManagement currentUser={mockCurrentUser} />
    </div>
  )
} 