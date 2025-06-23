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
    name: "罗拓",
    role: "部门专职",
    institute: "电试院",
    center: "",
    department: "发展策划部门",
  },
  {
    id: "8",
    name: "邵剑",
    role: "部门领导",
    institute: "电试院",
    center: "",
    department: "发展策划部门",
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
  // 提取项目名称的缩写（去掉"项目"二字）
  const cleanName = projectName.replace(/项目$/g, '') // 移除末尾的"项目"
  
  // 使用 pinyin-pro 库将中文转换为拼音首字母缩写（大写）
  const abbreviation = pinyin(cleanName, { 
    pattern: 'first', // 只取首字母
    toneType: 'none', // 不要声调
    type: 'array' // 返回数组
  }).join('').toUpperCase()
  
  // 获取当前时间的时分秒
  const now = new Date()
  const timeString = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`
  
  // 添加递增计数器确保唯一性（2位数字，从01开始）
  projectCodeCounter = (projectCodeCounter % 99) + 1
  const counterString = projectCodeCounter.toString().padStart(2, '0')
  
  return `${abbreviation}${timeString}${counterString}`
}

// 模拟数据生成函数
const generateMockProjects = (): Project[] => {
  let currentProjectId = 1
  const generatedProjects: Project[] = []
  const statuses: ProjectStatus[] = ["编制", "评审", "批复", "下达"]



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
    namePrefix: string,
    ownerUser: User,
    status: ProjectStatus,
  ): Project => {
    const name = namePrefix
    const id = generateProjectCode(name)
    const description = `这是关于 ${name} 的描述。`
    // 使用固定的日期偏移而不是随机数
    const dayOffset = currentProjectId % 30
    const createdAt = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000).toISOString()
    
    // 生成开始和结束日期
    const startDate = new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000)
    const endDate = new Date(startDate.getTime() + (365 + (currentProjectId % 730)) * 24 * 60 * 60 * 1000) // 1-2年项目周期
    
    // 生成财务数据
    const generateFinancialRows = (start: Date, end: Date): FinancialRow[] => {
      const rows: FinancialRow[] = []
      let currentYear = start.getFullYear()
      const endYear = end.getFullYear()
      
      while (currentYear <= endYear) {
        const yearStart = currentYear === start.getFullYear() ? start : new Date(currentYear, 0, 1)
        const yearEnd = currentYear === endYear ? end : new Date(currentYear, 11, 31)
        
        const plannedIncome = (currentProjectId % 10 + 1) * 100000 // 10万-100万
        const plannedExpense = plannedIncome * (0.6 + (currentProjectId % 30) / 100) // 60%-89%
        const grossMargin = ((plannedIncome - plannedExpense) / plannedIncome) * 100
        
        rows.push({
          id: `${currentYear}-${currentProjectId}-${Math.random()}`,
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

    currentProjectId++
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
      projectType: PROJECT_TYPES[currentProjectId % PROJECT_TYPES.length],
      managementDepartment: "发展策划部",
      fundAttribute: FUND_ATTRIBUTES[currentProjectId % FUND_ATTRIBUTES.length],
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      necessity: NECESSITIES[currentProjectId % NECESSITIES.length],
      feasibility: FEASIBILITIES[currentProjectId % FEASIBILITIES.length],
      projectBasis: PROJECT_BASES[currentProjectId % PROJECT_BASES.length],
      implementationPlan: `${name}的实施方案包括：1. 前期调研和方案设计；2. 采购设备和搭建环境；3. 系统开发和测试；4. 试运行和优化；5. 正式上线和推广应用。项目将分阶段实施，确保质量和进度。`,
              departmentHead: ownerUser.center ? "林雪梅" : "邵剑", // 根据用户所属选择负责人
      remarks: `${name}项目备注：该项目对于提升公司技术水平和市场竞争力具有重要意义，建议优先实施。`,
      financialRows: generateFinancialRows(startDate, endDate),
      attachmentFileName: `${name}-项目建议书.pdf`
    }
  }

  // 只为中心专职角色生成项目，每个状态类型生成1条项目，在中心专职用户之间平均分配
  const centerSpecialists = mockUsers.filter((u) => u.role === "中心专职")
  
  // 为每个中心专职用户生成一条编制状态的项目数据
  const projectTemplates = [
    ["智能化监测系统项目", "创新研发平台建设", "技术升级改造项目"],
    ["数据分析平台建设", "质量管理系统升级", "设备运维优化项目"],
    ["安全监控系统项目", "能耗管理平台建设", "流程自动化改造"],
    ["信息化基础设施项目", "人员培训体系建设", "标准化管理项目"]
  ]
  
  // 为每个中心专职用户生成2个编制状态的项目
  centerSpecialists.forEach((specialist, specialistIndex) => {
    const templates = projectTemplates[specialistIndex % projectTemplates.length]
    
    // 为每个专职生成2个编制状态的项目
    for (let i = 0; i < 2; i++) {
      // 使用不同的项目名称，确保每个项目都有独特的名称
      const projectName = templates[i]
      
      const project = createProject(
        projectName,
        specialist,
        "编制" // 只生成编制状态的项目
      )
      
      // 编制状态的项目不设置为已提交审批
      project.isSubmittedForApproval = false
      
      generatedProjects.push(project)
    }
  })

  return generatedProjects
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
  console.log('Initializing data...')
  
  // 重置项目编码计数器，确保每次初始化都从头开始
  projectCodeCounter = 0
  
  // 重新生成项目数据
  projects = generateMockProjects()
  saveToLocalStorage('reserve_projects', projects)
  console.log('Projects initialized:', projects.length)
  
  // 清空审批数据
  approvals = []
  saveToLocalStorage('reserve_approvals', approvals)
  console.log('Approvals cleared')
  
  // 清空月度评审数据
  monthlyReviews.splice(0, monthlyReviews.length)
  saveToLocalStorage('reserve_monthly_reviews', monthlyReviews)
  console.log('Monthly reviews cleared')
  
  // 清空会议纪要数据
  meetingMinutes.splice(0, meetingMinutes.length)
  saveToLocalStorage('reserve_meeting_minutes', meetingMinutes)
  console.log('Meeting minutes cleared')
  
  // 生成更真实的批复报告数据
  const testApprovalReports = generateRealisticApprovalReports()
  saveToLocalStorage('reserve_approval_reports', testApprovalReports)
  console.log('Test approval reports generated:', testApprovalReports.length)
  
  // 生成更全面的待办事项数据
  const testTodoItems = generateRealisticTodoItems(testApprovalReports)
  saveToLocalStorage('reserve_todo_items', testTodoItems)
  console.log('Test todo items generated:', testTodoItems.length)
  
  // 生成确认记录数据
  const testConfirmations = generateRealisticConfirmations(testApprovalReports)
  saveToLocalStorage('reserve_approval_confirmations', testConfirmations)
  console.log('Test confirmations generated:', testConfirmations.length)
  
  // 生成一些项目审批记录
  const projectApprovals = generateProjectApprovals()
  saveToLocalStorage('reserve_approvals', projectApprovals)
  console.log('Project approvals generated:', projectApprovals.length)
  
  // 重置数据初始化标记
  saveToLocalStorage('reserve_data_initialized', false)
  saveToLocalStorage('reserve_needs_mock_reviews', true)
  
  return {
    projects,
    approvals: projectApprovals,
    monthlyReviews,
    meetingMinutes
  }
}

// 不自动生成批复报告，只有用户主动创建时才生成
const generateRealisticApprovalReports = (): ApprovalReport[] => {
  return []
}

// 生成最简化的待办事项数据（不包含批复报告相关）
const generateRealisticTodoItems = (reports: ApprovalReport[]): TodoItem[] => {
  const todoItems: TodoItem[] = []
  
  // 由于没有批复报告，不生成相关待办事项
  // 项目审批待办事项也不生成，因为所有项目都是编制状态
  // 月度审核参与人确认待办也不生成，因为没有月度审核会议
  
  return todoItems
}

// 不生成批复报告确认记录，只有用户发起流程时才生成
const generateRealisticConfirmations = (reports: ApprovalReport[]): ApprovalReportConfirmation[] => {
  return []
}

// 不生成项目审批记录，因为所有项目都是编制状态
const generateProjectApprovals = (): Approval[] => {
  return []
}

// 初始化项目数据（从localStorage加载或生成新数据）
projects = initializeProjectsFromStorage()

// 审批数据存储
let approvals: Approval[] = loadFromLocalStorage('reserve_approvals', [])

let monthlyReviews: MonthlyReview[] = loadFromLocalStorage('reserve_monthly_reviews', [])

// 生成模拟月度评审数据的函数
const generateMockMonthlyReviews = (): MonthlyReview[] => {
  const mockReviews: MonthlyReview[] = []
  
  // 修复：不再自动生成模拟月度评审数据
  // 因为所有项目现在都从"编制"状态开始，需要通过正确的流程才能进入评审
  // 用户需要手动创建月度评审会并选择项目
  
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
    owner: p.owner === "宋晓峰" ? "罗拓" : p.owner === "邓慧敏" ? "邵剑" : p.owner,
    name: p.name.replace(/宋晓峰/g, "罗拓").replace(/邓慧敏/g, "邵剑"),
  }));
  approvals = approvals.map((a) => ({
    ...a,
    submitter: a.submitter === "宋晓峰" ? "罗拓" : a.submitter === "邓慧敏" ? "邵剑" : a.submitter,
    approver: a.approver === "宋晓峰" ? "罗拓" : a.approver === "邓慧敏" ? "邵剑" : a.approver,
    projectName: a.projectName.replace(/宋晓峰/g, "罗拓").replace(/邓慧敏/g, "邵剑"),
  }));
  monthlyReviews.forEach((r) => {
    if (r.reviewer === "宋晓峰") r.reviewer = "罗拓";
    if (r.reviewer === "邓慧敏") r.reviewer = "邵剑";
    if (r.projectName.includes("宋晓峰")) r.projectName = r.projectName.replace(/宋晓峰/g, "罗拓");
    if (r.projectName.includes("邓慧敏")) r.projectName = r.projectName.replace(/邓慧敏/g, "邵剑");
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
    const plan = (await getComprehensivePlans()).find(p => p.id === planId)
    if (!plan) {
      return false
    }
    
    // 从项目ID列表中移除指定项目
    const updatedProjectIds = plan.projectIds.filter(id => id !== projectId)
    
    // 更新综合计划
    const result = await updateComprehensivePlan(planId, {
      projectIds: updatedProjectIds
    })
    
    if (result) {
      // 将项目状态改回"批复"
      await updateProject(projectId, { status: "批复" })
      return true
    }
    
    return false
  } catch (error) {
    console.error('从综合计划中移除项目失败:', error)
    return false
  }
}

