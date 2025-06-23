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
  Lightbulb
} from "lucide-react"
import { useUser } from "@/contexts/UserContext"

// 定义角色权限配置
const ROLE_PERMISSIONS = {
  "中心专职": {
    name: "中心专职",
    color: "bg-blue-100 text-blue-800",
    permissions: [
      "查看本中心储备项目",
      "新增储备项目",
      "编辑储备项目",
      "删除储备项目",
      "提交项目审批",
      "参与月度评审",
      "查看综合计划"
    ]
  },
  "中心领导": {
    name: "中心领导", 
    color: "bg-purple-100 text-purple-800",
    permissions: [
      "查看本中心储备项目",
      "审批储备项目",
      "参与月度评审决策",
      "查看综合计划",
      "批准项目变更"
    ]
  },
  "部门专职": {
    name: "部门专职",
    color: "bg-green-100 text-green-800", 
    permissions: [
      "查看所有储备项目",
      "新增储备项目",
      "编辑储备项目",
      "删除储备项目",
      "组织月度评审",
      "制定综合计划",
      "管理批复报告"
    ]
  },
  "部门领导": {
    name: "部门领导",
    color: "bg-orange-100 text-orange-800",
    permissions: [
      "查看所有储备项目", 
      "审批储备项目",
      "参与月度评审决策",
      "审批综合计划",
      "最终决策权"
    ]
  },
  "分管院领导": {
    name: "分管院领导",
    color: "bg-red-100 text-red-800",
    permissions: [
      "查看所有储备项目",
      "最终审批权",
      "批准综合计划",
      "重大决策权"
    ]
  }
}

// 操作流程步骤
const OPERATION_WORKFLOWS = {
  "储备项目管理": {
    "中心专职": [
      {
        step: 1,
        title: "项目创建",
        description: "在储备项目管理页面点击「新增项目」按钮",
        details: [
          "填写项目基本信息：项目名称、项目类型、归口管理部门等",
          "设置项目时间：实施开始时间、实施结束时间",
          "填写项目内容：必要性、可行性、立项依据、实施方案",
          "配置财务信息：按年度填写计划收入、支出、税率等",
          "选择项目负责人（通常为本中心领导）"
        ],
        tips: "可以先保存草稿，完善后再提交审批"
      },
      {
        step: 2,
        title: "项目编辑",
        description: "对已创建的项目进行修改和完善",
        details: [
          "只能编辑状态为「编制」的项目",
          "可以修改项目的所有信息字段",
          "修改后需要重新保存或提交审批",
          "已提交审批的项目无法编辑"
        ],
        tips: "建议在提交审批前仔细检查所有信息"
      },
      {
        step: 3,
        title: "提交审批",
        description: "将完善的项目提交给上级审批",
        details: [
          "项目信息填写完整后，点击「提交审批」",
          "系统自动生成审批流程",
          "项目状态变更为「评审」",
          "等待中心领导或部门领导审批"
        ],
        tips: "提交后无法撤回，请确保信息准确"
      },
      {
        step: 4,
        title: "跟踪进度",
        description: "通过待办事项跟踪项目审批进度",
        details: [
          "在待办事项页面查看审批状态",
          "及时响应审批人的反馈意见",
          "项目被驳回时需要修改后重新提交"
        ],
        tips: "保持与审批人的沟通，及时处理反馈"
      }
    ],
    "中心领导": [
      {
        step: 1,
        title: "审批项目",
        description: "审批本中心专职提交的储备项目",
        details: [
          "在待办事项中查看待审批项目",
          "点击项目名称查看详细信息",
          "评估项目的必要性和可行性",
          "给出审批意见：同意或驳回"
        ],
        tips: "审批时要考虑项目与中心发展规划的匹配度"
      },
      {
        step: 2,
        title: "参与评审",
        description: "参与月度项目评审会议",
        details: [
          "接收月度评审邀请通知",
          "确认参与评审的项目列表",
          "在评审会上发表意见和建议",
          "对项目进行投票表决"
        ],
        tips: "提前了解项目背景，准备评审意见"
      }
    ],
    "部门专职": [
      {
        step: 1,
        title: "项目管理",
        description: "管理全院的储备项目",
        details: [
          "查看所有中心提交的储备项目",
          "协调项目间的资源配置",
          "统筹项目时间安排",
          "协助解决项目实施中的问题"
        ],
        tips: "重点关注项目间的协同性和资源优化"
      },
      {
        step: 2,
        title: "月度评审组织",
        description: "组织和主持月度项目评审",
        details: [
          "制定月度评审计划",
          "邀请相关人员参与评审",
          "准备评审材料和议程",
          "主持评审会议并记录结果",
          "生成评审报告和批复文件"
        ],
        tips: "确保评审流程规范，记录完整"
      },
      {
        step: 3,
        title: "综合计划制定",
        description: "制定年度综合计划",
        details: [
          "收集各中心的项目需求",
          "分析项目可行性和优先级",
          "制定年度综合计划草案",
          "协调各方意见并完善计划"
        ],
        tips: "计划要符合院整体发展战略"
      }
    ],
    "部门领导": [
      {
        step: 1,
        title: "战略决策",
        description: "参与重要项目的战略决策",
        details: [
          "审批重要储备项目",
          "参与综合计划审定",
          "协调跨部门资源配置",
          "处理项目争议和冲突"
        ],
        tips: "决策要考虑全院整体利益"
      },
      {
        step: 2,
        title: "最终审批",
        description: "对综合计划进行最终审批",
        details: [
          "审查综合计划的完整性",
          "评估计划的可执行性",
          "给出最终审批意见",
          "授权计划的正式发布"
        ],
        tips: "审批前要充分征求各方意见"
      }
    ],
    "分管院领导": [
      {
        step: 1,
        title: "最终决策",
        description: "对重大项目和计划进行最终决策",
        details: [
          "审批重大储备项目",
          "批准年度综合计划",
          "处理重大争议和问题",
          "指导项目实施方向"
        ],
        tips: "决策要符合院发展战略和政策要求"
      }
    ]
  },
  "综合计划管理": {
    "部门专职": [
      {
        step: 1,
        title: "计划制定",
        description: "制定年度综合计划",
        details: [
          "在综合计划管理页面创建新计划",
          "选择纳入计划的储备项目",
          "设置计划的基本信息和描述",
          "安排项目的实施时序"
        ],
        tips: "计划要兼顾各中心的发展需求"
      },
      {
        step: 2,
        title: "计划调整",
        description: "根据实际情况调整计划内容",
        details: [
          "监控项目实施进度",
          "根据变化调整项目安排",
          "协调资源重新配置",
          "更新计划文档"
        ],
        tips: "调整要及时，并通知相关人员"
      }
    ],
    "部门领导": [
      {
        step: 1,
        title: "计划审批",
        description: "审批年度综合计划",
        details: [
          "审查计划的合理性",
          "评估资源配置效率",
          "确认计划可执行性",
          "给出审批意见"
        ],
        tips: "审批要考虑院整体发展目标"
      }
    ]
  }
}

