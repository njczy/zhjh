// lib/data.ts

// 定义项目状态类型
export type ProjectStatus = "编制" | "评审" | "批复" | "下达"

// 财务行数据模型
export interface FinancialRow {
  id: string
  startTime: string
  endTime: string
  plannedIncome: number
  incomeTaxRate: number
  plannedExpense: number
  expenseTaxRate: number
  grossMargin: number
}

// 项目数据模型
export interface Project {
  id: string
  name: string
  center: string
  department: string
  status: ProjectStatus
  description: string
  owner: string // 项目负责人
  createdAt: string // 项目创建时间 (ISO 8601 格式)
  version?: string // 项目版本
  isSubmittedForApproval?: boolean // 是否已提交审批
  approvalId?: string // 关联的审批记录ID
  
  // 新增页面的详细字段
  projectType?: string // 项目类型
  managementDepartment?: string // 归口管理部门
  fundAttribute?: string // 资金属性
  startDate?: string // 实施开始时间
  endDate?: string // 实施结束时间
  necessity?: string // 必要性
  feasibility?: string // 可行性
  projectBasis?: string // 立项依据
  implementationPlan?: string // 项目实施方案
  departmentHead?: string // 部门/中心负责人
  remarks?: string // 备注
  financialRows?: FinancialRow[] // 财务数据
  attachmentFileName?: string // 附件文件名
}

// 审批数据模型
export interface Approval {
  id: string
  projectId: string
  projectName: string
  submitter: string // 提交人
  approver: string // 审批人
  submittedAt: string // 提交时间
  status: "待审批" | "已同意" | "已驳回"
  approvedAt?: string // 审批时间
  comments?: string // 审批意见
}

// 月度评审数据模型
export interface MonthlyReview {
  id: string
  projectId: string
  projectName: string
  reviewDate: string // YYYY-MM-DD
  reviewer: string // 评审人 (e.g., 发展策划部门专职)
  status: "待评审" | "已评审" | "已驳回"
  comments?: string
  attachments?: string[] // 附件URL列表
  meetingInfo?: {
    startTime: string
    endTime: string
    location: string
    meetingGroup: string // 会议组标识
  }
}

// 会议纪要数据模型
export interface MeetingMinutes {
  id: string
  meetingGroup: string // 会议组（对应月度评审会）
  content: string // 会议纪要内容
  fileName?: string // 上传的文件名
  createdAt: string // 创建时间
  updatedAt: string // 更新时间
  submittedBy: string // 提交人
  status: "草稿" | "已提交"
}

// 批复报告审批状态
export type ApprovalReportStatus = "草稿" | "待确认" | "确认中" | "待审批" | "已审批" | "已驳回"

// 待办事项数据模型
export interface TodoItem {
  id: string
  type: "approval_report_confirm" | "approval_report_approve" | "project_approval" | "monthly_review_participant_confirm" // 待办类型
  title: string // 待办标题
  description: string // 待办描述
  relatedId: string // 关联的对象ID（如批复报告ID或审批记录ID）
  assignedTo: string // 分配给的用户ID
  assignedBy: string // 分配人ID
  createdAt: string // 创建时间
  status: "待处理" | "已处理" | "已忽略"
  processedAt?: string // 处理时间
  comments?: string // 处理意见
  priority?: "高" | "中" | "低" // 优先级
  // 月度审核参与人确认特有字段
  projectIds?: string[] // 关联的项目ID列表（用于月度审核参与人确认）
  confirmationOrder?: number // 确认顺序（按项目操作时间排序）
}

// 批复报告确认记录
export interface ApprovalReportConfirmation {
  id: string
  reportId: string // 批复报告ID
  userId: string // 确认用户ID
  userName: string // 确认用户姓名
  status: "待确认" | "已确认" | "已拒绝"
  confirmedAt?: string // 确认时间
  comments?: string // 确认意见
}

// 月度审核参与人确认记录
export interface MonthlyReviewParticipantConfirmation {
  id: string
  meetingGroup: string // 会议组标识
  userId: string // 确认用户ID
  userName: string // 确认用户姓名
  projectIds: string[] // 参与的项目ID列表
  status: "待确认" | "已确认" | "已拒绝"
  confirmedAt?: string // 确认时间
  comments?: string // 确认意见
  confirmationOrder: number // 确认顺序（按项目操作时间排序）
}

// 批复报告数据模型
export interface ApprovalReport {
  id: string
  meetingGroup: string // 会议组（对应月度评审会）
  templateType: "adjustment2024" | "newProject2024" | "preArrange2025" | "adjustmentApproval2024" | "newProjectApproval2024" | "preArrangeApproval2025"
  templateName: string // 模板显示名称
  selectedProjects: string[] // 选中的项目ID列表
  tableData: {[key: string]: any} // 表格填写的数据
  createdAt: string // 创建时间
  submittedAt: string // 提交时间  
  submittedBy: string // 提交人
  status: ApprovalReportStatus
  fileName: string // 生成的文件名
  
  // 审批流程相关字段
  confirmations?: ApprovalReportConfirmation[] // 确认记录
  finalApprover?: string // 最终审批人（分管院领导）
  finalApprovedAt?: string // 最终审批时间
  finalApprovalComments?: string // 最终审批意见
}

// 综合计划数据模型
export interface ComprehensivePlan {
  id: string
  year: number // 计划年份
  name: string // 计划名称，如"2025年度综合计划"
  status: "草稿" | "已发布" | "已归档"
  createdAt: string
  updatedAt: string
  createdBy: string // 创建人
  projectIds: string[] // 包含的项目ID列表
  description?: string // 计划描述
}

// 合同数据模型
export interface Contract {
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
  boundProjectId?: string // 绑定的单个项目ID
}

// 用户数据模型
export interface User {
  id: string
  name: string
  role: "中心专职" | "中心领导" | "部门专职" | "部门领导" | "分管院领导"
  department: string
  center: string
  institute: string
}

// 定义组织架构选项 - 中心和部门平级
export const AFFILIATION_OPTIONS = [
  { center: "运营中心", department: "", display: "运营中心" },
  { center: "", department: "发展策划部门", display: "发展策划部门" },
]

// 模拟用户列表 - 根据新的组织架构调整
export const mockUsers: User[] = [
  // 运营中心
  {
    id: "1",
    name: "徐海燕",
    role: "中心专职",
    institute: "电试院",
    center: "运营中心",
    department: "",
  },
  {
    id: "2",
    name: "马文博",
    role: "中心专职",
    institute: "电试院",
    center: "运营中心",
    department: "",
  },
  {
    id: "3",
    name: "林雪梅",
    role: "中心领导",
    institute: "电试院",
    center: "运营中心",
    department: "",
  },
  // 发展策划部门
  {
    id: "7",
    name: "拓总",
    role: "部门专职",
    institute: "电试院",
    center: "",
    department: "发展策划部门",
  },
  {
    id: "8",
    name: "邵主任",
    role: "部门领导",
    institute: "电试院",
    center: "",
    department: "发展策划部门",
  },
  // 财务部门
  {
    id: "10",
    name: "王财务",
    role: "部门专职",
    institute: "电试院",
    center: "",
    department: "财务部",
  },
  // 分管院领导
  {
    id: "9",
    name: "张副院长",
    role: "分管院领导",
    institute: "电试院",
    center: "",
    department: "院领导办公室",
  },
]

// 辅助函数：根据项目的中心和部门获取其简化显示名称
export function getProjectAffiliationDisplay(project: Project): string {
  const found = AFFILIATION_OPTIONS.find(
    (opt) => opt.center === project.center && opt.department === project.department,
  )
  return found ? found.display : `${project.center} - ${project.department}` // Fallback for unmatched
}



import { pinyin } from 'pinyin-pro'

// 通用的项目编码生成函数
// 用于确保编码唯一性的计数器
let projectCodeCounter = 0

export function generateProjectCode(projectName: string): string {
  // 中文汉字到拼音首字母的映射（部分常用字）
  const pinyinMap: { [key: string]: string } = {
    '智': 'Z', '能': 'N', '化': 'H', '监': 'J', '测': 'C', '系': 'X', '统': 'T', '项': 'X', '目': 'M',
    '创': 'C', '新': 'X', '研': 'Y', '发': 'F', '平': 'P', '台': 'T', '建': 'J', '设': 'S',
    '数': 'S', '据': 'J', '分': 'F', '析': 'X',
    '质': 'Z', '量': 'L', '管': 'G', '理': 'L', '升': 'S', '级': 'J',
    '备': 'B', '维': 'W', '护': 'H',
    '运': 'Y', '营': 'Y', '效': 'X', '率': 'L', '优': 'Y',
    '技': 'J', '术': 'S', '培': 'P', '训': 'X', '体': 'T',
    '检': 'J', '流': 'L', '程': 'C',
    '办': 'B', '公': 'G', '自': 'Z', '动': 'D',
    '网': 'W', '络': 'L', '安': 'A', '全': 'Q', '防': 'F',
    '机': 'J', '房': 'F', '改': 'G', '造': 'Z'
  }
  
  // 提取项目名称的拼音缩写
  let nameCode = ''
  for (const char of projectName) {
    if (pinyinMap[char]) {
      nameCode += pinyinMap[char]
    } else if (/[a-zA-Z]/.test(char)) {
      nameCode += char.toUpperCase()
    }
  }
  
  // 如果没有提取到任何字符，使用默认前缀
  if (nameCode.length === 0) {
    nameCode = 'XM' // 项目的拼音缩写
  }
  
  // 生成6位随机数字
  const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  
  return `${nameCode}${randomNum}`
}

// 项目类型选项
const PROJECT_TYPES = [
  "调试试验",
  "经营计划/监督检测", 
  "经营计划/零星检测",
  "技术咨询及培训",
  "成果转化",
  "租赁服务（收入）",
  "辅助设施建设",
  "生产能力建设",
  "科技开发",
  "运营费用",
  "租赁服务（支出）"
]

const FUND_ATTRIBUTES = ["资本", "成本"]
const NECESSITIES = [
  "提升技术能力，满足市场需求",
  "完善基础设施，提高服务质量", 
  "响应国家政策，推动行业发展",
  "优化运营流程，降低成本"
]
const FEASIBILITIES = [
  "技术方案成熟，实施风险可控",
  "资金充足，人员配备齐全",
  "市场前景良好，预期收益可观", 
  "政策支持，外部环境有利"
]
const PROJECT_BASES = [
  "国家相关政策文件要求",
  "公司发展战略规划",
  "市场调研分析报告",
  "技术发展趋势研判"
]

// Helper to create a project with full details
const createProject = (
  name: string,
  ownerUser: User,
  status: ProjectStatus,
): Project => {
  const id = generateProjectCode(name)
  const description = `这是关于 ${name} 的描述。`
  const dayOffset = projectCodeCounter % 30
  const createdAt = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000).toISOString()
  
  // 生成开始和结束日期
  const startDate = new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000)
  const endDate = new Date(startDate.getTime() + (365 + (projectCodeCounter % 730)) * 24 * 60 * 60 * 1000) // 1-2年项目周期
  
  // 生成财务数据
  const generateFinancialRows = (start: Date, end: Date): FinancialRow[] => {
    const rows: FinancialRow[] = []
    let currentYear = start.getFullYear()
    const endYear = end.getFullYear()
    
    while (currentYear <= endYear) {
      const yearStart = currentYear === start.getFullYear() ? start : new Date(currentYear, 0, 1)
      const yearEnd = currentYear === endYear ? end : new Date(currentYear, 11, 31)
      
      const plannedIncome = (projectCodeCounter % 10 + 1) * 100000 // 10万-100万
      const plannedExpense = plannedIncome * (0.6 + (projectCodeCounter % 30) / 100) // 60%-89%
      const grossMargin = ((plannedIncome - plannedExpense) / plannedIncome) * 100
      
      rows.push({
        id: `${currentYear}-${projectCodeCounter}-${Math.random()}`,
        startTime: yearStart.toISOString().split('T')[0],
        endTime: yearEnd.toISOString().split('T')[0],
        plannedIncome,
        incomeTaxRate: 13,
        plannedExpense,
        expenseTaxRate: 13,
        grossMargin
      })
      
      currentYear++
    }
    return rows
  }

  return {
    id,
    name,
    center: ownerUser.center,
    department: ownerUser.department,
    status,
    description,
    owner: ownerUser.name,
    createdAt,
    version: "V1", // 初始化数据的储备项目版本默认为V1
    
    // 详细字段
    projectType: PROJECT_TYPES[projectCodeCounter % PROJECT_TYPES.length],
    managementDepartment: "发展策划部",
    fundAttribute: FUND_ATTRIBUTES[projectCodeCounter % FUND_ATTRIBUTES.length],
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    necessity: NECESSITIES[projectCodeCounter % NECESSITIES.length],
    feasibility: FEASIBILITIES[projectCodeCounter % FEASIBILITIES.length],
    projectBasis: PROJECT_BASES[projectCodeCounter % PROJECT_BASES.length],
    implementationPlan: `${name}的实施方案包括：1. 前期调研和方案设计；2. 采购设备和搭建环境；3. 系统开发和测试；4. 试运行和优化；5. 正式上线和推广应用。项目将分阶段实施，确保质量和进度。`,
    departmentHead: ownerUser.center ? "林雪梅" : "邵主任", // 根据用户所属选择负责人
    remarks: `${name}项目备注：该项目对于提升公司技术水平和市场竞争力具有重要意义，建议优先实施。`,
    financialRows: generateFinancialRows(startDate, endDate),
    attachmentFileName: `${name}-项目建议书.pdf`,
    isSubmittedForApproval: false
  }
}

// 模拟数据生成函数
const generateMockProjects = (): Project[] => {
  const projects: Project[] = []
  projectCodeCounter = 0

  // 获取所有中心专职角色的用户
  const centerSpecialists = mockUsers.filter(u => u.role === "中心专职")
  
  // 为每个中心专职用户创建一个状态为"下达"的项目
  const deliveredProjectNames = [
    "智能化监测系统项目",
    "创新研发平台建设",
    "数据分析平台建设",
    "质量管理系统升级",
    "设备维护管理系统",
    "运营效率优化项目"
  ]

  centerSpecialists.forEach((specialist, index) => {
    if (index < deliveredProjectNames.length) {
      const projectName = deliveredProjectNames[index]
      const project = createProject(projectName, specialist, "下达")
      projects.push(project)
    }
  })

  // 添加一些其他状态的项目（编制状态）
  const additionalProjectNames = [
    "技术培训体系建设",
    "质量检测流程优化"
  ]

  additionalProjectNames.forEach((name, index) => {
    const owner = centerSpecialists[index % centerSpecialists.length]
    const project = createProject(name, owner, "编制")
    projects.push(project)
  })

  return projects
}

// 数据持久化工具函数
const saveToLocalStorage = (key: string, data: any) => {
  if (typeof window !== 'undefined') {
    // 客户端：保存到localStorage
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  } else {
    // 服务器端：保存到文件系统
    try {
      const fs = require('fs')
      const path = require('path')
      const dataDir = path.join(process.cwd(), 'data')
      
      // 确保data目录存在
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }
      
      const filePath = path.join(dataDir, `${key}.json`)
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
      console.log(`Server-side data saved to file: ${filePath}`)
    } catch (error) {
      console.error('Failed to save to file system:', error)
    }
  }
}

const loadFromLocalStorage = (key: string, defaultValue: any) => {
  if (typeof window !== 'undefined') {
    // 客户端：从localStorage加载
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error)
    }
  } else {
    // 服务器端：从文件系统加载
    try {
      const fs = require('fs')
      const path = require('path')
      const filePath = path.join(process.cwd(), 'data', `${key}.json`)
      
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8')
        const data = JSON.parse(fileContent)
        console.log(`Server-side data loaded from file: ${filePath}`)
        return data
      }
    } catch (error) {
      console.error('Failed to load from file system:', error)
    }
  }
  return defaultValue
}

// 从localStorage加载或生成初始数据
const initializeProjectsFromStorage = () => {
  const storedProjects = loadFromLocalStorage('reserve_projects', null)
  if (storedProjects && Array.isArray(storedProjects) && storedProjects.length > 0) {
    return storedProjects
  }
  // 只有在没有存储数据时才生成模拟数据
  let mockProjects = generateMockProjects()
  
  // 删除与指定用户相关的项目
  const deletedNames = ["黄俊杰", "谢丽娟", "罗国庆"]
  mockProjects = mockProjects.filter((p) => !deletedNames.includes(p.owner))
  
  saveToLocalStorage('reserve_projects', mockProjects)
  return mockProjects
}

// 模拟数据存储 (内存中) - 重新生成项目数据
let projects: Project[] = []

// 重新生成项目数据的函数
export const regenerateProjects = () => {
  projects = generateMockProjects()
  return projects
}



