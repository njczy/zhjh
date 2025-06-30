"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  BookOpen, 
  Users, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  Info,
  FileText,
  Calendar,
  ClipboardCheck,
  ArrowRight,
  Lightbulb,
  Gavel,
  ShoppingCart,
  FileSignature,
  TrendingUp,
  Calculator,
  ChevronDown,
  DollarSign,
  Building,
  Clock,
  Target,
  XCircle
} from "lucide-react"
import { useUser } from "@/contexts/UserContext"

// 角色权限配置 - 基于实际系统功能
const ROLE_PERMISSIONS = {
  "中心专职": {
    name: "中心专职",
    color: "bg-blue-100 text-blue-800",
    description: "运营中心的专职人员，负责本中心储备项目的日常管理和执行",
    permissions: [
      "创建和编辑本中心储备项目",
      "提交项目审批申请",
      "确认月度评审批复报告",
      "创建和管理进度报销",
      "查看合同信息和绑定状态",
      "查看结算和财务信息",
      "下载招标采购文档",
      "跟踪项目全生命周期状态"
    ]
  },
  "中心领导": {
    name: "中心领导", 
    color: "bg-purple-100 text-purple-800",
    description: "运营中心的领导，负责本中心项目的审批和重要决策",
    permissions: [
      "审批本中心储备项目",
      "确认月度评审批复报告",
      "审批本中心进度报销（部门层面）",
      "查看本中心所有项目详情",
      "参与重要项目决策",
      "监督项目执行进度",
      "协调中心内部资源配置"
    ]
  },
  "部门专职": {
    name: "部门专职",
    color: "bg-green-100 text-green-800", 
    description: "发展策划部、财务部等职能部门专职，负责全院项目的统筹管理",
    permissions: [
      "查看和管理全院储备项目",
      "组织月度评审会议",
      "生成和管理批复报告",
      "制定年度综合计划",
      "管理合同信息和项目绑定",
      "管理招标采购文档",
      "开票管理（限财务部专职）",
      "银行对账（限财务部专职）",
      "结算管理和数据分析"
    ]
  },
  "部门领导": {
    name: "部门领导",
    color: "bg-orange-100 text-orange-800",
    description: "发展策划部、财务部等职能部门领导，负责重要审批和决策",
    permissions: [
      "审批重要储备项目", 
      "审批综合计划",
      "审批进度报销（部门层面）",
      "参与月度评审决策",
      "协调跨部门事务",
      "监督部门工作质量",
      "处理重大争议和问题"
    ]
  },
  "分管院领导": {
    name: "分管院领导",
    color: "bg-red-100 text-red-800",
    description: "分管相关业务的院领导，拥有最高审批权限",
    permissions: [
      "审批月度评审批复报告",
      "批准年度综合计划",
      "财务审批（进度报销）",
      "重大项目最终决策",
      "政策方向指导",
      "跨院协调事务"
    ]
  }
}

// 系统模块配置
const MODULE_CONFIG = {
  "reserve": {
    name: "储备及综合计划",
    icon: FileText,
    color: "text-blue-600",
    description: "项目从储备到下达的全流程管理",
    subModules: [
      { name: "储备管理", key: "储备项目列表", description: "储备项目的创建、编辑、审批" },
      { name: "可研评审及批复", key: "月度评审", description: "月度评审会议和批复报告管理" },
      { name: "计划编制及调整", key: "综合计划", description: "年度综合计划的制定和调整" }
    ]
  },
  "bidding": {
    name: "招标采购管理",
    icon: Gavel,
    color: "text-purple-600",
    description: "招标采购流程和文档管理",
    subModules: [
      { name: "招标管理", key: "招标文档", description: "招标文件的管理和维护" },
      { name: "采购管理", key: "采购文档", description: "采购文档和流程管理" }
    ]
  },
  "contract": {
    name: "合同管理",
    icon: FileSignature,
    color: "text-green-600",
    description: "合同信息管理和项目绑定",
    subModules: [
      { name: "合同信息管理", key: "合同录入", description: "合同基本信息的录入和维护" },
      { name: "项目绑定", key: "合同绑定", description: "合同与已下达项目的绑定关系" }
    ]
  },
  "progress": {
    name: "进度管理",
    icon: TrendingUp,
    color: "text-orange-600",
    description: "项目进度和报销管理",
    subModules: [
      { name: "进度报销", key: "报销管理", description: "项目进度报销申请和审批" },
      { name: "开票管理", key: "开票系统", description: "基于进度的开票和回款管理" }
    ]
  },
  "settlement": {
    name: "结算管理",
    icon: Calculator,
    color: "text-red-600",
    description: "财务结算和对账管理",
    subModules: [
      { name: "收款汇总", key: "项目结算", description: "项目收款情况统计分析" },
      { name: "银行对账", key: "对账系统", description: "银行流水与业务数据对账" }
    ]
  }
}