// 常见问题解答
const FAQ_DATA = [
  {
    question: "如何新增储备项目？",
    answer: "中心专职和部门专职可以在储备项目管理页面点击「新增项目」按钮，填写项目信息后保存或提交审批。",
    roles: ["中心专职", "部门专职"]
  },
  {
    question: "项目提交审批后还能修改吗？",
    answer: "项目提交审批后无法直接修改。如需修改，需要等待审批人驳回后重新编辑，或联系管理员处理。",
    roles: ["中心专职", "部门专职"]
  },
  {
    question: "如何查看项目审批进度？",
    answer: "可以在待办事项页面查看项目审批状态，或在储备项目列表中查看项目当前状态。",
    roles: ["中心专职", "部门专职", "中心领导", "部门领导"]
  },
  {
    question: "月度评审是如何进行的？",
    answer: "部门专职组织月度评审，邀请相关人员参与。评审结果会生成批复报告，需要相关人员确认后提交分管院领导审批。",
    roles: ["部门专职", "中心领导", "部门领导"]
  },
  {
    question: "综合计划包含哪些内容？",
    answer: "综合计划包含年度内所有通过评审的储备项目，按照优先级和时间安排项目实施顺序。",
    roles: ["部门专职", "部门领导", "分管院领导"]
  },
  {
    question: "如何处理项目冲突？",
    answer: "项目冲突由部门领导协调处理，必要时上报分管院领导决策。涉及资源分配的问题优先保证重点项目。",
    roles: ["部门领导", "分管院领导"]
  }
]

// 操作技巧
const OPERATION_TIPS = {
  "中心专职": [
    "项目信息填写要详细准确，避免审批时被驳回",
    "定期关注待办事项，及时处理审批反馈",
    "与中心领导保持沟通，了解项目优先级",
    "利用项目搜索和筛选功能快速定位项目"
  ],
  "中心领导": [
    "审批时要考虑项目与中心发展规划的匹配度",
    "及时处理待办事项，避免影响项目进度",
    "参与月度评审时提前了解项目背景",
    "对重要项目给出详细的审批意见"
  ],
  "部门专职": [
    "统筹考虑全院项目布局和资源配置",
    "月度评审前充分准备材料和议程",
    "及时跟进批复报告的确认流程",
    "定期更新综合计划，确保时效性"
  ],
  "部门领导": [
    "重点关注项目的战略意义和全局影响",
    "协调跨部门资源配置和利益平衡",
    "对综合计划进行全面审查",
    "及时处理重大争议和问题"
  ],
  "分管院领导": [
    "从院发展战略高度审视项目和计划",
    "重点关注重大项目的风险和收益",
    "确保决策符合政策要求和发展需要",
    "指导项目实施的总体方向"
  ]
}