// 数据初始化函数 - 恢复所有模拟数据到初始状态
export const initializeData = () => {
  console.log('开始执行initializeData函数...')
  
  // 生成储备项目数据
  const newProjects = generateMockProjects()
  
  // 保存到localStorage和内存
  saveToLocalStorage('projects', newProjects)
  projects = newProjects
  
  // 生成合同数据
  const newContracts = generateMockContracts()
  console.log('生成的合同数据:', newContracts)
  saveToLocalStorage('contracts', newContracts)
  contracts = newContracts
  console.log('合同数据已保存到全局变量:', contracts)

  // 生成进度报销示例数据
  const mockProgressReimbursements = generateMockProgressReimbursements(newContracts)
  saveToLocalStorage('progress_reimbursements', mockProgressReimbursements)
  progressReimbursements = mockProgressReimbursements

  // 生成开票管理示例数据
  const mockInvoiceManagements = generateMockInvoiceManagements(newContracts, mockProgressReimbursements)
  saveToLocalStorage('invoice_managements', mockInvoiceManagements)
  invoiceManagements = mockInvoiceManagements

  // 生成审计日志示例数据
  const mockAuditLogs = generateMockAuditLogs()
  saveToLocalStorage('audit_logs', mockAuditLogs)
  auditLogs = mockAuditLogs

  // 生成回款记录示例数据
  const mockPaymentRecords = generateMockPaymentRecords(newContracts)
  saveToLocalStorage('payment_records', mockPaymentRecords)

  // 生成项目结算数据
  const mockProjectSettlements = generateProjectSettlements(newContracts, mockInvoiceManagements)
  saveToLocalStorage('project_settlements', mockProjectSettlements)

  // 初始化银行对账数据
  const bankData = initializeBankReconciliationFromStorage()
  
  // 生成月度评审示例数据
  const mockMonthlyReviews = generateMockMonthlyReviews()
  saveToLocalStorage('reserve_monthly_reviews', mockMonthlyReviews)
  saveToLocalStorage('reserve_needs_mock_reviews', false)
  monthlyReviews = mockMonthlyReviews

  // 生成批复报告示例数据
  const mockApprovalReports = generateRealisticApprovalReports()
  saveToLocalStorage('reserve_approval_reports', mockApprovalReports)
  
  // 生成待办事项数据
  const mockTodoItems = generateRealisticTodoItems(mockApprovalReports)
  saveToLocalStorage('reserve_todo_items', mockTodoItems)
  
  // 生成确认记录数据
  const mockConfirmations = generateRealisticConfirmations(mockApprovalReports)
  saveToLocalStorage('reserve_approval_confirmations', mockConfirmations)
  
  // 生成项目审批数据
  const mockApprovals = generateProjectApprovals()
  saveToLocalStorage('reserve_approvals', mockApprovals)
  approvals = mockApprovals

  // 生成投标管理数据
  const mockBiddingDocuments = generateMockBiddingDocuments()
  saveToLocalStorage('bidding_documents', mockBiddingDocuments)

  // 生成采购管理数据
  const mockProcurementDocuments = generateMockProcurementDocuments()
  saveToLocalStorage('procurement_documents', mockProcurementDocuments)
  
  console.log('数据初始化完成')
  console.log('储备项目数量:', newProjects.length)
  console.log('合同数量:', newContracts.length)
  console.log('进度报销数量:', mockProgressReimbursements.length)
  console.log('开票记录数量:', mockInvoiceManagements.length)
  console.log('审计日志数量:', mockAuditLogs.length)
  console.log('回款记录数量:', mockPaymentRecords.length)
  console.log('项目结算数量:', mockProjectSettlements.length)
  console.log('银行流水数量:', bankData.transactions.length)
  console.log('月度评审数量:', mockMonthlyReviews.length)
  console.log('批复报告数量:', mockApprovalReports.length)
  console.log('待办事项数量:', mockTodoItems.length)
  console.log('项目审批数量:', mockApprovals.length)
  console.log('投标文件数量:', mockBiddingDocuments.length)
  console.log('采购文件数量:', mockProcurementDocuments.length)
}

// 生成模拟合同数据
const generateMockContracts = (): Contract[] => {
  // 获取现有项目，绑定已下达的项目到合同
  const existingProjects = projects.length > 0 ? projects : generateMockProjects()
  const deliveredProjects = existingProjects.filter(p => p.status === "下达")
  
  return [
    {
      id: "contract-1",
      contractNumber: "HT-2024-001",
      contractName: "办公设备采购合同",
      contractType: "采购合同",
      signDate: "2024-01-15",
      amount: 150000,
      supplier: "北京科技有限公司",
      department: "行政部",
      status: "已绑定",
      excelFileName: "办公设备采购合同清单.xlsx",
      uploadTime: "2024-01-15 10:30:00",
      uploader: "张三",
      boundProjectId: deliveredProjects[0]?.id // 绑定第1个已下达项目
    },
    {
      id: "contract-2",
      contractNumber: "HT-2024-002", 
      contractName: "软件服务合同",
      contractType: "服务合同",
      signDate: "2024-01-10",
      amount: 200000,
      supplier: "上海软件科技公司",
      department: "信息部",
      status: "已绑定",
      excelFileName: "软件服务合同清单.xlsx",
      uploadTime: "2024-01-10 14:20:00",
      uploader: "李四",
      boundProjectId: deliveredProjects[1]?.id // 绑定第2个已下达项目
    },
    {
      id: "contract-3",
      contractNumber: "HT-2024-003",
      contractName: "设备维护服务合同",
      contractType: "服务合同",
      signDate: "2024-02-01",
      amount: 80000,
      supplier: "设备维护公司",
      department: "运营中心",
      status: "已绑定",
      excelFileName: "设备维护服务合同清单.xlsx",
      uploadTime: "2024-02-01 09:15:00",
      uploader: "王五",
      boundProjectId: deliveredProjects[2]?.id // 绑定第3个已下达项目
    }
  ]
}

// 生成示例批复报告数据
const generateRealisticApprovalReports = (): ApprovalReport[] => {
  const approvalReports: ApprovalReport[] = []
  
  // 生成2024年项目调整批复报告
  approvalReports.push({
    id: 'report-2024-001',
    meetingGroup: 'meeting-2024-001',
    templateType: 'adjustment2024',
    templateName: '2024年度项目调整批复报告',
    selectedProjects: [],
    tableData: {},
    createdAt: new Date('2024-01-15').toISOString(),
    submittedAt: new Date('2024-01-15').toISOString(),
    submittedBy: '拓总',
    status: '已审批',
    fileName: '2024年度项目调整批复报告_20240115.docx',
    finalApprover: '张副院长',
    finalApprovedAt: new Date('2024-01-20').toISOString(),
    finalApprovalComments: '同意项目调整方案'
  })

  // 生成2025年预安排批复报告
  approvalReports.push({
    id: 'report-2025-001', 
    meetingGroup: 'meeting-2025-001',
    templateType: 'preArrange2025',
    templateName: '2025年度项目预安排批复报告',
    selectedProjects: [],
    tableData: {},
    createdAt: new Date('2024-02-01').toISOString(),
    submittedAt: new Date('2024-02-01').toISOString(),
    submittedBy: '拓总',
    status: '待审批',
    fileName: '2025年度项目预安排批复报告_20240201.docx'
  })
  
  return approvalReports
}

// 生成示例待办事项数据
const generateRealisticTodoItems = (reports: ApprovalReport[]): TodoItem[] => {
  const todoItems: TodoItem[] = []
  
  // 为批复报告生成审批待办
  reports.forEach(report => {
    if (report.status === '待审批') {
      todoItems.push({
        id: `todo-${report.id}`,
        type: 'approval_report_approve',
        title: `审批批复报告：${report.templateName}`,
        description: `请审批提交的批复报告文件`,
        relatedId: report.id,
        assignedTo: '张副院长',
        assignedBy: report.submittedBy,
        createdAt: report.submittedAt,
        status: '待处理',
        priority: '高'
      })
    }
  })

  // 注释掉虚假的进度报销待办，避免引用不存在的数据
  // 实际的进度报销待办会在相关模块中自动创建
  
  return todoItems
}

// 生成批复报告确认记录
const generateRealisticConfirmations = (reports: ApprovalReport[]): ApprovalReportConfirmation[] => {
  const confirmations: ApprovalReportConfirmation[] = []
  
  // 为已审批的报告生成确认记录
  reports.forEach(report => {
    if (report.status === '已审批') {
      confirmations.push({
        id: `confirm-${report.id}-1`,
        reportId: report.id,
        userId: 'user-001',
        userName: '拓总',
        status: '已确认',
        confirmedAt: report.finalApprovedAt,
        comments: '已确认批复内容'
      })
    }
  })
  
  return confirmations
}

// 生成项目审批记录
const generateProjectApprovals = (): Approval[] => {
  const approvals: Approval[] = []
  
  // 获取现有项目列表，确保引用真实存在的项目
  const existingProjects = projects.length > 0 ? projects : generateMockProjects()
  
  // 只为前3个项目创建审批记录，确保引用的项目确实存在
  const projectsToApprove = existingProjects.slice(0, 3)
  
  projectsToApprove.forEach((project, index) => {
    const statuses = ['已同意', '待审批', '已驳回'] as const
    const submitters = ['张三', '李四', '王五']
    const approvers = ['李主任', '王经理', '张部长']
    const comments = [
      '项目方案合理，同意立项',
      '',
      '预算超标，请重新调整方案'
    ]
    
    const approval: Approval = {
      id: `approval-${String(index + 1).padStart(3, '0')}`,
      projectId: project.id, // 使用真实的项目ID
      projectName: project.name, // 使用真实的项目名称
      submitter: submitters[index],
      approver: approvers[index],
      submittedAt: new Date(`2024-01-${String(10 + index * 5).padStart(2, '0')}`).toISOString(),
      status: statuses[index],
      comments: comments[index]
    }
    
    // 为已同意和已驳回状态添加审批时间
    if (statuses[index] !== '待审批') {
      approval.approvedAt = new Date(`2024-01-${String(12 + index * 5).padStart(2, '0')}`).toISOString()
    }
    
    approvals.push(approval)
  })
  
  return approvals
}

// 初始化项目数据（从localStorage加载或生成新数据）
projects = initializeProjectsFromStorage()

// 审批数据存储
let approvals: Approval[] = loadFromLocalStorage('reserve_approvals', [])

let monthlyReviews: MonthlyReview[] = loadFromLocalStorage('reserve_monthly_reviews', [])

// 生成模拟月度评审数据的函数
const generateMockMonthlyReviews = (): MonthlyReview[] => {
  const mockReviews: MonthlyReview[] = []
  
  // 获取现有项目列表，确保引用真实存在的项目
  const existingProjects = projects.length > 0 ? projects : generateMockProjects()
  
  // 只为前3个项目创建月度评审记录，确保引用的项目确实存在
  const projectsToReview = existingProjects.slice(0, 3)
  
  projectsToReview.forEach((project, index) => {
    const statuses = ['已评审', '待评审', '已驳回']
    const comments = [
      '项目进展良好，按计划执行',
      '',
      '项目风险评估不充分，需要重新论证'
    ]
    
    // 生成当前年的随机日期加上小时分钟数字作为会议编号
    const currentYear = new Date().getFullYear()
    const randomMonth = Math.floor(Math.random() * 12) + 1
    const randomDay = Math.floor(Math.random() * 28) + 1 // 避免月末日期问题
    const randomHour = Math.floor(Math.random() * 24)
    const randomMinute = Math.floor(Math.random() * 60)
    const meetingGroup = `${currentYear}${String(randomMonth).padStart(2, '0')}${String(randomDay).padStart(2, '0')}${String(randomHour).padStart(2, '0')}${String(randomMinute).padStart(2, '0')}`
    
    mockReviews.push({
      id: `review-${String(index + 1).padStart(3, '0')}`,
      projectId: project.id, // 使用真实的项目ID
      projectName: project.name, // 使用真实的项目名称
      reviewDate: `2024-${String(index + 1).padStart(2, '0')}-${String(15 + index * 5).padStart(2, '0')}`,
      reviewer: '发展策划部门专职',
      status: statuses[index] as "待评审" | "已评审" | "已驳回",
      comments: comments[index],
      meetingInfo: {
        startTime: `2024-${String(index + 1).padStart(2, '0')}-${String(15 + index * 5).padStart(2, '0')} ${String(9 + index * 2).padStart(2, '0')}:00:00`,
        endTime: `2024-${String(index + 1).padStart(2, '0')}-${String(15 + index * 5).padStart(2, '0')} ${String(11 + index * 2).padStart(2, '0')}:00:00`,
        location: `会议室${String.fromCharCode(65 + index)}`, // A, B, C
        meetingGroup: meetingGroup
      }
    })
  })
  
  return mockReviews
}

// 初始化月度评审数据的函数
const initializeMonthlyReviewsFromStorage = () => {
  if (typeof window === 'undefined') return monthlyReviews
  
  // 检查是否需要生成模拟数据
  const storedReviews = loadFromLocalStorage('reserve_monthly_reviews', [])
  const needsMockData = loadFromLocalStorage('reserve_needs_mock_reviews', true)
  
  if (storedReviews.length === 0 && needsMockData) {
    // 生成模拟数据
    const mockData = generateMockMonthlyReviews()
    saveToLocalStorage('reserve_monthly_reviews', mockData)
    saveToLocalStorage('reserve_needs_mock_reviews', false)
    return mockData
  }
  
  return storedReviews
}

// 初始化月度评审数据
monthlyReviews = initializeMonthlyReviewsFromStorage()

// 会议纪要数据存储
const meetingMinutes: MeetingMinutes[] = loadFromLocalStorage('reserve_meeting_minutes', [])

// 删除与指定用户相关的审批、月度评审数据（只在初始化时执行）
const filterUserData = () => {
  if (typeof window === 'undefined') return
  
  const deletedNames = ["黄俊杰", "谢丽娟", "罗国庆"]
  
  // 检查是否是首次运行（通过检查特定的标记）
  const isDataInitialized = loadFromLocalStorage('reserve_data_initialized', false)
  
  if (!isDataInitialized) {
    // 过滤审批数据
    const filteredApprovals = approvals.filter((a) => !deletedNames.includes(a.submitter) && !deletedNames.includes(a.approver))
    approvals = [...filteredApprovals]
    saveToLocalStorage('reserve_approvals', approvals)
    
    // 过滤月度评审数据
    const filteredReviews = monthlyReviews.filter((r) => !deletedNames.includes(r.reviewer))
    monthlyReviews = [...filteredReviews]
    saveToLocalStorage('reserve_monthly_reviews', monthlyReviews)
    
    // 标记数据已初始化
    saveToLocalStorage('reserve_data_initialized', true)
  }
}

// 执行用户数据过滤
filterUserData()

// --- 模拟数据库切换逻辑 ---
// 在实际的Node.js + Next.js后端中，这里会是连接MongoDB的代码。
// 例如，你可以使用 mongoose 或 mongodb 驱动。
// 为了演示，我们只用一个布尔值来模拟"切换"的概念。
const USE_DATABASE_MOCK = false // 设置为 true 模拟数据库连接，但实际仍是内存数据

// 模拟MongoDB连接和操作
const connectToMongoDB = async () => {
  console.log("Connecting to MongoDB (simulated)...")
  // 实际代码:
  // import mongoose from 'mongoose';
  // if (mongoose.connection.readyState === 0) {
  //   await mongoose.connect(process.env.MONGODB_URI!);
  //   console.log("MongoDB connected.");
  // }
  // return mongoose.connection;
  return Promise.resolve("Simulated MongoDB Connection")
}

// 模拟从MongoDB获取数据
const getProjectsFromDB = async (): Promise<Project[]> => {
  await connectToMongoDB()
  console.log("Fetching projects from simulated DB...")
  // 实际代码: return ProjectModel.find({});
  return Promise.resolve(projects) // 仍然返回内存数据，模拟从DB获取
}

const addProjectToDB = async (project: Omit<Project, "id" | "createdAt">): Promise<Project> => {
  await connectToMongoDB()
  console.log("Adding project to simulated DB...")
  const newProject = {
    ...project,
    id: `P${String(projects.length + 1).padStart(3, "0")}`,
    createdAt: new Date().toISOString(), // Set creation time
  }
  projects.push(newProject)
  // 实际代码: const newProject = await ProjectModel.create(project);
  return Promise.resolve(newProject)
}

const updateProjectInDB = async (id: string, updates: Partial<Project>): Promise<Project | null> => {
  await connectToMongoDB()
  console.log("Updating project in simulated DB...")
  const index = projects.findIndex((p) => p.id === id)
  if (index > -1) {
    projects[index] = { ...projects[index], ...updates }
    // 实际代码: return ProjectModel.findByIdAndUpdate(id, updates, { new: true });
    return Promise.resolve(projects[index])
  }
  return Promise.resolve(null)
}