// 快速入门指南 - 按模块和角色分类
const QUICK_START_GUIDES = {
  "reserve": {
    "中心专职": [
      {
        title: "创建储备项目",
        steps: [
          "点击储备项目列表页面的「新增项目」按钮",
          "填写项目基本信息：名称、类型、负责人、归口管理等",
          "设置实施时间和资金属性（资本性/成本性支出）",
          "详细填写项目描述：必要性、可行性、立项依据、实施方案",
          "制定按年度拆分的财务预算表",
          "上传项目建议书等相关附件",
          "保存项目或直接提交审批"
        ],
        tips: "确保项目信息完整准确，财务预算合理，可先保存草稿后续完善"
      },
      {
        title: "参与月度评审确认",
        steps: [
          "在待办事项中查看「批复报告确认」任务",
          "仔细阅读月度评审批复报告内容",
          "确认无误后点击「确认」按钮",
          "如有异议可备注说明或联系发展策划部"
        ],
        tips: "认真核对批复报告中关于本项目的内容，确保准确性"
      }
    ],
    "中心领导": [
      {
        title: "审批储备项目",
        steps: [
          "在待办事项中查看项目审批任务",
          "查看项目详细信息和财务预算",
          "评估项目的必要性和可行性",
          "从中心发展角度给出审批意见",
          "选择同意通过或驳回（需说明理由）"
        ],
        tips: "重点关注项目的战略价值和资源需求"
      },
      {
        title: "确认批复报告",
        steps: [
          "查看月度评审批复报告内容",
          "重点关注本中心项目的评审结果",
          "确认项目实施安排和资源配置",
          "如无异议点击确认按钮"
        ],
        tips: "从中心利益角度审视评审结果"
      }
    ],
    "部门专职": [
      {
        title: "组织月度评审",
        steps: [
          "在可研评审及批复页面创建新评审会",
          "选择状态为「评审」的项目",
          "填写会议基本信息并邀请参与人员",
          "主持评审会议，记录讨论结果",
          "生成月度评审批复报告",
          "启动三步确认流程",
          "提交分管院领导最终审批"
        ],
        tips: "确保评审过程公正透明，记录完整"
      },
      {
        title: "制定综合计划",
        steps: [
          "查看状态为「批复」的项目",
          "根据优先级添加到年度综合计划",
          "安排项目实施时序",
          "项目状态自动变为「下达」"
        ],
        tips: "综合考虑各方需求和资源限制"
      }
    ]
  },
  "bidding": {
    "中心专职": [
      {
        title: "查看招标采购信息",
        steps: [
          "在招标管理页面查看招标文件",
          "下载需要的技术规格和招标文档",
          "关注招标进度和重要时间节点",
          "配合提供技术支持和答疑"
        ],
        tips: "及时关注招标信息更新，积极配合采购工作"
      }
    ],
    "部门专职": [
      {
        title: "管理招标文档",
        steps: [
          "在招标管理页面上传招标文件",
          "维护技术规格书和招标公告",
          "管理投标文件和评标记录",
          "更新招标进度和结果"
        ],
        tips: "确保招标文档完整规范，流程透明公开"
      },
      {
        title: "采购需求管理",
        steps: [
          "收集各中心采购需求",
          "制定采购计划和时间安排",
          "协调供应商资源",
          "跟踪采购执行进度"
        ],
        tips: "统筹规划采购需求，提高采购效率"
      }
    ]
  },
  "contract": {
    "中心专职": [
      {
        title: "查看合同信息",
        steps: [
          "在合同管理页面查看相关合同",
          "了解合同执行状态和进度",
          "查看项目绑定关系",
          "跟踪合同履约情况"
        ],
        tips: "定期关注合同执行情况，及时反馈问题"
      }
    ],
    "部门专职": [
      {
        title: "合同信息管理",
        steps: [
          "上传合同Excel文件或手动录入",
          "完善合同基本信息和关键条款",
          "设置合同提醒和关键节点",
          "维护合同执行状态"
        ],
        tips: "确保合同信息录入完整准确"
      },
      {
        title: "项目合同绑定",
        steps: [
          "选择需要绑定的合同",
          "从「下达」状态项目中选择对应项目",
          "确认绑定关系并保存",
          "必要时可以解绑重新设置"
        ],
        tips: "确保绑定关系准确，便于后续管理"
      }
    ]
  },
  "progress": {
    "中心专职": [
      {
        title: "创建进度报销",
        steps: [
          "选择已绑定合同的下达项目",
          "选择进度类型：里程碑完成或百分比完成",
          "选择报销类型：差旅费、材料费或外包服务费",
          "填写完成情况说明和报销金额",
          "上传相关证明材料：验收证明、发票等",
          "提交部门经理审批"
        ],
        tips: "确保报销材料齐全有效，金额与实际进度匹配"
      },
      {
        title: "跟踪报销进度",
        steps: [
          "在待办事项中查看审批状态",
          "及时响应审批人的意见",
          "补充或修改相关材料",
          "关注财务审批结果"
        ],
        tips: "保持与审批人员的沟通"
      }
    ],
    "中心领导": [
      {
        title: "审批进度报销",
        steps: [
          "在待办事项中查看进度报销审批任务",
          "核实项目执行情况和完成进度",
          "检查报销材料的完整性和真实性",
          "确认报销金额与实际进度的匹配性",
          "给出审批意见并转交财务审批"
        ],
        tips: "重点关注报销金额是否与项目实际进度相符"
      }
    ],
    "部门专职": [
      {
        title: "开票管理",
        steps: [
          "查看自动触发的开票提醒",
          "手动创建开票记录",
          "录入发票号码和开票金额",
          "跟踪发票状态和回款情况",
          "处理逾期账款预警"
        ],
        tips: "及时处理开票，关注回款风险"
      }
    ]
  },
  "settlement": {
    "部门专职": [
      {
        title: "收款汇总管理",
        steps: [
          "查看项目结算汇总统计",
          "分析回款率和逾期情况",
          "生成结算统计报表",
          "发送催款通知",
          "跟踪欠款回收进度"
        ],
        tips: "建立结算台账，加强资金管理"
      },
      {
        title: "银行对账操作",
        steps: [
          "导入银行流水Excel文件",
          "执行智能匹配算法",
          "人工核实匹配结果",
          "处理异常和差异记录",
          "生成对账报告"
        ],
        tips: "定期进行对账，及时发现差异"
      }
    ]
  }
}