export default function OperationGuide() {
  const { currentUser } = useUser()
  const [activeTab, setActiveTab] = useState("overview")
  
  const currentRole = currentUser?.role || "中心专职"
  const roleConfig = ROLE_PERMISSIONS[currentRole as keyof typeof ROLE_PERMISSIONS]

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">储备及综合计划模块操作说明</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={roleConfig?.color}>
            当前角色：{roleConfig?.name}
          </Badge>
          <span className="text-gray-600">根据您的角色权限定制的操作指南</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="workflow">操作流程</TabsTrigger>
          <TabsTrigger value="permissions">权限说明</TabsTrigger>
          <TabsTrigger value="faq">常见问题</TabsTrigger>
          <TabsTrigger value="tips">操作技巧</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  储备项目管理
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  储备项目管理是整个系统的核心模块，用于管理各中心的项目储备，包括项目的创建、编辑、审批和跟踪。
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">项目全生命周期管理</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">多级审批流程</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">财务信息管理</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  综合计划管理
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  综合计划管理用于制定和管理年度综合计划，统筹安排通过评审的储备项目，优化资源配置。
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">年度计划制定</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">项目优先级排序</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">资源配置优化</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  月度评审流程
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  月度评审是项目管理的重要环节，通过定期评审确保项目质量和进度，为综合计划提供决策依据。
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">定期项目评审</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">批复报告生成</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">多方确认流程</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  您的角色权限
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={`${roleConfig?.color} mb-3`}>
                  {roleConfig?.name}
                </Badge>
                <div className="space-y-2">
                  {roleConfig?.permissions.slice(0, 4).map((permission, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{permission}</span>
                    </div>
                  ))}
                  {roleConfig?.permissions.length > 4 && (
                    <div className="text-sm text-gray-500">
                      等共 {roleConfig.permissions.length} 项权限...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workflow" className="mt-6">
          <div className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                以下是根据您的角色（{roleConfig?.name}）定制的操作流程指南。
              </AlertDescription>
            </Alert>

            {Object.entries(OPERATION_WORKFLOWS).map(([module, workflows]) => {
              const currentRoleWorkflow = workflows[currentRole as keyof typeof workflows]
              if (!currentRoleWorkflow) return null

              return (
                <Card key={module}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      {module}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {currentRoleWorkflow.map((step, index) => (
                        <div key={index} className="relative">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                                {step.step}
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg mb-2">{step.title}</h4>
                              <p className="text-gray-600 mb-3">{step.description}</p>
                              <div className="space-y-2">
                                {step.details.map((detail, detailIndex) => (
                                  <div key={detailIndex} className="flex items-start gap-2">
                                    <ArrowRight className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-700">{detail}</span>
                                  </div>
                                ))}
                              </div>
                              {step.tips && (
                                <Alert className="mt-3">
                                  <Lightbulb className="h-4 w-4" />
                                  <AlertDescription>
                                    <strong>提示：</strong>{step.tips}
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          </div>
                          {index < currentRoleWorkflow.length - 1 && (
                            <div className="absolute left-4 top-12 w-px h-6 bg-gray-200"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

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
                  <Settings className="h-5 w-5" />
                  其他角色权限对比
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {Object.entries(ROLE_PERMISSIONS).map(([role, config]) => {
                      if (role === currentRole) return null
                      return (
                        <div key={role} className="border rounded-lg p-4">
                          <Badge className={config.color}>
                            {config.name}
                          </Badge>
                          <div className="mt-3 space-y-2">
                            {config.permissions.slice(0, 3).map((permission, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                <span className="text-sm text-gray-600">{permission}</span>
                              </div>
                            ))}
                            {config.permissions.length > 3 && (
                              <div className="text-xs text-gray-500">
                                等共 {config.permissions.length} 项权限
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="faq" className="mt-6">
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                以下是根据您的角色筛选的常见问题解答。
              </AlertDescription>
            </Alert>

            {FAQ_DATA.filter(faq => faq.roles.includes(currentRole)).map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    {faq.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{faq.answer}</p>
                  <div className="mt-3 flex gap-2">
                    {faq.roles.map((role, roleIndex) => (
                      <Badge key={roleIndex} variant="outline" className="text-xs">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tips" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                操作技巧与建议
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {OPERATION_TIPS[currentRole as keyof typeof OPERATION_TIPS]?.map((tip, index) => (
                  <Alert key={index}>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>
                      {tip}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