const deleteProjectFromDB = async (id: string): Promise<boolean> => {
  await connectToMongoDB()
  console.log("Deleting project from simulated DB...")
  const initialLength = projects.length
  projects = projects.filter((p) => p.id !== id)
  return Promise.resolve(projects.length < initialLength)
}

const getMonthlyReviewsFromDB = async (): Promise<MonthlyReview[]> => {
  await connectToMongoDB()
  console.log("Fetching monthly reviews from simulated DB...")
  // 实际代码: return MonthlyReviewModel.find({});
  return Promise.resolve(monthlyReviews)
}

const addMonthlyReviewToDB = async (review: Omit<MonthlyReview, "id">): Promise<MonthlyReview> => {
  await connectToMongoDB()
  console.log("Adding monthly review to simulated DB...")
  const newReview = { ...review, id: `R${String(monthlyReviews.length + 1).padStart(3, "0")}` }
  monthlyReviews.push(newReview)
  // 实际代码: const newReview = await MonthlyReviewModel.create(review);
  return Promise.resolve(newReview)
}

// --- 公开的数据操作函数 ---

export const getProjects = async (): Promise<Project[]> => {
  if (USE_DATABASE_MOCK) {
    return getProjectsFromDB()
  }
  
  // 在客户端，从localStorage重新加载数据以确保数据同步
  if (typeof window !== 'undefined') {
    const storedProjects = loadFromLocalStorage('reserve_projects', [])
    if (Array.isArray(storedProjects)) {
      projects.length = 0
      projects.push(...storedProjects)
    }
  }
  
  return Promise.resolve([...projects])
}

export const addProject = async (project: Omit<Project, "id" | "createdAt">): Promise<Project> => {
  if (USE_DATABASE_MOCK) {
    return addProjectToDB(project)
  }
  const newProject = {
    ...project,
    id: generateProjectCode(project.name),
    createdAt: new Date().toISOString(), // Set creation time
  }
  projects.push(newProject)
  saveToLocalStorage('reserve_projects', projects)
  return Promise.resolve(newProject)
}

export const updateProject = async (id: string, updates: Partial<Project>): Promise<Project | null> => {
  if (USE_DATABASE_MOCK) {
    return updateProjectInDB(id, updates)
  }
  
  // 在更新前先从localStorage重新加载最新数据，确保数据同步
  if (typeof window !== 'undefined') {
    const storedProjects = loadFromLocalStorage('reserve_projects', [])
    if (Array.isArray(storedProjects)) {
      projects.length = 0
      projects.push(...storedProjects)
    }
  }
  
  const index = projects.findIndex((p) => p.id === id)
  if (index > -1) {
    projects[index] = { ...projects[index], ...updates }
    saveToLocalStorage('reserve_projects', projects)
    return Promise.resolve(projects[index])
  }
  return Promise.resolve(null)
}

export const deleteProject = async (id: string): Promise<boolean> => {
  if (USE_DATABASE_MOCK) {
    return deleteProjectFromDB(id)
  }
  const initialLength = projects.length
  projects = projects.filter((p) => p.id !== id)
  if (projects.length < initialLength) {
    saveToLocalStorage('reserve_projects', projects)
  }
  return Promise.resolve(projects.length < initialLength)
}

export const getMonthlyReviews = async (): Promise<MonthlyReview[]> => {
  if (USE_DATABASE_MOCK) {
    return getMonthlyReviewsFromDB()
  }
  
  // 在客户端，从localStorage重新加载数据
  if (typeof window !== 'undefined') {
    const storedReviews = loadFromLocalStorage('reserve_monthly_reviews', [])
    const needsMockData = loadFromLocalStorage('reserve_needs_mock_reviews', true)
    
    // 如果没有数据且需要模拟数据，生成它
    if (storedReviews.length === 0 && needsMockData) {
      const mockData = generateMockMonthlyReviews()
      saveToLocalStorage('reserve_monthly_reviews', mockData)
      saveToLocalStorage('reserve_needs_mock_reviews', false)
      monthlyReviews = [...mockData]
    } else if (Array.isArray(storedReviews)) {
      // 重新创建数组以确保引用更新
      monthlyReviews = [...storedReviews]
    }
  }
  
  // 返回当前内存中的数据（服务器端会是最新的，客户端会从localStorage同步）
  return Promise.resolve([...monthlyReviews])
}

export const addMonthlyReview = async (review: Omit<MonthlyReview, "id">): Promise<MonthlyReview> => {
  if (USE_DATABASE_MOCK) {
    return addMonthlyReviewToDB(review)
  }
  
  // 在客户端，从 localStorage 重新加载以确保有最新数据
  if (typeof window !== 'undefined') {
    const storedReviews = loadFromLocalStorage('reserve_monthly_reviews', [])
    if (Array.isArray(storedReviews)) {
      monthlyReviews.length = 0
      monthlyReviews.push(...storedReviews)
    }
  }
  
  // 生成唯一 ID - 使用时间戳确保唯一性
  const timestamp = Date.now()
  const randomNum = Math.floor(Math.random() * 1000)
  const newId = `R${timestamp}_${randomNum}`
  
  const newReview = { ...review, id: newId }
  monthlyReviews.push(newReview)
  
  // 保存数据 - 在客户端保存到localStorage，在服务器端保存到内存
  saveToLocalStorage('reserve_monthly_reviews', monthlyReviews)
  console.log('Successfully saved monthly review:', newReview)
  
  return Promise.resolve(newReview)
}

export const updateMonthlyReview = async (id: string, updates: Partial<MonthlyReview>): Promise<MonthlyReview | null> => {
  const index = monthlyReviews.findIndex((r) => r.id === id)
  if (index > -1) {
    monthlyReviews[index] = { ...monthlyReviews[index], ...updates }
    saveToLocalStorage('reserve_monthly_reviews', monthlyReviews)
    return Promise.resolve(monthlyReviews[index])
  }
  return Promise.resolve(null)
}

// 审批相关操作函数
export const getApprovals = async (): Promise<Approval[]> => {
  return Promise.resolve(approvals)
}

export const addApproval = async (approval: Omit<Approval, "id">): Promise<Approval> => {
  const newApproval = { ...approval, id: `A${String(approvals.length + 1).padStart(3, "0")}` }
  approvals.push(newApproval)
  saveToLocalStorage('reserve_approvals', approvals)
  return Promise.resolve(newApproval)
}

export const updateApproval = async (id: string, updates: Partial<Approval>): Promise<Approval | null> => {
  const index = approvals.findIndex((a) => a.id === id)
  if (index > -1) {
    approvals[index] = { ...approvals[index], ...updates }
    saveToLocalStorage('reserve_approvals', approvals)
    return Promise.resolve(approvals[index])
  }
  return Promise.resolve(null)
}

// 获取部门领导
export const getDepartmentHead = (department: string): User | null => {
  return mockUsers.find((user) => user.role === "部门领导" && user.department === department) || null
}

// 获取可选的审批人列表（只能提交给自己中心的中心领导）
export const getAvailableApprovers = (userDepartment: string, userCenter: string): User[] => {
  const approvers: User[] = []
  
  if (userCenter) {
    // 如果用户属于中心，只能选择同中心的中心领导
    const centerLeaders = mockUsers.filter(
      (user) => user.role === "中心领导" && user.center === userCenter
    )
    approvers.push(...centerLeaders)
  } else if (userDepartment) {
    // 如果用户属于部门，可以选择部门领导
    const departmentLeaders = mockUsers.filter(
      (user) => user.role === "部门领导" && user.department === userDepartment
    )
    approvers.push(...departmentLeaders)
  }
  
  return approvers
}

// 会议纪要相关操作函数
export const getMeetingMinutes = async (): Promise<MeetingMinutes[]> => {
  // 每次获取时都从localStorage重新加载，确保数据最新
  const storedMinutes = loadFromLocalStorage('reserve_meeting_minutes', [])
  if (Array.isArray(storedMinutes)) {
    // 同步内存数据与localStorage
    meetingMinutes.length = 0
    meetingMinutes.push(...storedMinutes)
  }
  
  return Promise.resolve(meetingMinutes)
}