// 常见问题 - 按模块分类
const FAQ_DATA = {
  "reserve": [
    {
      q: "如何修改已提交的项目？",
      a: "项目提交审批后无法直接修改。如需修改，请联系审批人驳回后重新编辑，或联系系统管理员处理。",
      roles: ["中心专职", "部门专职"]
    },
    {
      q: "项目状态有哪些，分别表示什么？",
      a: "编制（草稿状态）→评审（等待月度评审）→批复（通过评审）→下达（纳入综合计划）。只有下达状态的项目可以绑定合同。",
      roles: ["所有角色"]
    },
    {
      q: "如何查看项目审批进度？",
      a: "可以在待办事项页面查看相关审批任务，或在储备项目列表中查看项目当前状态。",
      roles: ["中心专职", "中心领导"]
    },
    {
      q: "月度评审是如何进行的？",
      a: "部门专职组织月度评审，邀请相关人员参与。评审结果会生成批复报告，需要相关人员确认后提交分管院领导审批。",
      roles: ["部门专职", "中心领导", "部门领导"]
    },
    {
      q: "综合计划包含哪些内容？",
      a: "综合计划包含年度内所有通过评审的储备项目，按照优先级和时间安排项目实施顺序。",
      roles: ["部门专职", "部门领导", "分管院领导"]
    }
  ],
  "bidding": [
    {
      q: "如何查看最新的招标信息？",
      a: "在招标管理页面可以查看所有招标文件和公告，支持按时间、类型等条件筛选。",
      roles: ["中心专职", "部门专职"]
    },
    {
      q: "招标文件支持哪些格式？",
      a: "支持PDF、DOC、DOCX、XLSX等常见办公文档格式，单个文件大小不超过10MB。",
      roles: ["部门专职"]
    },
    {
      q: "如何参与招标流程？",
      a: "中心专职主要负责技术支持和需求确认，具体招标流程由发展策划部统一组织管理。",
      roles: ["中心专职"]
    }
  ],
  "contract": [
    {
      q: "合同可以绑定多个项目吗？",
      a: "不可以。系统设计为一个合同只能绑定一个项目，确保合同管理的清晰性。",
      roles: ["部门专职"]
    },
    {
      q: "如何解绑已绑定的合同？",
      a: "在合同管理页面，点击已绑定合同的「解绑」按钮，确认后即可解除绑定关系。",
      roles: ["部门专职"]
    },
    {
      q: "合同信息可以批量导入吗？",
      a: "可以。支持Excel格式的合同信息批量导入，系统会自动解析合同基本信息。",
      roles: ["部门专职"]
    },
    {
      q: "只有下达状态的项目才能绑定合同吗？",
      a: "是的。只有状态为「下达」的项目才能与合同进行绑定，确保项目已正式启动。",
      roles: ["部门专职"]
    }
  ],
  "progress": [
    {
      q: "进度报销需要哪些材料？",
      a: "根据报销类型需要：里程碑完成需验收证明；差旅费需车票住宿发票；材料费需采购订单；外包服务费需服务合同。",
      roles: ["中心专职"]
    },
    {
      q: "报销金额有什么限制？",
      a: "单次报销金额不能超过合同剩余未报销金额，系统会自动校验。",
      roles: ["中心专职"]
    },
    {
      q: "进度报销的审批流程是什么？",
      a: "提交人→部门经理审批→财务审批→支付完成。每个环节都有相应的待办提醒。",
      roles: ["中心专职", "中心领导", "分管院领导"]
    },
    {
      q: "开票是如何触发的？",
      a: "开票可以基于进度报销自动触发，也可以由财务部专职手动创建开票记录。",
      roles: ["部门专职"]
    }
  ],
  "settlement": [
    {
      q: "如何查看项目回款情况？",
      a: "在结算管理的收款汇总页面可以查看各项目的开票金额、回款金额和逾期情况。",
      roles: ["部门专职", "部门领导"]
    },
    {
      q: "银行对账如何操作？",
      a: "导入银行流水Excel文件后，系统自动匹配开票记录，需人工确认匹配结果并处理异常。",
      roles: ["部门专职（财务部）"]
    },
    {
      q: "逾期账款如何处理？",
      a: "系统会自动预警逾期账款，需要及时发送催款通知，跟踪回收进度，必要时采取法律措施。",
      roles: ["部门专职"]
    },
    {
      q: "对账差异如何处理？",
      a: "对于银行流水与业务数据的差异，需要核实原因，可能是手续费、部分付款等，需要手动调整。",
      roles: ["部门专职（财务部）"]
    }
  ]
}

// 操作技巧 - 按模块分类
const OPERATION_TIPS = {
  "reserve": [
    "项目创建时信息要详细准确，避免后续频繁修改",
    "财务预算要合理规划，考虑通胀和风险因素",
    "及时跟进审批进度，主动与审批人沟通",
    "月度评审前要充分准备材料，确保项目信息完整",
    "批复报告确认时要仔细核对，确保准确无误",
    "项目状态变化要及时关注，把握关键节点",
    "综合计划制定要统筹考虑，平衡各方需求"
  ],
  "bidding": [
    "招标文档要规范完整，确保信息准确性",
    "及时更新招标进度，保持信息透明度",
    "建立供应商评价档案，维护长期合作关系",
    "采购需求要详细准确，包含完整的技术规格",
    "合理安排采购时间，避免集中采购造成资源紧张",
    "关注招标法规变化，确保流程合规性"
  ],
  "contract": [
    "建立完善的合同台账，定期更新执行状态",
    "设置关键节点提醒，避免遗漏重要事项",
    "确保合同项目绑定关系准确，便于后续管理",
    "加强履约过程监管，及时发现和处理问题",
    "重视合同变更管理，控制项目风险",
    "做好合同档案管理，便于查询和追溯"
  ],
  "progress": [
    "建立里程碑管理体系，明确关键节点",
    "及时提交进度材料，避免影响报销时效",
    "确保报销材料齐全有效，金额与实际进度匹配",
    "保持与相关部门的沟通协调",
    "做好进度档案管理，便于后续查询",
    "关注审批流程，及时响应审批意见"
  ],
  "settlement": [
    "建立开票提醒机制，确保及时开票",
    "定期进行银行对账，及时发现差异",
    "关注回款风险，建立预警机制",
    "加强逾期账款管理，提高回收率",
    "做好财务数据分析，为决策提供支持",
    "建立客户信用档案，评估回款风险"
  ]
}