export const addMeetingMinutes = async (minutes: Omit<MeetingMinutes, "id" | "createdAt" | "updatedAt">): Promise<MeetingMinutes> => {
  const newMinutes: MeetingMinutes = {
    ...minutes,
    id: `M${String(meetingMinutes.length + 1).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  meetingMinutes.push(newMinutes)
  saveToLocalStorage('reserve_meeting_minutes', meetingMinutes)
  return Promise.resolve(newMinutes)
}

export const updateMeetingMinutes = async (id: string, updates: Partial<Omit<MeetingMinutes, "id">>): Promise<MeetingMinutes | null> => {
  const index = meetingMinutes.findIndex((m) => m.id === id)
  if (index > -1) {
    meetingMinutes[index] = { 
      ...meetingMinutes[index], 
      ...updates,
      updatedAt: new Date().toISOString()
    }
    saveToLocalStorage('reserve_meeting_minutes', meetingMinutes)
    return Promise.resolve(meetingMinutes[index])
  }
  return Promise.resolve(null)
}

export const getMeetingMinutesByGroup = async (meetingGroup: string): Promise<MeetingMinutes | null> => {
  // 在实际应用中，这里会查询数据库
  // 目前使用 localStorage 模拟
  const minutes = await getMeetingMinutes()
  return minutes.find(m => m.meetingGroup === meetingGroup) || null
}

// 根据ID获取项目
export const getProjectById = async (id: string): Promise<Project | null> => {
  const projects = await getProjects()
  return projects.find(project => project.id === id) || null
}

// 批复报告相关函数
export const getApprovalReports = async (): Promise<ApprovalReport[]> => {
  try {
    // TODO: 替换为实际的数据库操作
    return loadFromLocalStorage('reserve_approval_reports', [])
  } catch (error) {
    console.error('Failed to get approval reports:', error)
    return []
  }
}

export const addApprovalReport = async (report: Omit<ApprovalReport, "id" | "createdAt">): Promise<ApprovalReport> => {
  try {
    const newReport: ApprovalReport = {
      ...report,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    
    // TODO: 替换为实际的数据库操作
    const existingReports = await getApprovalReports()
    const updatedReports = [...existingReports, newReport]
    saveToLocalStorage('reserve_approval_reports', updatedReports)
    
    return newReport
  } catch (error) {
    console.error('Failed to add approval report:', error)
    throw error
  }
}

export const getApprovalReportsByGroup = async (meetingGroup: string): Promise<ApprovalReport[]> => {
  const reports = await getApprovalReports()
  return reports.filter(report => report.meetingGroup === meetingGroup)
}

// 待办事项相关函数
export const getTodoItems = async (): Promise<TodoItem[]> => {
  try {
    return loadFromLocalStorage('reserve_todo_items', [])
  } catch (error) {
    console.error('Failed to get todo items:', error)
    return []
  }
}

export const addTodoItem = async (todo: Omit<TodoItem, "id" | "createdAt">): Promise<TodoItem> => {
  try {
    const newTodo: TodoItem = {
      ...todo,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    
    const existingTodos = await getTodoItems()
    const updatedTodos = [...existingTodos, newTodo]
    saveToLocalStorage('reserve_todo_items', updatedTodos)
    
    return newTodo
  } catch (error) {
    console.error('Failed to add todo item:', error)
    throw error
  }
}

export const updateTodoItem = async (id: string, updates: Partial<TodoItem>): Promise<TodoItem | null> => {
  try {
    const todos = await getTodoItems()
    const index = todos.findIndex(todo => todo.id === id)
    
    if (index > -1) {
      todos[index] = { ...todos[index], ...updates }
      if (updates.status === "已处理") {
        todos[index].processedAt = new Date().toISOString()
      }
      saveToLocalStorage('reserve_todo_items', todos)
      return todos[index]
    }
    return null
  } catch (error) {
    console.error('Failed to update todo item:', error)
    throw error
  }
}

export const getTodoItemsByUser = async (userId: string): Promise<TodoItem[]> => {
  const todos = await getTodoItems()
  return todos.filter(todo => todo.assignedTo === userId && todo.status === "待处理")
}

// 批复报告确认相关函数
export const addApprovalReportConfirmation = async (confirmation: Omit<ApprovalReportConfirmation, "id">): Promise<ApprovalReportConfirmation> => {
  try {
    const newConfirmation: ApprovalReportConfirmation = {
      ...confirmation,
      id: Date.now().toString(),
    }
    
    const confirmations = await getApprovalReportConfirmations()
    const updatedConfirmations = [...confirmations, newConfirmation]
    saveToLocalStorage('reserve_approval_confirmations', updatedConfirmations)
    
    return newConfirmation
  } catch (error) {
    console.error('Failed to add approval report confirmation:', error)
    throw error
  }
}

export const getApprovalReportConfirmations = async (): Promise<ApprovalReportConfirmation[]> => {
  try {
    return loadFromLocalStorage('reserve_approval_confirmations', [])
  } catch (error) {
    console.error('Failed to get approval report confirmations:', error)
    return []
  }
}

export const updateApprovalReportConfirmation = async (id: string, updates: Partial<ApprovalReportConfirmation>): Promise<ApprovalReportConfirmation | null> => {
  try {
    const confirmations = await getApprovalReportConfirmations()
    const index = confirmations.findIndex(conf => conf.id === id)
    
    if (index > -1) {
      confirmations[index] = { ...confirmations[index], ...updates }
      if (updates.status === "已确认" || updates.status === "已拒绝") {
        confirmations[index].confirmedAt = new Date().toISOString()
      }
      saveToLocalStorage('reserve_approval_confirmations', confirmations)
      return confirmations[index]
    }
    return null
  } catch (error) {
    console.error('Failed to update approval report confirmation:', error)
    throw error
  }
}

export const getConfirmationsByReportId = async (reportId: string): Promise<ApprovalReportConfirmation[]> => {
  const confirmations = await getApprovalReportConfirmations()
  return confirmations.filter(conf => conf.reportId === reportId)
}

// 更新批复报告函数以支持新的审批流程
export const updateApprovalReport = async (id: string, updates: Partial<ApprovalReport>): Promise<ApprovalReport | null> => {
  try {
    const reports = await getApprovalReports()
    const index = reports.findIndex(report => report.id === id)
    
    if (index > -1) {
      reports[index] = { ...reports[index], ...updates }
      saveToLocalStorage('reserve_approval_reports', reports)
      return reports[index]
    }
    return null
  } catch (error) {
    console.error('Failed to update approval report:', error)
    throw error
  }
}

// 获取项目相关的所有用户（用于确认流程）
export const getProjectRelatedUsers = async (projectIds: string[]): Promise<User[]> => {
  try {
    // 注意：这里的projectIds实际上是月度评审记录的ID，需要通过评审记录找到对应的项目
    const reviews = await getMonthlyReviews()
    const projects = await getProjects()
    
    const relatedUserIds = new Set<string>()
    const relatedUsers: User[] = []
    
    console.log(`🔍 getProjectRelatedUsers 开始调试:`)
    console.log(`  - 输入的projectIds: ${JSON.stringify(projectIds)}`)
    console.log(`  - 总月度评审记录数: ${reviews.length}`)
    console.log(`  - 总项目数: ${projects.length}`)
    console.log(`  - 总用户数: ${mockUsers.length}`)
    
    if (!projectIds || projectIds.length === 0) {
      console.warn('⚠️ getProjectRelatedUsers: projectIds为空')
      return []
    }
    
    for (const reviewId of projectIds) {
      console.log(`\n🔍 处理评审记录ID: ${reviewId}`)
      
      try {
        // 通过月度评审记录ID找到对应的评审记录
        const review = reviews.find(r => r.id === reviewId)
        if (!review) {
          console.warn(`⚠️ 未找到评审记录 ${reviewId}`)
          console.log(`  可用的评审记录IDs: ${reviews.map(r => r.id).join(', ')}`)
          continue
        }
        
        console.log(`✅ 找到评审记录: ${review.projectName} (状态: ${review.status})`)
        
        // 通过评审记录中的projectId找到对应的项目
        const project = projects.find(p => p.id === review.projectId)
        if (!project) {
          console.warn(`⚠️ 未找到项目 ${review.projectId}`)
          console.log(`  可用的项目IDs: ${projects.map(p => p.id).join(', ')}`)
          continue
        }
        
        console.log(`✅ 找到项目: ${project.name} (状态: ${project.status}, 负责人: ${project.owner})`)
        
        // 1. 添加项目负责人（中心专职）
        const owner = mockUsers.find(u => u.name === project.owner)
        if (owner && !relatedUserIds.has(owner.id)) {
          relatedUserIds.add(owner.id)
          relatedUsers.push(owner)
          console.log(`✅ 添加项目负责人: ${owner.name} (ID: ${owner.id}, 角色: ${owner.role})`)
        } else if (!owner) {
          console.warn(`⚠️ 未找到项目负责人用户: ${project.owner}`)
          console.log(`  可用用户: ${mockUsers.map(u => u.name).join(', ')}`)
        }
        
        // 2. 添加项目所属中心的领导（中心领导）
        if (project.center) {
          const centerLeader = mockUsers.find(u => u.role === "中心领导" && u.center === project.center)
          if (centerLeader && !relatedUserIds.has(centerLeader.id)) {
            relatedUserIds.add(centerLeader.id)
            relatedUsers.push(centerLeader)
            console.log(`✅ 添加中心领导: ${centerLeader.name} (ID: ${centerLeader.id})`)
          } else if (!centerLeader) {
            console.warn(`⚠️ 未找到中心领导: 中心=${project.center}`)
          }
        }
        
        // 3. 添加项目所属部门的领导（部门领导）
        if (project.department) {
          const deptLeader = mockUsers.find(u => u.role === "部门领导" && u.department === project.department)
          if (deptLeader && !relatedUserIds.has(deptLeader.id)) {
            relatedUserIds.add(deptLeader.id)
            relatedUsers.push(deptLeader)
            console.log(`✅ 添加部门领导: ${deptLeader.name} (ID: ${deptLeader.id})`)
          } else if (!deptLeader) {
            console.warn(`⚠️ 未找到部门领导: 部门=${project.department}`)
          }
        }
        
        // 4. 添加评审人（发展策划部专职）
        const reviewer = mockUsers.find(u => u.name === review.reviewer)
        if (reviewer && !relatedUserIds.has(reviewer.id)) {
          relatedUserIds.add(reviewer.id)
          relatedUsers.push(reviewer)
          console.log(`✅ 添加评审人: ${reviewer.name} (ID: ${reviewer.id}, 角色: ${reviewer.role})`)
        } else if (!reviewer) {
          console.warn(`⚠️ 未找到评审人用户: ${review.reviewer}`)
        }
        
      } catch (error) {
        console.error(`❌ 处理项目ID ${reviewId} 时出错:`, error)
        continue
      }
    }
    
    console.log(`\n📊 getProjectRelatedUsers 结果:`)
    console.log(`  - 找到 ${relatedUsers.length} 个相关用户`)
    console.log(`  - 用户列表: ${relatedUsers.map(u => `${u.name}(${u.role}, ID:${u.id})`).join(', ')}`)
    
    return relatedUsers
  } catch (error) {
    console.error('❌ getProjectRelatedUsers: 函数执行失败:', error)
    return []
  }
}

// 获取分管院领导
export const getInstituteLeader = (): User | null => {
  return mockUsers.find(u => u.role === "分管院领导") || null
}

// 启动批复报告审批流程
export const startApprovalReportWorkflow = async (reportId: string): Promise<void> => {
  try {
    const reports = await getApprovalReports()
    const report = reports.find(r => r.id === reportId)
    
    if (!report) {
      throw new Error(`批复报告不存在: ${reportId}`)
    }
    
    console.log(`启动批复报告审批流程: ${reportId}`)
    
    // 直接进入主流程的顺序确认，跳过子流程
    // 更新报告状态为"确认中"，表示进入主流程
    await updateApprovalReport(reportId, { status: "确认中" })
    
    // 主流程：只为第一个角色（中心专职）创建待办事项
    const centerSpecialist = mockUsers.find(u => u.role === "中心专职")
    if (centerSpecialist) {
      await addTodoItem({
        type: "approval_report_confirm",
        title: `批复报告确认：${report.templateName}`,
        description: `请作为中心专职确认批复报告内容（第1步）`,
        relatedId: reportId,
        assignedTo: centerSpecialist.id,
        assignedBy: "系统自动",
        status: "待处理",
        priority: "高"
      })
      console.log(`为中心专职创建第1步待办事项: ${reportId}`)
    }
    
  } catch (error) {
    console.error(`启动批复报告审批流程失败 (${reportId}):`, error)
    throw error
  }
}

// 检查主流程是否完成并推进到下一步（重命名为更准确的函数名）
export const checkAndAdvanceApprovalWorkflow = async (reportId: string): Promise<void> => {
  // 这个函数现在只是为了保持兼容性，实际逻辑转移到 checkMainWorkflowAndAdvance
  await checkMainWorkflowAndAdvance(reportId)
}

// 检查主流程顺序确认并推进到下一步
export const checkMainWorkflowAndAdvance = async (reportId: string): Promise<void> => {
  try {
    const report = (await getApprovalReports()).find(r => r.id === reportId)
    if (!report) {
      throw new Error('批复报告不存在')
    }
    
    // 获取所有相关的确认待办事项
    const todoItems = await getTodoItems()
    const mainWorkflowTodos = todoItems.filter(todo => 
      todo.relatedId === reportId && 
      todo.type === "approval_report_confirm" && 
      todo.assignedBy === "系统自动"
    )
    
    // 检查当前完成的步骤
    const completedTodos = mainWorkflowTodos.filter(todo => todo.status === "已处理")
    const currentStep = completedTodos.length
    
    console.log(`批复报告 ${reportId} 主流程当前步骤: ${currentStep}`)
    
    // 根据当前步骤创建下一步的待办事项
    if (currentStep === 1) {
      // 第1步（中心专职）完成，创建第2步（中心领导）
      const centerLeader = mockUsers.find(u => u.role === "中心领导")
      if (centerLeader) {
        await addTodoItem({
          type: "approval_report_confirm",
          title: `批复报告确认：${report.templateName}`,
          description: `中心专职已确认，请作为中心领导确认批复报告内容（第2步）`,
          relatedId: reportId,
          assignedTo: centerLeader.id,
          assignedBy: "系统自动",
          status: "待处理",
          priority: "高"
        })
        console.log(`为中心领导创建第2步待办事项: ${reportId}`)
      }
    } else if (currentStep === 2) {
      // 第2步（中心领导）完成，创建第3步（发展策划部专职）
      const deptSpecialist = mockUsers.find(u => u.role === "部门专职" && u.department === "发展策划部门")
      if (deptSpecialist) {
        await addTodoItem({
          type: "approval_report_confirm",
          title: `批复报告确认：${report.templateName}`,
          description: `中心专职、中心领导已确认，请作为发展策划部专职确认批复报告内容（第3步）`,
          relatedId: reportId,
          assignedTo: deptSpecialist.id,
          assignedBy: "系统自动",
          status: "待处理",
          priority: "高"
        })
        console.log(`为发展策划部专职创建第3步待办事项: ${reportId}`)
      }
    } else if (currentStep === 3) {
      // 第3步（发展策划部专职）完成，提交给分管院领导
      const instituteLeader = getInstituteLeader()
      if (!instituteLeader) {
        throw new Error('未找到分管院领导')
      }
      
      // 创建院领导的最终审批待办
              await addTodoItem({
          type: "approval_report_approve",
          title: `批复报告最终审批：${report.templateName}`,
          description: `三步确认已完成，请进行最终审批决策`,
          relatedId: reportId,
          assignedTo: instituteLeader.id,
          assignedBy: "系统自动",
          status: "待处理",
          priority: "高"
        })
        
        // 更新报告状态为"待审批"
        await updateApprovalReport(reportId, { 
          status: "待审批",
          finalApprover: instituteLeader.id
        })
        
        console.log(`三步确认完成，已提交给分管院领导审批: ${reportId}`)
    }
  } catch (error) {
    console.error('Failed to check main workflow and advance:', error)
    throw error
  }
}

// 分管院领导审批批复报告
export const approveApprovalReport = async (reportId: string, approved: boolean, comments?: string): Promise<void> => {
  try {
    const newStatus: ApprovalReportStatus = approved ? "已审批" : "已驳回"
    
    await updateApprovalReport(reportId, {
      status: newStatus,
      finalApprovedAt: new Date().toISOString(),
      finalApprovalComments: comments
    })
    
    const report = (await getApprovalReports()).find(r => r.id === reportId)
    if (report) {
      if (approved) {
        // 审批通过：所有相关项目状态变为"批复"
        console.log(`批复报告审批通过，更新项目状态为"批复": ${reportId}`)
        for (const reviewId of report.selectedProjects) {
          // 通过月度评审记录ID找到对应的评审记录
          const reviews = await getMonthlyReviews()
          const review = reviews.find(r => r.id === reviewId)
          if (review) {
            // 更新项目状态为"批复"
            await updateProject(review.projectId, { status: "批复" })
            console.log(`项目 ${review.projectName} 状态已更新为"批复"`)
          }
        }
      } else {
        // 审批不通过：所有相关项目状态变为"编制"
        console.log(`批复报告审批不通过，更新项目状态为"编制": ${reportId}`)
        for (const reviewId of report.selectedProjects) {
          // 通过月度评审记录ID找到对应的评审记录
          const reviews = await getMonthlyReviews()
          const review = reviews.find(r => r.id === reviewId)
          if (review) {
            // 更新项目状态回到"编制"，清除审批标记，使项目可以重新编辑和提交
            await updateProject(review.projectId, { 
              status: "编制",
              isSubmittedForApproval: false,
              approvalId: undefined
            })
            console.log(`项目 ${review.projectName} 状态已回退为"编制"`)
            
            // 同时将月度评审记录状态也重置，允许重新发起评审
            await updateMonthlyReview(review.id, {
              status: "待评审",
              comments: `批复报告被驳回，项目需要重新修改。驳回原因：${comments || '无具体说明'}`
            })
          }
        }
        
        // 创建通知待办给项目负责人和相关人员
        const relatedUsers = await getProjectRelatedUsers(report.selectedProjects)
        for (const user of relatedUsers) {
          await addTodoItem({
            type: "approval_report_confirm", // 复用确认类型，但用于通知
            title: `批复报告被驳回通知：${report.templateName}`,
            description: `批复报告已被分管院领导驳回，相关项目已回退到编制状态，请重新修改后提交。驳回原因：${comments || '无具体说明'}`,
            relatedId: reportId,
            assignedTo: user.id,
            assignedBy: "系统通知",
            status: "待处理",
            priority: "高"
          })
        }
      }
    }
  } catch (error) {
    console.error('Failed to approve approval report:', error)
    throw error
  }
}

// 同步更新所有相关数据
  projects = projects.map((p) => ({
    ...p,
    owner: p.owner === "宋晓峰" ? "拓总" : p.owner === "邓慧敏" ? "邵主任" : p.owner,
    name: p.name.replace(/宋晓峰/g, "拓总").replace(/邓慧敏/g, "邵主任"),
  }));
  approvals = approvals.map((a) => ({
    ...a,
    submitter: a.submitter === "宋晓峰" ? "拓总" : a.submitter === "邓慧敏" ? "邵主任" : a.submitter,
    approver: a.approver === "宋晓峰" ? "拓总" : a.approver === "邓慧敏" ? "邵主任" : a.approver,
    projectName: a.projectName.replace(/宋晓峰/g, "拓总").replace(/邓慧敏/g, "邵主任"),
  }));
  monthlyReviews.forEach((r) => {
    if (r.reviewer === "宋晓峰") r.reviewer = "拓总";
    if (r.reviewer === "邓慧敏") r.reviewer = "邵主任";
    if (r.projectName.includes("宋晓峰")) r.projectName = r.projectName.replace(/宋晓峰/g, "拓总");
    if (r.projectName.includes("邓慧敏")) r.projectName = r.projectName.replace(/邓慧敏/g, "邵主任");
  });

// 月度审核参与人确认相关函数
export const getMonthlyReviewParticipantConfirmations = async (): Promise<MonthlyReviewParticipantConfirmation[]> => {
  const data = loadFromLocalStorage('monthlyReviewParticipantConfirmations', [])
  return data
}

export const addMonthlyReviewParticipantConfirmation = async (confirmation: Omit<MonthlyReviewParticipantConfirmation, "id">): Promise<MonthlyReviewParticipantConfirmation> => {
  const confirmations = await getMonthlyReviewParticipantConfirmations()
  const newConfirmation: MonthlyReviewParticipantConfirmation = {
    ...confirmation,
    id: `mrc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  confirmations.push(newConfirmation)
  saveToLocalStorage('monthlyReviewParticipantConfirmations', confirmations)
  
  console.log(`添加月度审核参与人确认记录: ${newConfirmation.userName} (会议组: ${newConfirmation.meetingGroup})`)
  return newConfirmation
}

export const updateMonthlyReviewParticipantConfirmation = async (id: string, updates: Partial<MonthlyReviewParticipantConfirmation>): Promise<MonthlyReviewParticipantConfirmation | null> => {
  const confirmations = await getMonthlyReviewParticipantConfirmations()
  const index = confirmations.findIndex(c => c.id === id)
  
  if (index === -1) {
    console.warn(`月度审核参与人确认记录不存在: ${id}`)
    return null
  }
  
  const updatedConfirmation = { ...confirmations[index], ...updates }
  confirmations[index] = updatedConfirmation
  saveToLocalStorage('monthlyReviewParticipantConfirmations', confirmations)
  
  console.log(`更新月度审核参与人确认记录: ${updatedConfirmation.userName}`)
  return updatedConfirmation
}

export const getConfirmationsByMeetingGroup = async (meetingGroup: string): Promise<MonthlyReviewParticipantConfirmation[]> => {
  const confirmations = await getMonthlyReviewParticipantConfirmations()
  return confirmations.filter(c => c.meetingGroup === meetingGroup)
}

// 获取项目参与人按操作时间排序
export const getProjectParticipantsByTimeOrder = async (projectIds: string[]): Promise<{user: User, projects: Project[], order: number}[]> => {
  try {
    const reviews = await getMonthlyReviews()
    const projects = await getProjects()
    
    // 获取相关的项目信息
    const relatedProjects: Project[] = []
    const participantMap = new Map<string, {user: User, projects: Project[]}>()
    
    for (const reviewId of projectIds) {
      const review = reviews.find(r => r.id === reviewId)
      if (!review) continue
      
      const project = projects.find(p => p.id === review.projectId)
      if (!project) continue
      
      relatedProjects.push(project)
      
      // 获取项目负责人
      const owner = mockUsers.find(u => u.name === project.owner)
      if (owner) {
        if (!participantMap.has(owner.id)) {
          participantMap.set(owner.id, {user: owner, projects: []})
        }
        participantMap.get(owner.id)!.projects.push(project)
      }
      
      // 获取中心领导
      if (project.center) {
        const centerLeader = mockUsers.find(u => u.role === "中心领导" && u.center === project.center)
        if (centerLeader) {
          if (!participantMap.has(centerLeader.id)) {
            participantMap.set(centerLeader.id, {user: centerLeader, projects: []})
          }
          participantMap.get(centerLeader.id)!.projects.push(project)
        }
      }
      
      // 获取部门领导
      if (project.department) {
        const deptLeader = mockUsers.find(u => u.role === "部门领导" && u.department === project.department)
        if (deptLeader) {
          if (!participantMap.has(deptLeader.id)) {
            participantMap.set(deptLeader.id, {user: deptLeader, projects: []})
          }
          participantMap.get(deptLeader.id)!.projects.push(project)
        }
      }
    }
    
    // 按项目创建时间排序（模拟操作时间顺序）
    const participantsWithOrder = Array.from(participantMap.values()).map((participant, index) => {
      // 获取参与人最早的项目创建时间作为排序依据
      const earliestProjectTime = Math.min(...participant.projects.map(p => new Date(p.createdAt).getTime()))
      return {
        ...participant,
        order: index + 1,
        earliestTime: earliestProjectTime
      }
    })
    
    // 按最早项目时间排序
    participantsWithOrder.sort((a, b) => a.earliestTime - b.earliestTime)
    
    // 重新分配顺序号
    return participantsWithOrder.map((participant, index) => ({
      user: participant.user,
      projects: participant.projects,
      order: index + 1
    }))
    
  } catch (error) {
    console.error('获取项目参与人时间顺序失败:', error)
    return []
  }
}

// 启动月度审核参与人确认流程
export const startMonthlyReviewParticipantConfirmation = async (meetingGroup: string, projectIds: string[]): Promise<void> => {
  try {
    console.log(`启动月度审核参与人确认流程: 会议组=${meetingGroup}, 项目数=${projectIds.length}`)
    
    // 获取项目参与人按时间顺序
    const participantsWithOrder = await getProjectParticipantsByTimeOrder(projectIds)
    
    if (participantsWithOrder.length === 0) {
      console.warn(`会议组 ${meetingGroup} 没有找到项目参与人`)
      return
    }
    
    console.log(`为会议组 ${meetingGroup} 创建 ${participantsWithOrder.length} 个参与人确认记录`)
    
    // 为每个参与人创建确认记录和待办事项
    for (const participantInfo of participantsWithOrder) {
      try {
        // 创建参与人确认记录
        await addMonthlyReviewParticipantConfirmation({
          meetingGroup: meetingGroup,
          userId: participantInfo.user.id,
          userName: participantInfo.user.name,
          projectIds: participantInfo.projects.map(p => p.id),
          status: "待确认",
          confirmationOrder: participantInfo.order
        })
        
        // 创建待办事项
        const projectNames = participantInfo.projects.map(p => p.name).join('、')
        await addTodoItem({
          type: "monthly_review_participant_confirm",
          title: `月度审核参与人确认（第${participantInfo.order}步）`,
          description: `请确认您参与的项目（${projectNames}）的批复报告内容是否准确`,
          relatedId: meetingGroup,
          assignedTo: participantInfo.user.id,
          assignedBy: "系统",
          status: "待处理",
          priority: "高",
          projectIds: participantInfo.projects.map(p => p.id),
          confirmationOrder: participantInfo.order
        })
        
        console.log(`为用户 ${participantInfo.user.name} 创建了参与人确认记录和待办事项（顺序：${participantInfo.order}）`)
      } catch (error) {
        console.error(`为用户 ${participantInfo.user.name} 创建确认记录失败:`, error)
      }
    }
    
  } catch (error) {
    console.error(`启动月度审核参与人确认流程失败 (${meetingGroup}):`, error)
    throw error
  }
}

// 检查参与人确认是否完成
export const checkMonthlyReviewParticipantConfirmation = async (meetingGroup: string): Promise<boolean> => {
  try {
    const confirmations = await getConfirmationsByMeetingGroup(meetingGroup)
    
    if (confirmations.length === 0) {
      return false
    }
    
    // 检查是否所有参与人都已确认
    const allConfirmed = confirmations.every(conf => conf.status === "已确认")
    
    console.log(`会议组 ${meetingGroup} 参与人确认状态: ${confirmations.length} 个参与人，${confirmations.filter(c => c.status === "已确认").length} 个已确认`)
    
    return allConfirmed
  } catch (error) {
    console.error(`检查参与人确认状态失败 (${meetingGroup}):`, error)
    return false
  }
}

// ================== 综合计划管理函数 ==================

// 获取综合计划列表
export const getComprehensivePlans = async (): Promise<ComprehensivePlan[]> => {
  try {
    const plans = loadFromLocalStorage('comprehensivePlans', [])
    return plans
  } catch (error) {
    console.error('获取综合计划失败:', error)
    return []
  }
}

// 添加综合计划
export const addComprehensivePlan = async (plan: Omit<ComprehensivePlan, "id" | "createdAt" | "updatedAt">): Promise<ComprehensivePlan> => {
  try {
    const plans = await getComprehensivePlans()
    const newPlan: ComprehensivePlan = {
      ...plan,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    const updatedPlans = [...plans, newPlan]
    saveToLocalStorage('comprehensivePlans', updatedPlans)
    
    return newPlan
  } catch (error) {
    console.error('添加综合计划失败:', error)
    throw error
  }
}

// 更新综合计划
export const updateComprehensivePlan = async (id: string, updates: Partial<ComprehensivePlan>): Promise<ComprehensivePlan | null> => {
  try {
    const plans = await getComprehensivePlans()
    const planIndex = plans.findIndex(p => p.id === id)
    
    if (planIndex === -1) {
      return null
    }
    
    const updatedPlan = {
      ...plans[planIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    plans[planIndex] = updatedPlan
    saveToLocalStorage('comprehensivePlans', plans)
    
    return updatedPlan
  } catch (error) {
    console.error('更新综合计划失败:', error)
    return null
  }
}

// 获取当前年份的综合计划
export const getCurrentYearPlans = async (): Promise<ComprehensivePlan[]> => {
  const currentYear = new Date().getFullYear()
  const plans = await getComprehensivePlans()
  
  // 返回当前年份和下一年份的计划，隐藏过往年份
  return plans.filter(plan => plan.year >= currentYear && plan.year <= currentYear + 1)
}

// 初始化年度综合计划（系统自动生成）
export const initializeYearlyPlans = async (): Promise<void> => {
  const currentYear = new Date().getFullYear()
  const plans = await getComprehensivePlans()
  
  // 检查当前年份和下一年份的计划是否存在
  const currentYearPlan = plans.find(p => p.year === currentYear)
  const nextYearPlan = plans.find(p => p.year === currentYear + 1)
  
  if (!currentYearPlan) {
    await addComprehensivePlan({
      year: currentYear,
      name: `${currentYear}年度综合计划`,
      status: "草稿",
      createdBy: "系统",
      projectIds: [],
      description: `${currentYear}年度综合计划表单`
    })
  }
  
  if (!nextYearPlan) {
    await addComprehensivePlan({
      year: currentYear + 1,
      name: `${currentYear + 1}年度综合计划`,
      status: "草稿",
      createdBy: "系统",
      projectIds: [],
      description: `${currentYear + 1}年度综合计划表单`
    })
  }
}

// 将储备项目添加到综合计划
export const addProjectsToComprehensivePlan = async (planId: string, projectIds: string[]): Promise<boolean> => {
  try {
    const plan = (await getComprehensivePlans()).find(p => p.id === planId)
    if (!plan) {
      return false
    }
    
    // 合并项目ID，避免重复
    const updatedProjectIds = [...new Set([...plan.projectIds, ...projectIds])]
    
    // 更新综合计划
    const result = await updateComprehensivePlan(planId, {
      projectIds: updatedProjectIds
    })
    
    if (result) {
      // 更新储备项目状态为"下达"
      for (const projectId of projectIds) {
        await updateProject(projectId, { status: "下达" })
      }
      return true
    }
    
    return false
  } catch (error) {
    console.error('添加项目到综合计划失败:', error)
    return false
  }
}

// 获取已编制到综合计划中的项目
export const getProjectsInComprehensivePlans = async (currentUser: User): Promise<Project[]> => {
  try {
    const plans = await getCurrentYearPlans()
    const allProjects = await getProjects()
    
    // 获取所有综合计划中的项目ID
    const projectIdsInPlans = new Set<string>()
    plans.forEach(plan => {
      plan.projectIds.forEach(id => projectIdsInPlans.add(id))
    })
    
    // 根据项目ID获取项目详情
    const projectsInPlans = allProjects.filter(project => projectIdsInPlans.has(project.id))
    
    // 根据用户权限过滤项目
    if (currentUser.role === "中心领导") {
      return projectsInPlans.filter((p) => p.center === currentUser.center && p.department === "")
    } else if (currentUser.role === "中心专职") {
      return projectsInPlans.filter((p) => p.owner === currentUser.name)
    } else if (currentUser.role === "部门专职") {
      if (currentUser.department === "发展策划部门") {
        return projectsInPlans.filter((p) => p.center !== "" && p.department === "")
      }
      return projectsInPlans.filter((p) => p.owner === currentUser.name)
    } else if (currentUser.role === "部门领导") {
      if (currentUser.department === "发展策划部门") {
        return projectsInPlans.filter((p) => p.center !== "" && p.department === "")
      }
      return projectsInPlans.filter((p) => p.department === currentUser.department)
    }
    
    return []
  } catch (error) {
    console.error('获取综合计划中的项目失败:', error)
    return []
  }
}

// 从综合计划中移除项目
export const removeProjectFromComprehensivePlan = async (planId: string, projectId: string): Promise<boolean> => {
  try {
    const plans = await getComprehensivePlans()
    const plan = plans.find(p => p.id === planId)
    
    if (!plan) {
      console.error('Comprehensive plan not found:', planId)
      return false
    }

    // 从项目列表中移除指定项目
    const updatedProjectIds = plan.projectIds.filter(id => id !== projectId)
    
    const updatedPlan = await updateComprehensivePlan(planId, {
      projectIds: updatedProjectIds
    })

    return updatedPlan !== null
  } catch (error) {
    console.error('Error removing project from comprehensive plan:', error)
    return false
  }
}

// 合同数据管理函数
export const getContracts = async (): Promise<Contract[]> => {
  console.log('getContracts函数被调用，当前全局contracts长度:', contracts.length)
  
  if (contracts.length === 0) {
    console.log('全局contracts为空，从localStorage加载...')
    contracts = initializeContractsFromStorage()
    console.log('从localStorage加载的合同数据:', contracts)
  }
  
  console.log('getContracts返回合同数据长度:', contracts.length)
  return contracts
}

export const addContract = async (contract: Omit<Contract, "id">): Promise<Contract> => {
  const currentContracts = await getContracts()
  const newContract: Contract = {
    ...contract,
    id: Date.now().toString()
  }
  
  contracts = [newContract, ...currentContracts]
  saveToLocalStorage('contracts', contracts)
  
  return newContract
}

export const updateContract = async (id: string, updates: Partial<Contract>): Promise<Contract | null> => {
  const currentContracts = await getContracts()
  const contractIndex = currentContracts.findIndex(c => c.id === id)
  
  if (contractIndex === -1) {
    console.error('Contract not found:', id)
    return null
  }
  
  const updatedContract = { ...currentContracts[contractIndex], ...updates }
  contracts[contractIndex] = updatedContract
  
  saveToLocalStorage('contracts', contracts)
  return updatedContract
}

export const deleteContract = async (id: string): Promise<boolean> => {
  const currentContracts = await getContracts()
  const filteredContracts = currentContracts.filter(c => c.id !== id)
  
  if (filteredContracts.length === currentContracts.length) {
    console.error('Contract not found:', id)
    return false
  }
  
  contracts = filteredContracts
  saveToLocalStorage('contracts', contracts)
  return true
}

export const getContractsByProjectId = async (projectId: string): Promise<Contract[]> => {
  const currentContracts = await getContracts()
  return currentContracts.filter(contract => 
    contract.boundProjectId === projectId
  )
}

export const bindProjectToContract = async (contractId: string, projectId: string): Promise<boolean> => {
  const updatedContract = await updateContract(contractId, { boundProjectId: projectId })
  return updatedContract !== null
}

// 进度报销数据模型
export interface ProgressReimbursement {
  id: string
  contractId: string // 关联的合同ID
  contractCode: string // 合同编号
  contractName: string // 合同名称
  contractAmount: number // 合同总金额
  progressType: 'milestone' | 'percentage' // 进度类型：里程碑完成 | 百分比完成
  milestoneDescription?: string // 里程碑描述（里程碑完成时必填）
  completionPercentage?: number // 完成百分比（百分比完成时必填）
  payableAmount: number // 应付金额（自动计算：合同金额 × 完成比例）
  
  // 报销信息
  reimbursementType: 'travel' | 'material' | 'outsourcing' // 报销类型：差旅费 | 材料费 | 外包服务费
  reimbursementAmount: number // 报销金额（≤本次进度应付金额）
  reimbursementDescription: string // 报销说明
  
  // 附件信息
  acceptanceCertificate?: string // 验收证明（里程碑完成时需要）
  invoiceFiles?: string[] // 发票文件（差旅费需要车票/住宿发票）
  purchaseOrderFiles?: string[] // 采购订单文件（材料费需要）
  serviceContractFiles?: string[] // 服务合同文件（外包服务费需要）
  
  // 状态和审批信息
  status: 'draft' | 'submitted' | 'dept_manager_approved' | 'finance_approved' | 'paid' | 'rejected' // 状态
  submittedAt?: string // 提交时间
  submittedBy: string // 提交人
  deptManagerApprovalAt?: string // 部门经理审批时间
  deptManagerApprovalBy?: string // 部门经理审批人
  deptManagerComment?: string // 部门经理审批意见
  financeApprovalAt?: string // 财务审批时间
  financeApprovalBy?: string // 财务审批人
  financeComment?: string // 财务审批意见
  paidAt?: string // 支付时间
  rejectedAt?: string // 驳回时间
  rejectedBy?: string // 驳回人
  rejectedReason?: string // 驳回原因
  
  createdAt: string
  updatedAt: string
}

// 开票管理数据模型
export interface InvoiceManagement {
  id: string
  contractId: string // 关联的合同ID
  contractCode: string // 合同编号
  contractName: string // 合同名称
  contractAmount: number // 合同总金额
  
  // 开票模式
  invoiceMode: 'auto' | 'manual' // 开票模式：自动触发 | 手动创建
  relatedProgressIds?: string[] // 关联的进度报销ID（自动触发时）
  
  // 开票信息
  invoiceNumber: string // 发票号码（系统查重校验）
  invoiceAmount: number // 开票金额（≤合同剩余金额）
  invoiceDate: string // 开票日期
  invoiceType: 'normal' | 'red_reverse' | 'partial' // 票据类型：正常开票 | 红冲处理 | 部分开票
  originalInvoiceId?: string // 原发票ID（红冲处理时）
  partialReason?: string // 部分开票原因
  
  // 状态和回款信息
  status: 'issued' | 'pending_payment' | 'partial_payment' | 'full_payment' | 'overdue_15' | 'overdue_30' | 'cancelled' // 状态
  issuedAt: string // 开票时间
  issuedBy: string // 开票人
  expectedPaymentDate: string // 预期回款日期
  actualPaymentDate?: string // 实际回款日期
  paidAmount: number // 已回款金额
  remainingAmount: number // 剩余回款金额
  
  // 预警信息
  warningLevel: 'none' | 'warning_15' | 'serious_30' // 预警级别
  lastWarningAt?: string // 最后预警时间
  
  // 审计信息
  cancelledAt?: string // 作废时间
  cancelledBy?: string // 作废人
  cancelledReason?: string // 作废原因
  
  createdAt: string
  updatedAt: string
}

// 审计日志数据模型
export interface AuditLog {
  id: string
  entityType: 'progress_reimbursement' | 'invoice_management' | 'contract' // 实体类型
  entityId: string // 实体ID
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'cancel' // 操作类型
  fieldName?: string // 字段名（金额修改时）
  oldValue?: string // 原值
  newValue?: string // 新值
  operatorId: string // 操作人ID
  operatorName: string // 操作人姓名
  operatorIp: string // 操作IP地址
  comment?: string // 操作说明/审批意见
  timestamp: string // 操作时间戳
}

// 权限矩阵枚举
export enum PermissionMatrix {
  CREATE_PROGRESS_REIMBURSEMENT = 'create_progress_reimbursement', // 创建进度报销
  APPROVE_REIMBURSEMENT_DEPT = 'approve_reimbursement_dept', // 部门经理审批报销
  APPROVE_REIMBURSEMENT_FINANCE = 'approve_reimbursement_finance', // 财务审批报销
  MANUAL_INVOICE = 'manual_invoice', // 手动开票
  VIEW_AUDIT_LOG = 'view_audit_log', // 查看审计日志
  MODIFY_CONTRACT_AMOUNT = 'modify_contract_amount', // 修改合同金额
  VIEW_INVOICE_MANAGEMENT = 'view_invoice_management' // 查看开票管理页面
}

// 用户权限检查函数
export const checkUserPermission = (user: User, permission: PermissionMatrix): boolean => {
  switch (permission) {
    case PermissionMatrix.CREATE_PROGRESS_REIMBURSEMENT:
      // 中心专职和部门专职可以创建进度报销
      return user.role === '中心专职' || user.role === '部门专职'
    
    case PermissionMatrix.APPROVE_REIMBURSEMENT_DEPT:
      // 中心领导和部门领导可以审批报销
      return user.role === '中心领导' || user.role === '部门领导'
    
    case PermissionMatrix.APPROVE_REIMBURSEMENT_FINANCE:
      // 分管院领导和财务部门专职可以进行财务审批
      return user.role === '分管院领导' || (user.role === '部门专职' && user.department === '财务部')
    
    case PermissionMatrix.MANUAL_INVOICE:
      // 分管院领导和财务部门专职可以手动开票
      return user.role === '分管院领导' || (user.role === '部门专职' && user.department === '财务部')
    
    case PermissionMatrix.VIEW_AUDIT_LOG:
      // 分管院领导可以查看审计日志
      return user.role === '分管院领导'
    
    case PermissionMatrix.MODIFY_CONTRACT_AMOUNT:
      // 只有分管院领导可以修改合同金额
      return user.role === '分管院领导'
    
    case PermissionMatrix.VIEW_INVOICE_MANAGEMENT:
      // 只有财务部门专职可以查看开票管理页面
      return user.role === '部门专职' && user.department === '财务部'
    
    default:
      return false
  }
}

// ===== 进度报销管理相关函数 =====

// 内存存储
let progressReimbursements: ProgressReimbursement[] = []
let invoiceManagements: InvoiceManagement[] = []
let auditLogs: AuditLog[] = []
let contracts: Contract[] = []

// 初始化合同数据
const initializeContractsFromStorage = () => {
  if (typeof window === 'undefined') {
    return []
  }
  const data = loadFromLocalStorage('contracts', [])
  console.log('从localStorage初始化合同数据:', data)
  return data
}

// 初始化进度报销数据
const initializeProgressReimbursementsFromStorage = () => {
  if (typeof window === 'undefined') {
    return []
  }
  const data = loadFromLocalStorage('progress_reimbursements', [])
  return data
}

// 初始化开票管理数据
const initializeInvoiceManagementFromStorage = () => {
  if (typeof window === 'undefined') {
    return []
  }
  const data = loadFromLocalStorage('invoice_managements', [])
  return data
}

// 初始化审计日志数据
const initializeAuditLogsFromStorage = () => {
  if (typeof window === 'undefined') {
    return []
  }
  const data = loadFromLocalStorage('audit_logs', [])
  return data
}

// 生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 记录审计日志
const logAudit = (
  entityType: 'progress_reimbursement' | 'invoice_management' | 'contract',
  entityId: string,
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'cancel',
  operatorId: string,
  operatorName: string,
  comment?: string,
  fieldName?: string,
  oldValue?: string,
  newValue?: string
) => {
  const auditLog: AuditLog = {
    id: generateId(),
    entityType,
    entityId,
    action,
    fieldName,
    oldValue,
    newValue,
    operatorId,
    operatorName,
    operatorIp: '127.0.0.1', // 简化处理，实际应用中需要获取真实IP
    comment,
    timestamp: new Date().toISOString()
  }
  
  auditLogs.push(auditLog)
  saveToLocalStorage('audit_logs', auditLogs)
}

// ===== 进度报销相关函数 =====

export const getProgressReimbursements = async (): Promise<ProgressReimbursement[]> => {
  if (progressReimbursements.length === 0) {
    progressReimbursements = initializeProgressReimbursementsFromStorage()
  }
  return progressReimbursements
}

export const addProgressReimbursement = async (
  reimbursement: Omit<ProgressReimbursement, 'id' | 'createdAt' | 'updatedAt'>,
  operatorId: string,
  operatorName: string
): Promise<ProgressReimbursement> => {
  const newReimbursement: ProgressReimbursement = {
    ...reimbursement,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  progressReimbursements.push(newReimbursement)
  saveToLocalStorage('progress_reimbursements', progressReimbursements)
  
  // 记录审计日志
  logAudit('progress_reimbursement', newReimbursement.id, 'create', operatorId, operatorName, 
    `创建进度报销：${newReimbursement.contractName}`)
  
  return newReimbursement
}

export const updateProgressReimbursement = async (
  id: string,
  updates: Partial<ProgressReimbursement>,
  operatorId: string,
  operatorName: string,
  comment?: string
): Promise<ProgressReimbursement | null> => {
  const index = progressReimbursements.findIndex(p => p.id === id)
  if (index === -1) return null
  
  const original = progressReimbursements[index]
  const updated = {
    ...original,
    ...updates,
    updatedAt: new Date().toISOString()
  }
  
  progressReimbursements[index] = updated
  saveToLocalStorage('progress_reimbursements', progressReimbursements)
  
  // 记录关键字段变更的审计日志
  if (updates.reimbursementAmount !== undefined && updates.reimbursementAmount !== original.reimbursementAmount) {
    logAudit('progress_reimbursement', id, 'update', operatorId, operatorName, comment,
      'reimbursementAmount', original.reimbursementAmount.toString(), updates.reimbursementAmount.toString())
  }
  
  if (updates.status !== undefined && updates.status !== original.status) {
    logAudit('progress_reimbursement', id, 'update', operatorId, operatorName, comment,
      'status', original.status, updates.status)
  }
  
  return updated
}

export const getProgressReimbursementsByContract = async (contractId: string): Promise<ProgressReimbursement[]> => {
  const reimbursements = await getProgressReimbursements()
  return reimbursements.filter(r => r.contractId === contractId)
}

export const approveProgressReimbursement = async (
  id: string,
  approved: boolean,
  approverType: 'dept_manager' | 'finance',
  approverId: string,
  approverName: string,
  comment?: string
): Promise<ProgressReimbursement | null> => {
  const reimbursement = progressReimbursements.find(p => p.id === id)
  if (!reimbursement) return null
  
  const now = new Date().toISOString()
  const updates: Partial<ProgressReimbursement> = {}
  
  if (approverType === 'dept_manager') {
    updates.deptManagerApprovalAt = now
    updates.deptManagerApprovalBy = approverName
    updates.deptManagerComment = comment
    updates.status = approved ? 'dept_manager_approved' : 'rejected'
    
    if (!approved) {
      updates.rejectedAt = now
      updates.rejectedBy = approverName
      updates.rejectedReason = comment
    }
  } else if (approverType === 'finance') {
    updates.financeApprovalAt = now
    updates.financeApprovalBy = approverName
    updates.financeComment = comment
    updates.status = approved ? 'finance_approved' : 'rejected'
    
    if (!approved) {
      updates.rejectedAt = now
      updates.rejectedBy = approverName
      updates.rejectedReason = comment
    }
  }
  
  const result = await updateProgressReimbursement(id, updates, approverId, approverName, comment)
  
  // 记录审批日志
  logAudit('progress_reimbursement', id, approved ? 'approve' : 'reject', approverId, approverName, comment)
  
  // 如果财务审批通过，自动创建开票待办事项
  if (approved && approverType === 'finance' && result) {
    await createInvoiceTodoItem(result)
  }
  
  return result
}

// 创建开票待办事项
const createInvoiceTodoItem = async (reimbursement: ProgressReimbursement): Promise<void> => {
  // 这里可以添加创建开票待办事项的逻辑
  console.log(`为进度报销 ${reimbursement.id} 创建开票待办事项`)
}

// ===== 开票管理相关函数 =====

export const getInvoiceManagements = async (): Promise<InvoiceManagement[]> => {
  if (invoiceManagements.length === 0) {
    invoiceManagements = initializeInvoiceManagementFromStorage()
  }
  return invoiceManagements
}

export const addInvoiceManagement = async (
  invoice: Omit<InvoiceManagement, 'id' | 'createdAt' | 'updatedAt'>,
  operatorId: string,
  operatorName: string
): Promise<InvoiceManagement> => {
  // 检查发票号码是否重复
  const existingInvoice = invoiceManagements.find(i => i.invoiceNumber === invoice.invoiceNumber)
  if (existingInvoice) {
    throw new Error(`发票号码 ${invoice.invoiceNumber} 已存在`)
  }
  
  const newInvoice: InvoiceManagement = {
    ...invoice,
    id: generateId(),
    remainingAmount: invoice.invoiceAmount,
    warningLevel: 'none',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  invoiceManagements.push(newInvoice)
  saveToLocalStorage('invoice_managements', invoiceManagements)
  
  // 记录审计日志
  logAudit('invoice_management', newInvoice.id, 'create', operatorId, operatorName, 
    `创建发票：${newInvoice.invoiceNumber}，金额：${newInvoice.invoiceAmount}`)
  
  return newInvoice
}

export const updateInvoiceManagement = async (
  id: string,
  updates: Partial<InvoiceManagement>,
  operatorId: string,
  operatorName: string,
  comment?: string
): Promise<InvoiceManagement | null> => {
  const index = invoiceManagements.findIndex(i => i.id === id)
  if (index === -1) return null
  
  const original = invoiceManagements[index]
  const updated = {
    ...original,
    ...updates,
    updatedAt: new Date().toISOString()
  }
  
  invoiceManagements[index] = updated
  saveToLocalStorage('invoice_managements', invoiceManagements)
  
  // 记录关键字段变更的审计日志
  if (updates.invoiceAmount !== undefined && updates.invoiceAmount !== original.invoiceAmount) {
    logAudit('invoice_management', id, 'update', operatorId, operatorName, comment,
      'invoiceAmount', original.invoiceAmount.toString(), updates.invoiceAmount.toString())
  }
  
  if (updates.status !== undefined && updates.status !== original.status) {
    logAudit('invoice_management', id, 'update', operatorId, operatorName, comment,
      'status', original.status, updates.status)
  }
  
  return updated
}

export const getInvoiceManagementsByContract = async (contractId: string): Promise<InvoiceManagement[]> => {
  const invoices = await getInvoiceManagements()
  return invoices.filter(i => i.contractId === contractId)
}

// 验证开票条件
export const validateInvoiceConditions = async (contractId: string, invoiceAmount: number): Promise<{valid: boolean, message?: string}> => {
  const allContracts = await getContracts()
  const contract = allContracts.find((c: Contract) => c.id === contractId)
  if (!contract) {
    return { valid: false, message: '合同不存在' }
  }
  
  // 根据用户反馈，不需要校验合同状态，只校验金额相关条件
  
  // 计算累计开票额
  const existingInvoices = await getInvoiceManagementsByContract(contractId)
  const totalInvoiced = existingInvoices
    .filter(i => i.status !== 'cancelled')
    .reduce((sum, i) => sum + i.invoiceAmount, 0)
  
  // 检查累计开票额是否超过合同金额
  if (totalInvoiced >= contract.amount) {
    return { valid: false, message: '累计开票额已达到合同金额上限，禁止开票' }
  }
  
  // 检查本次开票金额是否超过剩余金额
  const remainingAmount = contract.amount - totalInvoiced
  if (invoiceAmount > remainingAmount) {
    return { valid: false, message: `开票金额超过合同剩余金额 ¥${remainingAmount.toLocaleString()}` }
  }
  
  return { valid: true }
}

// 处理回款
export const processPayment = async (
  id: string,
  paidAmount: number,
  operatorId: string,
  operatorName: string,
  isPartial: boolean = false
): Promise<InvoiceManagement | null> => {
  const invoice = invoiceManagements.find(i => i.id === id)
  if (!invoice) return null
  
  const newPaidAmount = invoice.paidAmount + paidAmount
  const newRemainingAmount = invoice.invoiceAmount - newPaidAmount
  
  let newStatus: InvoiceManagement['status'] = invoice.status
  if (newRemainingAmount <= 0) {
    newStatus = 'full_payment'
  } else if (newPaidAmount > 0) {
    newStatus = 'partial_payment'
  }
  
  const updates: Partial<InvoiceManagement> = {
    paidAmount: newPaidAmount,
    remainingAmount: newRemainingAmount,
    status: newStatus,
    actualPaymentDate: isPartial ? undefined : new Date().toISOString()
  }
  
  const result = await updateInvoiceManagement(id, updates, operatorId, operatorName, 
    `处理回款：${paidAmount}，${isPartial ? '部分' : '全额'}回款`)
  
  return result
}

// 红冲处理
export const redReverseInvoice = async (
  originalInvoiceId: string,
  operatorId: string,
  operatorName: string,
  reason: string
): Promise<InvoiceManagement | null> => {
  const originalInvoice = invoiceManagements.find(i => i.id === originalInvoiceId)
  if (!originalInvoice) return null
  
  // 创建红冲发票
  const redInvoice: Omit<InvoiceManagement, 'id' | 'createdAt' | 'updatedAt'> = {
    ...originalInvoice,
    invoiceNumber: `${originalInvoice.invoiceNumber}-红冲`,
    invoiceAmount: -originalInvoice.invoiceAmount,
    invoiceType: 'red_reverse',
    originalInvoiceId: originalInvoiceId,
    status: 'issued',
    issuedBy: operatorName,
    paidAmount: 0,
    remainingAmount: -originalInvoice.invoiceAmount,
    warningLevel: 'none'
  }
  
  const newRedInvoice = await addInvoiceManagement(redInvoice, operatorId, operatorName)
  
  // 更新原发票状态
  await updateInvoiceManagement(originalInvoiceId, { status: 'cancelled' }, operatorId, operatorName, reason)
  
  return newRedInvoice
}

// ===== 审计日志相关函数 =====

export const getAuditLogs = async (): Promise<AuditLog[]> => {
  if (auditLogs.length === 0) {
    auditLogs = initializeAuditLogsFromStorage()
  }
  return auditLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export const getAuditLogsByEntity = async (entityType: string, entityId: string): Promise<AuditLog[]> => {
  const logs = await getAuditLogs()
  return logs.filter(log => log.entityType === entityType && log.entityId === entityId)
}

// ===== 预警和自动任务相关函数 =====

// 检查逾期发票并更新预警状态
export const checkOverdueInvoices = async (): Promise<void> => {
  const invoices = await getInvoiceManagements()
  const now = new Date()
  
  for (const invoice of invoices) {
    if (invoice.status === 'pending_payment' || invoice.status === 'partial_payment') {
      const expectedDate = new Date(invoice.expectedPaymentDate)
      const daysDiff = Math.floor((now.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24))
      
      let newWarningLevel: InvoiceManagement['warningLevel'] = 'none'
      let newStatus: InvoiceManagement['status'] = invoice.status
      
      if (daysDiff >= 30) {
        newWarningLevel = 'serious_30'
        newStatus = 'overdue_30'
      } else if (daysDiff >= 15) {
        newWarningLevel = 'warning_15'
        newStatus = 'overdue_15'
      }
      
      if (newWarningLevel !== invoice.warningLevel || newStatus !== invoice.status) {
        await updateInvoiceManagement(invoice.id, {
          warningLevel: newWarningLevel,
          status: newStatus,
          lastWarningAt: new Date().toISOString()
        }, 'system', '系统自动', `逾期${daysDiff}天预警`)
      }
    }
  }
}

// 生成预警消息
export const generateWarningMessages = async (): Promise<string[]> => {
  const invoices = await getInvoiceManagements()
  const messages: string[] = []
  
  for (const invoice of invoices) {
    if (invoice.warningLevel === 'warning_15') {
      messages.push(`[逾期提醒] ${invoice.contractCode}合同开票${invoice.invoiceAmount}元已超期15天！`)
    } else if (invoice.warningLevel === 'serious_30') {
      messages.push(`[严重逾期] ${invoice.contractCode}合同开票${invoice.invoiceAmount}元已超期30天！`)
    }
  }
  
  // 检查进度报销金额异常
  const reimbursements = await getProgressReimbursements()
  for (const reimbursement of reimbursements) {
    const allContracts = await getContracts()
    const contract = allContracts.find((c: Contract) => c.id === reimbursement.contractId)
    if (contract) {
      const remainingAmount = contract.amount - reimbursement.payableAmount
      if (reimbursement.reimbursementAmount > remainingAmount) {
        messages.push(`[金额异常] 进度报销额超过合同剩余额${remainingAmount}元！`)
      }
    }
  }
  
  return messages
}

// 初始化进度管理数据
progressReimbursements = initializeProgressReimbursementsFromStorage()
invoiceManagements = initializeInvoiceManagementFromStorage()
auditLogs = initializeAuditLogsFromStorage()
contracts = initializeContractsFromStorage()

// 生成进度报销示例数据
const generateMockProgressReimbursements = (contracts: Contract[]): ProgressReimbursement[] => {
  const reimbursements: ProgressReimbursement[] = []
  
  console.log('generateMockProgressReimbursements called with contracts:', contracts.length)
  
  // 为每个合同生成1-2个进度报销记录
  contracts.forEach((contract, index) => {
    const count = Math.random() > 0.5 ? 2 : 1
    
    for (let i = 0; i < count; i++) {
      const progressType = Math.random() > 0.5 ? 'percentage' : 'milestone'
      const completionPercentage = progressType === 'percentage' ? (30 + Math.floor(Math.random() * 50)) : undefined
      const payableAmount = progressType === 'percentage' 
        ? contract.amount * (completionPercentage! / 100)
        : contract.amount * 0.5 // 里程碑假设50%
      
      const reimbursementTypes: ('travel' | 'material' | 'outsourcing')[] = ['travel', 'material', 'outsourcing']
      const reimbursementType = reimbursementTypes[Math.floor(Math.random() * reimbursementTypes.length)]
      
             // 生成不同状态的进度报销，确保有完整的审批流程测试数据
       const statuses: ProgressReimbursement['status'][] = ['submitted', 'dept_manager_approved', 'finance_approved', 'paid']
       const statusWeights = [0.3, 0.3, 0.3, 0.1] // 30%提交, 30%部门审批, 30%财务审批, 10%已支付
       let status: ProgressReimbursement['status'] = 'submitted'
       const random = Math.random()
       let cumulative = 0
       for (let j = 0; j < statuses.length; j++) {
         cumulative += statusWeights[j]
         if (random <= cumulative) {
           status = statuses[j]
           break
         }
       }
      
      const submitter = mockUsers[Math.floor(Math.random() * 2)] // 徐海燕或马文博
      const deptManager = mockUsers.find(u => u.role === '中心领导') || mockUsers[2]
      const financeApprover = mockUsers.find(u => u.role === '分管院领导') || mockUsers[5]
      
      const now = new Date()
      const submittedAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      
      const reimbursement: ProgressReimbursement = {
        id: `PR${Date.now()}-${index}-${i}`,
        contractId: contract.id,
        contractCode: contract.contractNumber,
        contractName: contract.contractName,
        contractAmount: contract.amount,
        progressType,
        milestoneDescription: progressType === 'milestone' ? `完成${contract.contractName}关键里程碑` : undefined,
        completionPercentage,
        payableAmount,
        reimbursementType,
        reimbursementAmount: payableAmount * (0.7 + Math.random() * 0.3), // 70%-100%的应付金额
        reimbursementDescription: `${reimbursementType === 'travel' ? '差旅费用' : reimbursementType === 'material' ? '材料采购费用' : '外包服务费用'}报销`,
        status,
        submittedAt,
        submittedBy: submitter.name,
        deptManagerApprovalAt: status !== 'submitted' ? new Date(new Date(submittedAt).getTime() + 24 * 60 * 60 * 1000).toISOString() : undefined,
        deptManagerApprovalBy: status !== 'submitted' ? deptManager.name : undefined,
        deptManagerComment: status !== 'submitted' ? '审批通过' : undefined,
        financeApprovalAt: (status === 'finance_approved' || status === 'paid') ? new Date(new Date(submittedAt).getTime() + 48 * 60 * 60 * 1000).toISOString() : undefined,
        financeApprovalBy: (status === 'finance_approved' || status === 'paid') ? financeApprover.name : undefined,
        financeComment: (status === 'finance_approved' || status === 'paid') ? '财务审批通过' : undefined,
        paidAt: status === 'paid' ? new Date(new Date(submittedAt).getTime() + 72 * 60 * 60 * 1000).toISOString() : undefined,
        createdAt: submittedAt,
        updatedAt: new Date().toISOString()
      }
      
      reimbursements.push(reimbursement)
    }
  })
  
  console.log('Generated reimbursements:', reimbursements.length)
  return reimbursements
}

// 生成开票管理示例数据
const generateMockInvoiceManagements = (contracts: Contract[], reimbursements: ProgressReimbursement[]): InvoiceManagement[] => {
  const invoices: InvoiceManagement[] = []
  
  // 为每个合同生成1个开票记录
  contracts.forEach((contract, index) => {
    // 查找合同相关的进度报销，包括已通过财务审批的和已支付的
    const contractReimbursements = reimbursements.filter(r => 
      r.contractId === contract.id && 
      (r.status === 'finance_approved' || r.status === 'paid')
    )
    const totalReimbursementAmount = contractReimbursements.reduce((sum, r) => sum + r.reimbursementAmount, 0)
    
    // 如果没有报销记录，直接为合同生成开票记录（假设按合同总额的50%开票）
    const invoiceAmount = totalReimbursementAmount > 0 ? totalReimbursementAmount : contract.amount * 0.5
    
    if (invoiceAmount > 0) {
      const paidAmount = Math.random() > 0.5 ? invoiceAmount * (0.3 + Math.random() * 0.7) : 0
      const remainingAmount = invoiceAmount - paidAmount
      
      let status: InvoiceManagement['status'] = 'pending_payment'
      if (paidAmount >= invoiceAmount) {
        status = 'full_payment'
      } else if (paidAmount > 0) {
        status = 'partial_payment'
      }
      
      // 随机设置一些逾期状态
      if (Math.random() > 0.7 && status !== 'full_payment') {
        status = Math.random() > 0.5 ? 'overdue_15' : 'overdue_30'
      }
      
      const issuedAt = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString()
      const expectedPaymentDate = new Date(new Date(issuedAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      
      const invoice: InvoiceManagement = {
        id: `INV${Date.now()}-${index}`,
        contractId: contract.id,
        contractCode: contract.contractNumber,
        contractName: contract.contractName,
        contractAmount: contract.amount,
        invoiceMode: 'auto',
        relatedProgressIds: contractReimbursements.map(r => r.id),
        invoiceNumber: `FP${new Date().getFullYear()}${String(index + 1).padStart(4, '0')}`,
        invoiceAmount,
        invoiceDate: issuedAt.split('T')[0],
        invoiceType: 'normal',
        status,
        issuedAt,
        issuedBy: mockUsers.find(u => u.role === '分管院领导')?.name || '张副院长',
        expectedPaymentDate,
        actualPaymentDate: status === 'full_payment' ? new Date(new Date(issuedAt).getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        paidAmount,
        remainingAmount,
        warningLevel: status === 'overdue_15' ? 'warning_15' : status === 'overdue_30' ? 'serious_30' : 'none',
        lastWarningAt: (status === 'overdue_15' || status === 'overdue_30') ? new Date().toISOString() : undefined,
        createdAt: issuedAt,
        updatedAt: new Date().toISOString()
      }
      
      invoices.push(invoice)
    }
  })
  
  return invoices
}

// 生成审计日志示例数据
const generateMockAuditLogs = (): AuditLog[] => {
  const logs: AuditLog[] = []
  const actions: AuditLog['action'][] = ['create', 'update', 'approve', 'reject']
  const entityTypes: AuditLog['entityType'][] = ['progress_reimbursement', 'invoice_management', 'contract']
  
  // 生成20条审计日志
  for (let i = 0; i < 20; i++) {
    const entityType = entityTypes[Math.floor(Math.random() * entityTypes.length)]
    const action = actions[Math.floor(Math.random() * actions.length)]
    const operator = mockUsers[Math.floor(Math.random() * mockUsers.length)]
    
    const log: AuditLog = {
      id: `AUDIT${Date.now()}-${i}`,
      entityType,
      entityId: `ENTITY${i}`,
      action,
      operatorId: operator.id,
      operatorName: operator.name,
      operatorIp: '192.168.1.' + (100 + Math.floor(Math.random() * 50)),
      comment: `${action === 'create' ? '创建' : action === 'update' ? '更新' : action === 'approve' ? '审批通过' : '审批驳回'}${entityType === 'progress_reimbursement' ? '进度报销' : entityType === 'invoice_management' ? '开票记录' : '合同'}`,
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    }
    
    logs.push(log)
  }
  
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// 项目结算管理数据模型
export interface ProjectSettlement {
  id: string
  contractId: string // 关联的合同ID
  contractCode: string // 合同编号
  contractName: string // 合同名称
  clientName: string // 客户名称
  contractAmount: number // 合同金额
  totalInvoiceAmount: number // 累计开票金额
  totalPaidAmount: number // 实际回款金额
  remainingAmount: number // 欠款差额
  lastInvoiceDate?: string // 最近开票日期
  status: 'paid' | 'partial_payment' | 'pending_payment' | 'overdue_serious' // 结算状态
  overdueDays?: number // 逾期天数
  createdAt: string
  updatedAt: string
}

// 结算汇总统计
export interface SettlementSummary {
  totalContractAmount: number // 累计合同金额
  totalPaidAmount: number // 已回款总额
  overdueAmount: number // 逾期账款金额
  currentMonthPaid: number // 本月回款额
  lastMonthPaid: number // 上月回款额
  growthRate: number // 增长率
  paidContractCount: number // 已回款合同数
  partialPaidCount: number // 部分回款合同数
  pendingCount: number // 待回款合同数
  overdueCount: number // 严重逾期合同数
}

// 回款记录
export interface PaymentRecord {
  id: string
  contractId: string
  invoiceId?: string // 关联的发票ID
  amount: number // 回款金额
  paymentDate: string // 回款日期
  paymentMethod: string // 回款方式
  bankSlipUrl?: string // 银行流水截图URL
  remarks?: string // 备注
  recordedBy: string // 记录人
  recordedAt: string // 记录时间
}

// 生成项目结算数据
const generateProjectSettlements = (contracts: Contract[], invoices: InvoiceManagement[]): ProjectSettlement[] => {
  return contracts.map(contract => {
    const contractInvoices = invoices.filter(inv => inv.contractId === contract.id)
    const totalInvoiceAmount = contractInvoices.reduce((sum, inv) => sum + inv.invoiceAmount, 0)
    const totalPaidAmount = contractInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0)
    const lastInvoice = contractInvoices.sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime())[0]
    
    // 计算逾期天数
    let overdueDays = 0
    let status: ProjectSettlement['status'] = 'pending_payment'
    
    if (totalPaidAmount >= contract.amount) {
      status = 'paid'
    } else if (totalPaidAmount > 0) {
      status = 'partial_payment'
    } else if (lastInvoice) {
      const daysSinceInvoice = Math.floor(
        (new Date().getTime() - new Date(lastInvoice.invoiceDate).getTime()) / (1000 * 60 * 60 * 24)
      )
      overdueDays = daysSinceInvoice
      if (daysSinceInvoice >= 30) {
        status = 'overdue_serious'
      }
    }

    return {
      id: `settlement-${contract.id}`,
      contractId: contract.id,
      contractCode: contract.contractNumber,
      contractName: contract.contractName,
      clientName: contract.supplier, // 使用供应商作为客户名称
      contractAmount: contract.amount,
      totalInvoiceAmount,
      totalPaidAmount,
      remainingAmount: contract.amount - totalPaidAmount,
      lastInvoiceDate: lastInvoice?.invoiceDate,
      status,
      overdueDays: overdueDays > 0 ? overdueDays : undefined,
      createdAt: contract.uploadTime,
      updatedAt: new Date().toISOString()
    }
  })
}

// 计算结算汇总统计
const calculateSettlementSummary = (settlements: ProjectSettlement[]): SettlementSummary => {
  const totalContractAmount = settlements.reduce((sum, s) => sum + s.contractAmount, 0)
  const totalPaidAmount = settlements.reduce((sum, s) => sum + s.totalPaidAmount, 0)
  const overdueAmount = settlements
    .filter(s => s.status === 'overdue_serious')
    .reduce((sum, s) => sum + s.remainingAmount, 0)

  // 模拟本月和上月回款额计算（实际应根据真实回款记录计算）
  const currentMonthPaid = totalPaidAmount * 0.3 // 假设本月回款30%
  const lastMonthPaid = totalPaidAmount * 0.25   // 假设上月回款25%
  const growthRate = lastMonthPaid > 0 ? ((currentMonthPaid - lastMonthPaid) / lastMonthPaid) * 100 : 0

  return {
    totalContractAmount,
    totalPaidAmount,
    overdueAmount,
    currentMonthPaid,
    lastMonthPaid,
    growthRate,
    paidContractCount: settlements.filter(s => s.status === 'paid').length,
    partialPaidCount: settlements.filter(s => s.status === 'partial_payment').length,
    pendingCount: settlements.filter(s => s.status === 'pending_payment').length,
    overdueCount: settlements.filter(s => s.status === 'overdue_serious').length
  }
}

// 获取项目结算数据
export const getProjectSettlements = async (): Promise<ProjectSettlement[]> => {
  const [contracts, invoices] = await Promise.all([
    getContracts(),
    getInvoiceManagements()
  ])
  
  return generateProjectSettlements(contracts, invoices)
}

// 获取结算汇总统计
export const getSettlementSummary = async (): Promise<SettlementSummary> => {
  const settlements = await getProjectSettlements()
  return calculateSettlementSummary(settlements)
}

// 更新回款金额
export const updatePaymentAmount = async (
  contractId: string, 
  newPaidAmount: number,
  operatorId: string,
  operatorName: string
): Promise<boolean> => {
  try {
    // 获取该合同的所有发票
    const invoices = await getInvoiceManagementsByContract(contractId)
    if (invoices.length === 0) return false

    // 更新最新发票的回款金额
    const latestInvoice = invoices.sort((a, b) => 
      new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
    )[0]

    const oldAmount = latestInvoice.paidAmount
    await updateInvoiceManagement(
      latestInvoice.id,
      { paidAmount: newPaidAmount, remainingAmount: latestInvoice.invoiceAmount - newPaidAmount },
      operatorId,
      operatorName,
      `手动更新回款金额从 ${oldAmount} 到 ${newPaidAmount}`
    )

    return true
  } catch (error) {
    console.error('更新回款金额失败:', error)
    return false
  }
}

// 发送催收通知
export const sendCollectionNotice = async (contractId: string): Promise<boolean> => {
  // 这里实际应该调用邮件服务API
  // 暂时只记录日志
  console.log(`发送催收通知给合同: ${contractId}`)
  return true
}

// 生成默认回款记录数据
const generateMockPaymentRecords = (contracts: Contract[]): PaymentRecord[] => {
  const records: PaymentRecord[] = []
  
  contracts.forEach((contract, index) => {
    // 为每个合同生成1-3个回款记录
    const recordCount = Math.floor(Math.random() * 3) + 1
    let totalPaid = 0
    
    for (let i = 0; i < recordCount; i++) {
      const amount = Math.floor(contract.amount * (0.2 + Math.random() * 0.3)) // 20%-50%的合同金额
      totalPaid += amount
      
      if (totalPaid > contract.amount) break // 不能超过合同金额
      
      const paymentDate = new Date()
      paymentDate.setDate(paymentDate.getDate() - Math.floor(Math.random() * 60)) // 最近60天内
      
      records.push({
        id: `payment-${contract.id}-${i}`,
        contractId: contract.id,
        amount,
        paymentDate: paymentDate.toISOString().split('T')[0],
        paymentMethod: ['银行转账', '支票', '承兑汇票'][Math.floor(Math.random() * 3)],
        bankSlipUrl: `bank-slip-${contract.id}-${i}.jpg`,
        remarks: `第${i + 1}次回款`,
        recordedBy: '财务专员',
        recordedAt: new Date().toISOString()
      })
    }
  })
  
  return records
}

// 初始化回款记录数据
const initializePaymentRecordsFromStorage = () => {
  const stored = loadFromLocalStorage('payment_records', null)
  if (!stored) {
    const contracts = loadFromLocalStorage('contracts', [])
    const mockRecords = generateMockPaymentRecords(contracts)
    saveToLocalStorage('payment_records', mockRecords)
    return mockRecords
  }
  return stored
}

// 获取回款记录
export const getPaymentRecords = async (): Promise<PaymentRecord[]> => {
  return initializePaymentRecordsFromStorage()
}

// 获取指定合同的回款记录
export const getPaymentRecordsByContract = async (contractId: string): Promise<PaymentRecord[]> => {
  const records = await getPaymentRecords()
  return records.filter(record => record.contractId === contractId)
}

// 银行流水数据模型
export interface BankTransaction {
  id: string
  transactionDate: string // 交易日期 YYYY-MM-DD
  amount: number // 金额
  counterpartyName: string // 对方户名
  transactionNumber: string // 流水号
  transactionType: 'credit' | 'debit' // 收入/支出
  description?: string // 摘要描述
  status: 'unmatched' | 'matched' | 'manual_linked' | 'frozen' // 匹配状态
  relatedInvoiceId?: string // 关联的开票ID
  remarks?: string // 备注
  importedAt: string // 导入时间
  importedBy: string // 导入人
}

// 匹配结果数据模型
export interface MatchResult {
  id: string
  bankTransactionId: string // 银行流水ID
  invoiceId: string // 开票记录ID
  matchType: 'exact' | 'suspected' | 'manual' // 匹配类型：精确/疑似/手动
  confidence: number // 匹配置信度 0-100
  matchCriteria: {
    amountMatch: boolean // 金额匹配
    clientMatch: boolean // 客户匹配
    dateMatch: boolean // 日期匹配
  }
  amountDifference: number // 金额差异
  status: 'pending' | 'confirmed' | 'rejected' // 状态
  createdAt: string
  reviewedAt?: string // 审核时间
  reviewedBy?: string // 审核人
  reviewComments?: string // 审核意见
}

// 差异调整记录
export interface AdjustmentRecord {
  id: string
  matchResultId: string // 关联的匹配结果ID
  adjustmentType: 'bank_fee' | 'partial_payment' | 'prepayment' | 'manual' // 调整类型
  adjustmentAmount: number // 调整金额
  reason: string // 调整原因
  approvedBy?: string // 审批人
  approvedAt?: string // 审批时间
  status: 'pending' | 'approved' | 'rejected' // 状态
  createdAt: string
  createdBy: string
}

// 对账汇总报告
export interface ReconciliationReport {
  id: string
  reportDate: string // 报告日期
  totalTransactions: number // 总流水数
  matchedTransactions: number // 已匹配数
  unmatchedTransactions: number // 未匹配数
  totalAmount: number // 总金额
  matchedAmount: number // 已匹配金额
  unmatchedAmount: number // 未匹配金额
  matchSuccessRate: number // 匹配成功率
  topDifferenceClients: string[] // 差异Top10客户
  exceptionTransactions: string[] // 异常流水ID列表
  generatedAt: string // 生成时间
  generatedBy: string // 生成人
}

// 投标文件管理接口
export interface BiddingDocument {
  id: string
  fileName: string
  uploadTime: string
  uploader: string
  fileSize: string
  fileType: string
  downloadUrl?: string
}

// 采购文件管理接口
export interface ProcurementDocument {
  id: string
  fileName: string
  uploadTime: string
  uploader: string
  fileSize: string
  fileType: string
  downloadUrl?: string
}

// 生成Mock银行流水数据
const generateMockBankTransactions = (invoices: InvoiceManagement[]): BankTransaction[] => {
  const transactions: BankTransaction[] = []
  
  invoices.forEach((invoice, index) => {
    // 为每个开票记录生成对应的银行流水（模拟80%的匹配率）
    if (Math.random() < 0.8) {
      const baseDate = new Date(invoice.invoiceDate)
      baseDate.setDate(baseDate.getDate() + Math.floor(Math.random() * 30) + 1) // 开票后1-30天收到款
      
      // 模拟不同的匹配场景
      const scenarios = ['exact', 'amount_diff', 'name_diff', 'partial']
      const scenario = scenarios[Math.floor(Math.random() * scenarios.length)]
      
      let amount = invoice.invoiceAmount
      let counterpartyName = invoice.contractName.includes('北京') ? '北京科技有限公司' :
                           invoice.contractName.includes('上海') ? '上海软件科技公司' :
                           invoice.contractName.includes('设备') ? '设备维护公司' : '未知客户'
      
      // 根据场景调整数据
      switch (scenario) {
        case 'amount_diff':
          amount = amount - Math.floor(Math.random() * 100) // 扣除手续费
          break
        case 'name_diff':
          counterpartyName = counterpartyName.replace('有限公司', '公司') // 名称略有差异
          break
        case 'partial':
          amount = Math.floor(amount * (0.5 + Math.random() * 0.3)) // 部分付款
          break
      }
      
      transactions.push({
        id: `bank-tx-${invoice.id}`,
        transactionDate: baseDate.toISOString().split('T')[0],
        amount,
        counterpartyName,
        transactionNumber: `TX${Date.now()}${index.toString().padStart(3, '0')}`,
        transactionType: 'credit',
        description: `转账收入-${counterpartyName}`,
        status: 'unmatched',
        remarks: scenario === 'exact' ? '精确匹配' : scenario === 'amount_diff' ? '金额有差异' : scenario === 'name_diff' ? '客户名称有差异' : '部分付款',
        importedAt: new Date().toISOString(),
        importedBy: '系统导入'
      })
    }
  })
  
  // 添加一些无法匹配的干扰流水
  for (let i = 0; i < 5; i++) {
    const randomDate = new Date()
    randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 60))
    
    transactions.push({
      id: `bank-tx-noise-${i}`,
      transactionDate: randomDate.toISOString().split('T')[0],
      amount: Math.floor(Math.random() * 50000) + 10000,
      counterpartyName: ['其他公司', '个人转账', '银行利息', '退款'][Math.floor(Math.random() * 4)],
      transactionNumber: `TX${Date.now()}${(i + 100).toString()}`,
      transactionType: 'credit',
      description: '其他收入',
      status: 'unmatched',
      remarks: '无对应开票记录',
      importedAt: new Date().toISOString(),
      importedBy: '系统导入'
    })
  }
  
  return transactions
}

// 智能匹配引擎
const performIntelligentMatching = (
  bankTransactions: BankTransaction[], 
  invoices: InvoiceManagement[]
): MatchResult[] => {
  const matchResults: MatchResult[] = []
  
  // 获取未匹配的银行流水
  const unmatchedTransactions = bankTransactions.filter(tx => tx.status === 'unmatched')
  
  // 获取待匹配的开票记录（已开票未回款）
  const pendingInvoices = invoices.filter(inv => 
    inv.status === 'issued' || inv.status === 'pending_payment'
  )
  
  unmatchedTransactions.forEach(transaction => {
    pendingInvoices.forEach(invoice => {
      // 金额匹配检查（允许5%误差）
      const amountDiff = Math.abs(transaction.amount - invoice.invoiceAmount)
      const amountMatchThreshold = invoice.invoiceAmount * 0.05
      const amountMatch = amountDiff <= amountMatchThreshold
      
      // 客户名称匹配检查（模糊匹配）
      const clientMatch = transaction.counterpartyName.includes(invoice.contractName.split('-')[0]) ||
                         invoice.contractName.includes(transaction.counterpartyName.substring(0, 3))
      
      // 日期匹配检查（开票后90天内）
      const invoiceDate = new Date(invoice.invoiceDate)
      const transactionDate = new Date(transaction.transactionDate)
      const daysDiff = Math.floor((transactionDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24))
      const dateMatch = daysDiff >= 0 && daysDiff <= 90
      
      // 计算匹配置信度
      let confidence = 0
      if (amountMatch) confidence += 40
      if (clientMatch) confidence += 40
      if (dateMatch) confidence += 20
      
      // 根据匹配条件确定匹配类型
      let matchType: 'exact' | 'suspected' | 'manual' = 'manual'
      if ((amountMatch && clientMatch) || (amountMatch && dateMatch && confidence >= 80)) {
        matchType = 'exact'
      } else if (confidence >= 50) {
        matchType = 'suspected'
      }
      
      // 只记录有潜力的匹配结果
      if (confidence >= 30) {
        matchResults.push({
          id: `match-${transaction.id}-${invoice.id}`,
          bankTransactionId: transaction.id,
          invoiceId: invoice.id,
          matchType,
          confidence,
          matchCriteria: {
            amountMatch,
            clientMatch,
            dateMatch
          },
          amountDifference: amountDiff,
          status: matchType === 'exact' ? 'confirmed' : 'pending',
          createdAt: new Date().toISOString()
        })
      }
    })
  })
  
  // 按置信度排序，每个银行流水只保留最佳匹配
  const bestMatches: MatchResult[] = []
  const processedTransactions = new Set<string>()
  
  matchResults
    .sort((a, b) => b.confidence - a.confidence)
    .forEach(match => {
      if (!processedTransactions.has(match.bankTransactionId)) {
        bestMatches.push(match)
        processedTransactions.add(match.bankTransactionId)
      }
    })
  
  return bestMatches
}

// 生成对账报告
const generateReconciliationReport = (
  bankTransactions: BankTransaction[],
  matchResults: MatchResult[]
): ReconciliationReport => {
  const totalTransactions = bankTransactions.length
  const matchedTransactions = matchResults.filter(m => m.status === 'confirmed').length
  const unmatchedTransactions = totalTransactions - matchedTransactions
  
  const totalAmount = bankTransactions.reduce((sum, tx) => sum + tx.amount, 0)
  const matchedAmount = matchResults
    .filter(m => m.status === 'confirmed')
    .reduce((sum, match) => {
      const tx = bankTransactions.find(t => t.id === match.bankTransactionId)
      return sum + (tx?.amount || 0)
    }, 0)
  const unmatchedAmount = totalAmount - matchedAmount
  
  const matchSuccessRate = totalTransactions > 0 ? (matchedTransactions / totalTransactions) * 100 : 0
  
  // 找出差异较大的客户
  const clientDifferences: { [key: string]: number } = {}
  matchResults.forEach(match => {
    const tx = bankTransactions.find(t => t.id === match.bankTransactionId)
    if (tx && match.amountDifference > 0) {
      clientDifferences[tx.counterpartyName] = (clientDifferences[tx.counterpartyName] || 0) + match.amountDifference
    }
  })
  
  const topDifferenceClients = Object.entries(clientDifferences)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([client]) => client)
  
  // 找出异常流水
  const exceptionTransactions = bankTransactions
    .filter(tx => 
      tx.amount > 100000 || // 大额交易
      !matchResults.find(m => m.bankTransactionId === tx.id) // 无匹配项
    )
    .map(tx => tx.id)
  
  return {
    id: `report-${Date.now()}`,
    reportDate: new Date().toISOString().split('T')[0],
    totalTransactions,
    matchedTransactions,
    unmatchedTransactions,
    totalAmount,
    matchedAmount,
    unmatchedAmount,
    matchSuccessRate,
    topDifferenceClients,
    exceptionTransactions,
    generatedAt: new Date().toISOString(),
    generatedBy: '系统自动生成'
  }
}

// 初始化银行对账数据
const initializeBankReconciliationFromStorage = () => {
  const storedTransactions = loadFromLocalStorage('bank_transactions', null)
  const storedMatches = loadFromLocalStorage('match_results', null)
  const storedAdjustments = loadFromLocalStorage('adjustment_records', null)
  
  if (!storedTransactions) {
    // 生成Mock数据
    const invoices = loadFromLocalStorage('invoice_managements', [])
    const mockTransactions = generateMockBankTransactions(invoices)
    const mockMatches = performIntelligentMatching(mockTransactions, invoices)
    
    saveToLocalStorage('bank_transactions', mockTransactions)
    saveToLocalStorage('match_results', mockMatches)
    saveToLocalStorage('adjustment_records', [])
    
    return { 
      transactions: mockTransactions, 
      matches: mockMatches, 
      adjustments: [] 
    }
  }
  
  return {
    transactions: storedTransactions,
    matches: storedMatches || [],
    adjustments: storedAdjustments || []
  }
}

// 获取银行流水
export const getBankTransactions = async (): Promise<BankTransaction[]> => {
  const data = initializeBankReconciliationFromStorage()
  return data.transactions
}

// 获取匹配结果
export const getMatchResults = async (): Promise<MatchResult[]> => {
  const data = initializeBankReconciliationFromStorage()
  return data.matches
}

// 获取调整记录
export const getAdjustmentRecords = async (): Promise<AdjustmentRecord[]> => {
  const data = initializeBankReconciliationFromStorage()
  return data.adjustments
}

// 导入银行流水
export const importBankTransactions = async (
  transactions: Omit<BankTransaction, 'id' | 'status' | 'importedAt' | 'importedBy'>[],
  operatorId: string,
  operatorName: string
): Promise<BankTransaction[]> => {
  const newTransactions = transactions.map(tx => ({
    ...tx,
    id: `bank-tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: 'unmatched' as const,
    importedAt: new Date().toISOString(),
    importedBy: operatorName
  }))
  
  const existingTransactions = await getBankTransactions()
  const allTransactions = [...existingTransactions, ...newTransactions]
  
  saveToLocalStorage('bank_transactions', allTransactions)
  
  // 自动执行匹配
  const invoices = await getInvoiceManagements()
  const newMatches = performIntelligentMatching(newTransactions, invoices)
  
  const existingMatches = await getMatchResults()
  const allMatches = [...existingMatches, ...newMatches]
  
  saveToLocalStorage('match_results', allMatches)
  
  return newTransactions
}

// 执行自动匹配
export const performAutoMatching = async (): Promise<MatchResult[]> => {
  const [transactions, invoices] = await Promise.all([
    getBankTransactions(),
    getInvoiceManagements()
  ])
  
  const matchResults = performIntelligentMatching(transactions, invoices)
  saveToLocalStorage('match_results', matchResults)
  
  return matchResults
}

// 确认匹配结果
export const confirmMatchResult = async (
  matchId: string,
  operatorId: string,
  operatorName: string,
  comments?: string
): Promise<boolean> => {
  try {
    const matches = await getMatchResults()
    const matchIndex = matches.findIndex(m => m.id === matchId)
    
    if (matchIndex === -1) return false
    
    matches[matchIndex] = {
      ...matches[matchIndex],
      status: 'confirmed',
      reviewedAt: new Date().toISOString(),
      reviewedBy: operatorName,
      reviewComments: comments
    }
    
    saveToLocalStorage('match_results', matches)
    
    // 更新银行流水状态
    const transactions = await getBankTransactions()
    const txIndex = transactions.findIndex(tx => tx.id === matches[matchIndex].bankTransactionId)
    if (txIndex !== -1) {
      transactions[txIndex].status = 'matched'
      transactions[txIndex].relatedInvoiceId = matches[matchIndex].invoiceId
      saveToLocalStorage('bank_transactions', transactions)
    }
    
    // 更新开票记录的回款状态
    const invoices = await getInvoiceManagements()
    const invIndex = invoices.findIndex(inv => inv.id === matches[matchIndex].invoiceId)
    if (invIndex !== -1) {
      const transaction = transactions.find(tx => tx.id === matches[matchIndex].bankTransactionId)
      if (transaction) {
        await updateInvoiceManagement(
          matches[matchIndex].invoiceId,
          { 
            paidAmount: transaction.amount,
            actualPaymentDate: transaction.transactionDate,
            status: transaction.amount >= invoices[invIndex].invoiceAmount ? 'full_payment' : 'partial_payment'
          },
          operatorId,
          operatorName,
          `银行对账确认回款：${transaction.amount}元`
        )
      }
    }
    
    return true
  } catch (error) {
    console.error('确认匹配结果失败:', error)
    return false
  }
}

// 手动关联
export const manualLinkTransaction = async (
  transactionId: string,
  invoiceId: string,
  operatorId: string,
  operatorName: string,
  reason: string
): Promise<boolean> => {
  try {
    // 创建手动匹配记录
    const matchResult: MatchResult = {
      id: `manual-match-${Date.now()}`,
      bankTransactionId: transactionId,
      invoiceId: invoiceId,
      matchType: 'manual',
      confidence: 100,
      matchCriteria: {
        amountMatch: false,
        clientMatch: false,
        dateMatch: false
      },
      amountDifference: 0,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      reviewedAt: new Date().toISOString(),
      reviewedBy: operatorName,
      reviewComments: `手动关联：${reason}`
    }
    
    const matches = await getMatchResults()
    matches.push(matchResult)
    saveToLocalStorage('match_results', matches)
    
    // 更新银行流水状态
    const transactions = await getBankTransactions()
    const txIndex = transactions.findIndex(tx => tx.id === transactionId)
    if (txIndex !== -1) {
      transactions[txIndex].status = 'manual_linked'
      transactions[txIndex].relatedInvoiceId = invoiceId
      saveToLocalStorage('bank_transactions', transactions)
    }
    
    return true
  } catch (error) {
    console.error('手动关联失败:', error)
    return false
  }
}

// 生成对账报告
export const generateDailyReconciliationReport = async (): Promise<ReconciliationReport> => {
  const [transactions, matches] = await Promise.all([
    getBankTransactions(),
    getMatchResults()
  ])
  
  const report = generateReconciliationReport(transactions, matches)
  
  // 保存报告
  const reports = loadFromLocalStorage('reconciliation_reports', [])
  reports.push(report)
  saveToLocalStorage('reconciliation_reports', reports)
  
  return report
}

// 获取对账报告列表
export const getReconciliationReports = async (): Promise<ReconciliationReport[]> => {
  return loadFromLocalStorage('reconciliation_reports', [])
}

// 生成投标文件示例数据
const generateMockBiddingDocuments = (): BiddingDocument[] => {
  return [
    {
      id: "bid-doc-001",
      fileName: "2024年度设备采购招标文件.pdf",
      uploadTime: "2024-01-15 10:30:00",
      uploader: "张三",
      fileSize: "2.5MB",
      fileType: "PDF"
    },
    {
      id: "bid-doc-002",
      fileName: "办公设备招标技术规格书.docx",
      uploadTime: "2024-01-10 14:20:00", 
      uploader: "李四",
      fileSize: "1.8MB",
      fileType: "DOCX"
    },
    {
      id: "bid-doc-003",
      fileName: "软件服务招标文件模板.doc",
      uploadTime: "2024-01-08 09:15:00",
      uploader: "王五",
      fileSize: "1.2MB",
      fileType: "DOC"
    },
    {
      id: "bid-doc-004",
      fileName: "基础设施改造招标文件.pdf",
      uploadTime: "2024-01-20 16:45:00",
      uploader: "刘六",
      fileSize: "3.1MB", 
      fileType: "PDF"
    },
    {
      id: "bid-doc-005",
      fileName: "网络设备采购招标清单.xlsx",
      uploadTime: "2024-01-25 11:20:00",
      uploader: "陈七",
      fileSize: "850KB",
      fileType: "XLSX"
    }
  ]
}

// 生成采购文件示例数据
const generateMockProcurementDocuments = (): ProcurementDocument[] => {
  return [
    {
      id: "proc-doc-001",
      fileName: "2024年度办公用品采购文件.pdf",
      uploadTime: "2024-01-15 10:30:00",
      uploader: "张三",
      fileSize: "2.5MB",
      fileType: "PDF"
    },
    {
      id: "proc-doc-002",
      fileName: "计算机设备采购技术规格书.docx",
      uploadTime: "2024-01-10 14:20:00",
      uploader: "李四", 
      fileSize: "1.8MB",
      fileType: "DOCX"
    },
    {
      id: "proc-doc-003",
      fileName: "服务器采购文件模板.doc",
      uploadTime: "2024-01-08 09:15:00",
      uploader: "王五",
      fileSize: "1.2MB",
      fileType: "DOC"
    },
    {
      id: "proc-doc-004",
      fileName: "办公家具采购清单.xlsx",
      uploadTime: "2024-01-22 14:30:00",
      uploader: "赵八",
      fileSize: "950KB",
      fileType: "XLSX"
    },
    {
      id: "proc-doc-005",
      fileName: "耗材采购合同模板.pdf",
      uploadTime: "2024-01-28 09:45:00",
      uploader: "孙九",
      fileSize: "1.5MB",
      fileType: "PDF"
    }
  ]
}

// 获取投标文件列表
export const getBiddingDocuments = async (): Promise<BiddingDocument[]> => {
  return loadFromLocalStorage('bidding_documents', [])
}

// 获取采购文件列表  
export const getProcurementDocuments = async (): Promise<ProcurementDocument[]> => {
  return loadFromLocalStorage('procurement_documents', [])
}