export default function OperationGuide() {
  const { currentUser } = useUser()
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedModule, setSelectedModule] = useState("reserve")
  
  const currentRole = currentUser?.role || "中心专职"
  const roleConfig = ROLE_PERMISSIONS[currentRole as keyof typeof ROLE_PERMISSIONS]
  const currentModule = MODULE_CONFIG[selectedModule as keyof typeof MODULE_CONFIG]
  const ModuleIcon = currentModule.icon

  // 权限检查函数 - 基于实际系统权限逻辑
  const hasModuleAccess = (moduleKey: string, subModuleKey: string) => {
    if (!currentUser) return false
    
    switch (moduleKey) {
      case "reserve":
        if (subModuleKey === "储备项目列表") {
          // 储备管理：所有角色都可以访问（至少查看）
          return true
        } else if (subModuleKey === "月度评审") {
          // 可研评审及批复：只有发展策划部门、院领导办公室和分管院领导
          return currentUser.department === "发展策划部门" || 
                 currentUser.department === "院领导办公室" || 
                 currentUser.role === "分管院领导"
        } else if (subModuleKey === "综合计划") {
          // 计划编制及调整：只有发展策划部门、院领导办公室和分管院领导
          return currentUser.department === "发展策划部门" || 
                 currentUser.department === "院领导办公室" || 
                 currentUser.role === "分管院领导"
        }
        break
      case "bidding":
        // 招标采购：所有角色都可以访问（查看）
        return true
      case "contract":
        // 合同管理：所有角色都可以访问（查看）
        return true
      case "progress":
        if (subModuleKey === "报销管理") {
          // 进度报销：中心专职、部门专职、相关领导
          return currentUser.role === "中心专职" || 
                 currentUser.role === "部门专职" ||
                 currentUser.role === "中心领导" ||
                 currentUser.role === "部门领导" ||
                 currentUser.role === "分管院领导"
        } else if (subModuleKey === "开票系统") {
          // 开票管理：主要是财务部专职
          return currentUser.role === "部门专职" && currentUser.department === "财务部" ||
                 currentUser.role === "分管院领导"
        }
        break
      case "settlement":
        // 结算管理：主要是财务部专职和领导
        return currentUser.role === "部门专职" && currentUser.department === "财务部" ||
               currentUser.role === "部门领导" && currentUser.department === "财务部" ||
               currentUser.role === "分管院领导"
    }
    return false
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* 页面标题 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">运营管控平台操作说明</h1>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
          <div className="flex items-center gap-4 mb-4">
            <Users className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-800">欢迎使用储备项目管理系统</h2>
              <p className="text-gray-600 mt-1">基于角色的项目全生命周期管理平台</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <Badge className={roleConfig?.color}>
              当前角色：{roleConfig?.name}
            </Badge>
            <span className="text-gray-600">•</span>
            <span className="text-sm text-gray-600">{roleConfig?.description}</span>
          </div>
          
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-3">
              <span className="font-medium">点击下方功能模块卡片</span>，查看详细操作说明
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(MODULE_CONFIG).map(([key, module]) => {
              const Icon = module.icon
              const isSelected = selectedModule === key
              return (
                <div 
                  key={key} 
                  onClick={() => setSelectedModule(key)}
                  className={`
                    relative cursor-pointer p-3 rounded-lg border-2 shadow-sm transition-all duration-200 hover:shadow-md
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-4 w-4 ${isSelected ? 'text-blue-600' : module.color}`} />
                    <span className={`font-medium text-sm ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                      {module.name}
                    </span>
                  </div>
                  <p className={`text-xs ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                    {module.description}
                  </p>
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">功能概览</TabsTrigger>
          <TabsTrigger value="quickstart">快速入门</TabsTrigger>
          <TabsTrigger value="permissions">权限说明</TabsTrigger>
          <TabsTrigger value="faq">常见问题</TabsTrigger>
          <TabsTrigger value="tips">操作技巧</TabsTrigger>
        </TabsList>

        {/* 功能概览 */}
        <TabsContent value="overview" className="mt-6">
          <div className="space-y-6">

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <ModuleIcon className={`h-6 w-6 ${currentModule.color}`} />
                  <div>
                    <h3 className="text-xl">{currentModule.name}</h3>
                    <p className="text-sm text-gray-600 font-normal">{currentModule.description}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentModule.subModules.map((subModule, index) => {
                    const hasAccess = hasModuleAccess(selectedModule, subModule.key)
                    return (
                      <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h4 className="font-semibold text-gray-800 mb-2">{subModule.name}</h4>
                        <p className="text-sm text-gray-600 mb-3">{subModule.description}</p>
                        <div className="flex items-center gap-2">
                          {hasAccess ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-xs text-green-600">您有此功能的访问权限</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-xs text-red-600">您暂无此功能的访问权限</span>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  业务流程概览
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                        1
                      </div>
                      <p className="text-xs mt-1">项目创建</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <div className="text-center">
                      <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-semibold text-sm">
                        2
                      </div>
                      <p className="text-xs mt-1">审批评审</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <div className="text-center">
                      <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold text-sm">
                        3
                      </div>
                      <p className="text-xs mt-1">计划下达</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <div className="text-center">
                      <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-semibold text-sm">
                        4
                      </div>
                      <p className="text-xs mt-1">执行结算</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <strong>编制阶段：</strong>创建项目、完善信息、提交审批
                  </div>
                  <div>
                    <strong>评审阶段：</strong>月度评审、批复报告、三步确认
                  </div>
                  <div>
                    <strong>批复阶段：</strong>综合计划、项目下达、合同绑定
                  </div>
                  <div>
                    <strong>执行阶段：</strong>进度报销、开票回款、项目结算
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 快速入门 */}
        <TabsContent value="quickstart" className="mt-6">
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              以下是根据您的角色（{roleConfig?.name}）和选择的模块（{currentModule.name}）定制的快速入门指南。
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            {QUICK_START_GUIDES[selectedModule as keyof typeof QUICK_START_GUIDES]?.[currentRole as keyof typeof QUICK_START_GUIDES[keyof typeof QUICK_START_GUIDES]]?.map((guide, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                      {index + 1}
                    </div>
                    {guide.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {guide.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center font-medium text-xs mt-0.5">
                          {stepIndex + 1}
                        </div>
                        <span className="text-sm text-gray-700 flex-1">{step}</span>
                      </div>
                    ))}
                  </div>
                  <Alert className="mt-4">
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>
                      <strong>提示：</strong>{guide.tips}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )) || (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold mb-2">暂无相关操作指南</h3>
                    <p className="text-sm">您当前的角色在{currentModule.name}模块中暂无具体操作，请选择其他模块查看。</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* 权限说明 */}
        <TabsContent value="permissions" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  您的权限详情
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={`${roleConfig?.color} mb-4`}>
                  {roleConfig?.name}
                </Badge>
                <p className="text-sm text-gray-600 mb-4">{roleConfig?.description}</p>
                <div className="space-y-3">
                  {roleConfig?.permissions.map((permission, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm font-medium">{permission}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  系统角色说明
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {Object.entries(ROLE_PERMISSIONS).map(([role, config]) => (
                      <div key={role} className={`border rounded-lg p-4 ${role === currentRole ? 'border-blue-200 bg-blue-50' : ''}`}>
                        <Badge className={config.color}>
                          {config.name}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-2 mb-3">{config.description}</p>
                        <div className="space-y-1">
                          {config.permissions.slice(0, 3).map((permission, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                              <span className="text-sm text-gray-600">{permission}</span>
                            </div>
                          ))}
                          {config.permissions.length > 3 && (
                            <div className="text-xs text-gray-500 ml-4">
                              等共 {config.permissions.length} 项权限
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 常见问题 */}
        <TabsContent value="faq" className="mt-6">
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              以下是{currentModule.name}模块的常见问题解答。
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            {FAQ_DATA[selectedModule as keyof typeof FAQ_DATA]?.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-500" />
                    {currentModule.name} - 常见问题
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {FAQ_DATA[selectedModule as keyof typeof FAQ_DATA]?.map((item, itemIndex) => (
                      <div key={itemIndex} className="border-l-4 border-blue-200 pl-4 py-2">
                        <h4 className="font-semibold text-gray-800 mb-2">{item.q}</h4>
                        <p className="text-gray-700 text-sm mb-2">{item.a}</p>
                        <div className="flex gap-2">
                          {Array.isArray(item.roles) ? 
                            item.roles.map((role, roleIndex) => (
                              <Badge key={roleIndex} variant="outline" className="text-xs">
                                {role}
                              </Badge>
                            )) :
                            <Badge variant="outline" className="text-xs">{item.roles}</Badge>
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold mb-2">暂无常见问题</h3>
                    <p className="text-sm">{currentModule.name}模块暂无常见问题记录，如有疑问请联系系统管理员。</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* 操作技巧 */}
        <TabsContent value="tips" className="mt-6">
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              以下是{currentModule.name}模块的实用操作技巧和最佳实践。
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            {OPERATION_TIPS[selectedModule as keyof typeof OPERATION_TIPS]?.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    {currentModule.name} - 操作技巧
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {OPERATION_TIPS[selectedModule as keyof typeof OPERATION_TIPS]?.map((tip, tipIndex) => (
                      <Alert key={tipIndex}>
                        <Lightbulb className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {tip}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold mb-2">暂无操作技巧</h3>
                    <p className="text-sm">{currentModule.name}模块暂无操作技巧记录，如有建议请联系系统管理员。</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}