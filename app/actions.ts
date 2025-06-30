// app/actions.ts
"use server"

import {
  getProjects,
  addProject,
  updateProject,
  deleteProject,
  getMonthlyReviews,
  addMonthlyReview,
  updateMonthlyReview,
  getApprovals,
  addApproval,
  updateApproval,
  getDepartmentHead,
  initializeData,
  getMeetingMinutes,
  addMeetingMinutes,
  updateMeetingMinutes,
  getMeetingMinutesByGroup,
  getProjectById,
  getApprovalReports,
  addApprovalReport,
  getApprovalReportsByGroup,
  getContracts,
  type Project,
  type MonthlyReview,
  type Approval,
  type ProjectStatus,
  type User, // Import User type
  type MeetingMinutes,
  type ApprovalReport,
  type TodoItem,
  type ApprovalReportConfirmation,
  mockUsers, // Import mockUsers to find user by name
  getAvailableApprovers,
  getTodoItems,
  getTodoItemsByUser,
  updateTodoItem,
  getConfirmationsByReportId,
  updateApprovalReportConfirmation,
  checkAndAdvanceApprovalWorkflow,
  approveApprovalReport,
  startApprovalReportWorkflow,
  getProjectRelatedUsers,
  checkMainWorkflowAndAdvance,
  startMonthlyReviewParticipantConfirmation,
  getConfirmationsByMeetingGroup,
  updateMonthlyReviewParticipantConfirmation,
  checkMonthlyReviewParticipantConfirmation,
  type MonthlyReviewParticipantConfirmation,
  // 综合计划相关imports
  getComprehensivePlans,
  addComprehensivePlan,
  updateComprehensivePlan,
  getCurrentYearPlans,
  initializeYearlyPlans,
  addProjectsToComprehensivePlan,
  getProjectsInComprehensivePlans,
  removeProjectFromComprehensivePlan,
  type ComprehensivePlan,
} from "@/lib/data"

// 项目相关的Server Actions
export async function getProjectsAction(currentUser: User): Promise<Project[]> {
  const allProjects = await getProjects() // This fetches all mock projects

  if (currentUser.role === "中心领导") {
    // 中心领导可以看到自己中心所有专职负责的项目
    return allProjects.filter((p) => p.center === currentUser.center && p.department === "")
  } else if (currentUser.role === "中心专职") {
    // 中心专职负责增加储备项目，可以看到自己创建的项目
    return allProjects.filter((p) => p.owner === currentUser.name)
  } else if (currentUser.role === "部门专职") {
    // 部门专职可以看到自己创建的项目，但发展策划部门的部门专职可以看到所有中心下的项目
    if (currentUser.department === "发展策划部门") {
      // 发展策划部门的人可以看到所有中心专职负责的项目（中心项目的department为空字符串）
      return allProjects.filter((p) => p.center !== "" && p.department === "")
    }
    return allProjects.filter((p) => p.owner === currentUser.name)
  } else if (currentUser.role === "部门领导") {
    // 部门领导可以看到本部门的项目，但发展策划部门的部门领导可以看到所有中心下的项目
    if (currentUser.department === "发展策划部门") {
      // 发展策划部门的人可以看到所有中心专职负责的项目（中心项目的department为空字符串）
      return allProjects.filter((p) => p.center !== "" && p.department === "")
    }
    return allProjects.filter((p) => p.department === currentUser.department)
  } else if (currentUser.role === "分管院领导") {
    // 分管院领导可以查看所有储备项目
    return allProjects
  }
  // Default: if role is not recognized or has no specific view permission, return empty
  return []
}

export async function getProjectByIdAction(id: string): Promise<Project | null> {
  return await getProjectById(id)
}

export async function addProjectAction(formData: FormData): Promise<Project | null> {
  const name = formData.get("name") as string
  const center = formData.get("center") as string
  const department = formData.get("department") as string
  const owner = formData.get("owner") as string
  const description = formData.get("description") as string
  const status = formData.get("status") as ProjectStatus

  // 修复验证逻辑：department可以为空字符串（中心项目的department为空）
  if (!name || !center || owner === null || !description || !status) {
    console.error("Add project validation failed:", { name, center, department, owner, description, status })
    return null // Basic validation
  }

  // createdAt will be set in lib/data.ts
  const newProject = { name, center, department, owner, description, status }
  return await addProject(newProject)
}

export async function updateProjectAction(formData: FormData): Promise<Project | null> {
  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const center = formData.get("center") as string
  const department = formData.get("department") as string
  const owner = formData.get("owner") as string
  const description = formData.get("description") as string
  const status = formData.get("status") as ProjectStatus

  // 修复验证逻辑：department可以为空字符串（中心项目的department为空）
  if (!id || !name || !center || owner === null || !description || !status) {
    console.error("Validation failed:", { id, name, center, department, owner, description, status })
    return null // Basic validation
  }

  const updates: Partial<Project> = { name, center, department, owner, description, status }
  
  // 添加可选字段
  const projectType = formData.get("projectType") as string
  const managementDepartment = formData.get("managementDepartment") as string
  const fundAttribute = formData.get("fundAttribute") as string
  const startDate = formData.get("startDate") as string
  const endDate = formData.get("endDate") as string
  const necessity = formData.get("necessity") as string
  const feasibility = formData.get("feasibility") as string
  const projectBasis = formData.get("projectBasis") as string
  const implementationPlan = formData.get("implementationPlan") as string
  const departmentHead = formData.get("departmentHead") as string
  const remarks = formData.get("remarks") as string
  const attachmentFileName = formData.get("attachmentFileName") as string

  if (projectType) updates.projectType = projectType
  if (managementDepartment) updates.managementDepartment = managementDepartment
  if (fundAttribute) updates.fundAttribute = fundAttribute
  if (startDate) updates.startDate = startDate
  if (endDate) updates.endDate = endDate
  if (necessity) updates.necessity = necessity
  if (feasibility) updates.feasibility = feasibility
  if (projectBasis) updates.projectBasis = projectBasis
  if (implementationPlan) updates.implementationPlan = implementationPlan
  if (departmentHead) updates.departmentHead = departmentHead
  if (remarks) updates.remarks = remarks
  if (attachmentFileName) updates.attachmentFileName = attachmentFileName

  // 处理财务数据
  const financialRowsString = formData.get("financialRows") as string
  if (financialRowsString) {
    try {
      updates.financialRows = JSON.parse(financialRowsString)
    } catch (error) {
      console.error("Error parsing financial rows:", error)
    }
  }

  return await updateProject(id, updates)
}

export async function deleteProjectAction(id: string): Promise<boolean> {
  return await deleteProject(id)
}

// 月度评审相关的Server Actions
export async function getMonthlyReviewsAction(): Promise<MonthlyReview[]> {
  return await getMonthlyReviews()
}

// 获取所有中心项目（用于月度评审会选择项目）
export async function getAllCenterProjectsAction(): Promise<Project[]> {
  const allProjects = await getProjects()
  // 返回所有中心下的项目（center不为空且department为空）
  return allProjects.filter((p) => p.center !== "" && p.department === "")
}

export async function addMonthlyReviewAction(formData: FormData): Promise<MonthlyReview | null> {
  const id = formData.get("id") as string
  const projectId = formData.get("projectId") as string
  const projectName = formData.get("projectName") as string
  const reviewDate = formData.get("reviewDate") as string
  const reviewer = formData.get("reviewer") as string
  const status = formData.get("status") as MonthlyReview["status"]
  const comments = formData.get("comments") as string

  if (!projectId || !projectName || !reviewDate || !reviewer || !status) {
    return null // Basic validation
  }

  if (id) {
    // 更新现有记录
    const updates = { projectId, projectName, reviewDate, reviewer, status, comments }
    return await updateMonthlyReview(id, updates)
  } else {
    // 新增记录时检查是否已存在
    const existingReviews = await getMonthlyReviews()
    const existingReview = existingReviews.find(r => r.projectId === projectId)
    
    if (existingReview) {
      console.error(`Project ${projectId} already has a review record`)
      return null
    }
    
    const newReview = { projectId, projectName, reviewDate, reviewer, status, comments }
    return await addMonthlyReview(newReview)
  }
}

// 发起多个项目评审的Server Action (用于月度评审会)
export async function initiateMonthlyReviewMeetingAction(
  projectIds: string[],
  reviewerName: string,
  meetingInfo?: { startTime: string; endTime: string; location: string }
): Promise<{ success: boolean; message: string }> {
  if (!projectIds || projectIds.length === 0) {
    return { success: false, message: "请选择至少一个项目发起评审。" }
  }

  const reviewDate = new Date().toISOString().split("T")[0] // Current date for the meeting
  const meetingTime = meetingInfo 
    ? `${new Date(meetingInfo.startTime).toLocaleString()} 至 ${new Date(meetingInfo.endTime).toLocaleString()}`
    : "2025年7月1日 上午10:00" // 默认会议时间
  const meetingLocation = meetingInfo?.location || "会议室A-301" // 默认会议地点

  // NOTE: In a real app, you'd fetch all projects without user context here,
  // or ensure the underlying getProjects function doesn't filter based on user.
  // For mock data, we can pass a center leader to get all projects.
  const centerLeader = mockUsers.find((u) => u.role === "中心领导") || mockUsers[0] // Find center leader or use first user as fallback
  const allProjects = await getProjectsAction(centerLeader)
  
  // Get existing reviews to check for duplicates
  const existingReviews = await getMonthlyReviews()
  const projectsWithPendingReviews: string[] = []
  const projectsAlreadyReviewed: string[] = []

  // 为所有选中的项目生成一个共同的会议组标识
  const timestamp = new Date().getTime()
  const meetingGroup = `${reviewDate}_${timestamp}_${reviewerName}`

  for (const projectId of projectIds) {
    // 1. Get project info (should already be "评审" status)
    const project = allProjects.find((p) => p.id === projectId)
    if (!project) {
      console.error(`Project ${projectId} not found`)
      continue
    }
    
    if (project.status !== "评审") {
      console.error(`Project ${projectId} is not in "评审" status`)
      continue
    }
    
    // Check for existing reviews
    const existingReview = existingReviews.find(r => r.projectId === projectId)
    if (existingReview) {
      if (existingReview.status === "待评审") {
        projectsWithPendingReviews.push(project.name)
        continue
      } else {
        projectsAlreadyReviewed.push(project.name)
        continue
      }
    }

    // 2. Create a new monthly review record for each project
    // 所有项目使用相同的meetingGroup，表示它们在同一个评审会中
    const newReview: Omit<MonthlyReview, "id"> = {
      projectId: projectId,
      projectName: project.name,
      reviewDate: reviewDate,
      reviewer: reviewerName,
      status: "待评审",
      comments: `项目已发起月度评审会，等待 ${reviewerName} 处理。`,
      meetingInfo: meetingInfo ? {
        startTime: meetingInfo.startTime,
        endTime: meetingInfo.endTime,
        location: meetingInfo.location,
        meetingGroup: meetingGroup
      } : undefined
    }
    
    try {
      const addedReview = await addMonthlyReview(newReview)
      if (!addedReview) {
        console.error(`Failed to add review record for project ${projectId}`)
        continue
      }
      console.log(`Successfully added review record for project ${projectId}:`, addedReview)
    } catch (error) {
      console.error(`Error adding review record for project ${projectId}:`, error)
      continue
    }

    // 3. Simulate sending email to project owner
    const projectOwner = allProjects.find((p) => p.id === projectId)?.owner
    if (projectOwner) {
      console.log(
        `模拟邮件发送给 ${projectOwner} (项目: ${project.name}): 您好，您的项目 "${project.name}" 已安排月度评审会。时间：${meetingTime}，地点：${meetingLocation}。请准时参加。`,
      )
    } else {
      console.warn(`未找到项目 ${projectId} 的负责人，无法模拟发送邮件。`)
    }
  }

  const successfulCount = projectIds.length - projectsWithPendingReviews.length - projectsAlreadyReviewed.length
  
  if (successfulCount === 0) {
    return { 
      success: false, 
      message: "没有成功发起任何评审会。所有选中的项目都已有评审记录。" 
    }
  }
  
  let message = `已成功为 ${successfulCount} 个项目发起月度评审会。`
  
  if (projectsWithPendingReviews.length > 0) {
    message += `\n\n以下项目已有待评审记录，已跳过：\n${projectsWithPendingReviews.join('、')}`
  }
  
  if (projectsAlreadyReviewed.length > 0) {
    message += `\n\n以下项目已完成评审，已跳过：\n${projectsAlreadyReviewed.join('、')}`
  }
  
  return { success: true, message }
}

// 审批相关的Server Actions
export async function getApprovalsAction(currentUser: User): Promise<Approval[]> {
  const allApprovals = await getApprovals()
  
  // 所有角色都具备审批权限，根据角色返回相应的审批数据
  if (currentUser.role === "分管院领导") {
    // 分管院领导可以查看所有审批记录
    return allApprovals
  } else if (currentUser.role === "中心领导" || currentUser.role === "部门领导") {
    // 中心领导和部门领导可以查看所有审批记录，以及指派给自己的审批
    return allApprovals
  } else if (currentUser.role === "中心专职" || currentUser.role === "部门专职") {
    // 专职人员可以查看与自己相关的审批（自己提交的或指派给自己的）
    return allApprovals.filter((approval) => 
      approval.approver === currentUser.name || 
      approval.submitter === currentUser.name
    )
  }
  
  // 默认返回空数组（理论上不应该到达这里）
  return []
}

export async function submitProjectForApprovalAction(
  projectId: string,
  submitter: string,
  approver: string
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. 获取项目信息
    const allProjects = await getProjects()
    const project = allProjects.find((p) => p.id === projectId)
    
    if (!project) {
      return { success: false, message: "项目不存在" }
    }
    
    if (project.status !== "编制") {
      return { success: false, message: "只有编制状态的项目才能提交审批" }
    }
    
    if (project.isSubmittedForApproval) {
      return { success: false, message: "项目已提交审批，请勿重复提交" }
    }
    
    // 2. 创建审批记录
    const newApproval = await addApproval({
      projectId,
      projectName: project.name,
      submitter,
      approver,
      submittedAt: new Date().toISOString(),
      status: "待审批"
    })
    
    // 3. 为中心领导创建待办事项
    const { addTodoItem, mockUsers } = await import("@/lib/data")
    // 根据审批人姓名找到对应的用户ID
    const approverUser = mockUsers.find(u => u.name === approver)
    const approverUserId = approverUser ? approverUser.id : approver
    
    await addTodoItem({
      assignedTo: approverUserId,
      assignedBy: submitter,
      type: "project_approval",
      title: `项目审批：${project.name}`,
      description: `${submitter} 提交了项目 "${project.name}" 的审批申请，请审批。`,
      relatedId: newApproval.id,
      status: "待处理",
      priority: "中"
    })
    
    // 4. 更新项目状态
    await updateProject(projectId, {
      isSubmittedForApproval: true,
      approvalId: newApproval.id
    })
    
    console.log(`已为 ${approver} 创建项目审批待办事项：${project.name}`)
    
    return { success: true, message: "项目已成功提交审批，审批人将收到待办通知" }
  } catch (error) {
    console.error("提交审批失败:", error)
    return { success: false, message: "提交审批失败" }
  }
}

export async function approveProjectAction(
  approvalId: string,
  action: "同意" | "驳回",
  comments?: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (action === "驳回" && !comments) {
      return { success: false, message: "驳回时必须填写意见" }
    }
    
    // 1. 获取审批记录
    const allApprovals = await getApprovals()
    const approval = allApprovals.find((a) => a.id === approvalId)
    
    if (!approval) {
      return { success: false, message: "审批记录不存在" }
    }
    
    if (approval.status !== "待审批") {
      return { success: false, message: "该审批已处理" }
    }
    
    // 2. 更新审批记录
    const newStatus = action === "同意" ? "已同意" : "已驳回"
    await updateApproval(approvalId, {
      status: newStatus,
      approvedAt: new Date().toISOString(),
      comments
    })
    
    // 3. 更新项目状态
    if (action === "同意") {
      // 同意：项目状态变为评审，清除审批中标记
      await updateProject(approval.projectId, {
        status: "评审",
        isSubmittedForApproval: false,
        approvalId: undefined
      })
    } else {
      // 驳回：项目状态不变，但变为可编辑
      await updateProject(approval.projectId, {
        isSubmittedForApproval: false,
        approvalId: undefined
      })
    }
    
    return { success: true, message: `项目${action}成功` }
  } catch (error) {
    return { success: false, message: `${action}失败` }
  }
}

// 处理评审不通过的Server Action
export async function handleReviewRejectionAction(
  projectId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. 获取项目信息
    const allProjects = await getProjects()
    const project = allProjects.find((p) => p.id === projectId)
    
    if (!project) {
      return { success: false, message: "项目不存在" }
    }
    
    // 2. 将项目状态改回编制，使其可编辑
    await updateProject(projectId, {
      status: "编制",
      isSubmittedForApproval: false,
      approvalId: undefined
    })
    
    // 3. 模拟发送邮件通知项目负责人
    console.log(
      `模拟邮件发送给 ${project.owner} (项目: ${project.name}): 您好，您的项目 "${project.name}" 评审未通过，已退回。请根据评审意见修改后重新提交审批。`
    )
    
    return { success: true, message: "项目已退回给项目负责人" }
  } catch (error) {
    return { success: false, message: "项目状态更新失败" }
  }
}

// 数据初始化的Server Action
export async function initializeDataAction(): Promise<{ success: boolean; message: string }> {
  try {
    await initializeData()
    
    // 获取初始化后的数据进行验证
    const projects = await getProjects()
    const contracts = await getContracts()
    
    return { 
      success: true, 
      message: `数据初始化成功！已恢复 ${projects.length} 个项目，${contracts.length} 个合同。` 
    }
  } catch (error) {
    console.error('数据初始化失败:', error)
    return { success: false, message: "数据初始化失败" }
  }
}

// 会议纪要相关的Server Actions
export async function getMeetingMinutesAction(): Promise<MeetingMinutes[]> {
  return await getMeetingMinutes()
}

export async function getMeetingMinutesByGroupAction(meetingGroup: string): Promise<MeetingMinutes | null> {
  return await getMeetingMinutesByGroup(meetingGroup)
}

export async function saveMeetingMinutesAction(formData: FormData): Promise<MeetingMinutes | null> {
  try {
    const meetingGroup = formData.get("meetingGroup") as string
    const content = formData.get("content") as string
    const fileName = formData.get("fileName") as string | null
    const submittedBy = formData.get("submittedBy") as string
    const status = (formData.get("status") as string) || "已提交"
    const existingId = formData.get("id") as string | null

    if (!meetingGroup || !content || !submittedBy) {
      throw new Error("缺少必要参数")
    }

    if (existingId) {
      // 更新现有记录
      const updated = await updateMeetingMinutes(existingId, {
        content,
        fileName: fileName || undefined,
        status: status as "草稿" | "已提交"
      })
      return updated
    } else {
      // 创建新记录
      const newMinutes = await addMeetingMinutes({
        meetingGroup,
        content,
        fileName: fileName || undefined,
        submittedBy,
        status: status as "草稿" | "已提交"
      })
      return newMinutes
    }
  } catch (error) {
    console.error("Save meeting minutes error:", error)
    return null
  }
}

// 批复报告相关的Server Actions
export async function getApprovalReportsAction(): Promise<ApprovalReport[]> {
  return await getApprovalReports()
}

export async function getApprovalReportsByGroupAction(meetingGroup: string): Promise<ApprovalReport[]> {
  return await getApprovalReportsByGroup(meetingGroup)
}

export async function saveApprovalReportAction(formData: FormData): Promise<ApprovalReport | null> {
  try {
    const meetingGroup = formData.get("meetingGroup") as string
    const templateType = formData.get("templateType") as ApprovalReport["templateType"]
    const templateName = formData.get("templateName") as string
    const selectedProjectsString = formData.get("selectedProjects") as string
    const tableDataString = formData.get("tableData") as string
    const submittedBy = formData.get("submittedBy") as string
    const fileName = formData.get("fileName") as string

    if (!meetingGroup || !templateType || !templateName || !selectedProjectsString || !tableDataString || !submittedBy || !fileName) {
      throw new Error("缺少必要参数")
    }

    const selectedProjects = JSON.parse(selectedProjectsString)
    const tableData = JSON.parse(tableDataString)

    const newReport = await addApprovalReport({
      meetingGroup,
      templateType,
      templateName,
      selectedProjects,
      tableData,
      submittedAt: new Date().toISOString(),
      submittedBy,
      status: "草稿", // 先保存为草稿状态
      fileName
    })

    // 暂时不自动启动审批流程，避免可能的错误
    // 恢复为手动启动的方式
    console.log(`批复报告已保存，报告ID: ${newReport.id}`)

    return newReport
  } catch (error) {
    console.error("Save approval report error:", error)
    return null
  }
}

// 待办事项相关的Server Actions
export async function getTodoItemsAction(userId: string): Promise<TodoItem[]> {
  return await getTodoItemsByUser(userId)
}

export async function getAllTodoItemsAction(): Promise<TodoItem[]> {
  return await getTodoItems()
}

export async function processTodoItemAction(
  todoId: string,
  action: "confirm" | "reject" | "approve",
  comments?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const todos = await getTodoItems()
    const todo = todos.find(t => t.id === todoId)
    
    if (!todo) {
      return { success: false, message: "待办事项不存在" }
    }
    
    if (todo.status !== "待处理") {
      return { success: false, message: "该待办事项已处理" }
    }
    
    // 更新待办事项状态
    await updateTodoItem(todoId, {
      status: "已处理",
      comments: comments
    })
    
    if (todo.type === "approval_report_confirm") {
      // 检查是否是驳回通知（通过assignedBy判断）
      if (todo.assignedBy === "系统通知") {
        // 这是驳回通知，只需要标记为已处理即可
        return { success: true, message: "已知悉驳回通知" }
      }
      
      // 处理顺序确认流程
      if (action === "confirm") {
        await checkMainWorkflowAndAdvance(todo.relatedId)
        return { success: true, message: "确认成功" }
      } else {
        return { success: true, message: "已拒绝确认" }
      }
      
    } else if (todo.type === "approval_report_approve") {
      // 处理分管院领导审批
      const approved = action === "approve"
      await approveApprovalReport(todo.relatedId, approved, comments)
      
      return { success: true, message: approved ? "审批通过" : "审批驳回" }
      
    } else if (todo.type === "project_approval") {
      // 处理项目审批
      const approved = action === "approve"
      const result = await approveProjectAction(todo.relatedId, approved ? "同意" : "驳回", comments)
      
      return result
      
    } else if (todo.type === "monthly_review_participant_confirm") {
      // 处理月度审核参与人确认
      const meetingGroup = todo.relatedId
      const confirmations = await getConfirmationsByMeetingGroup(meetingGroup)
      const userConfirmation = confirmations.find(c => c.userId === todo.assignedTo)
      
      if (userConfirmation) {
        const newStatus = action === "confirm" ? "已确认" : "已拒绝"
        await updateMonthlyReviewParticipantConfirmation(userConfirmation.id, {
          status: newStatus,
          confirmedAt: new Date().toISOString(),
          comments: comments
        })
        
        // 检查是否所有参与人都确认了
        if (action === "confirm") {
          const allConfirmed = await checkMonthlyReviewParticipantConfirmation(meetingGroup)
          if (allConfirmed) {
            // 所有参与人都确认了，可以进入下一个流程（如果有的话）
            console.log(`会议组 ${meetingGroup} 所有参与人确认完成`)
          }
        }
      }
      
      return { success: true, message: action === "confirm" ? "确认成功" : "已拒绝确认" }
    }
    
    return { success: false, message: "未知的待办类型" }
    
  } catch (error) {
    console.error("Process todo item error:", error)
    return { success: false, message: "处理失败" }
  }
}

// 批复报告确认相关的Server Actions
export async function getApprovalReportConfirmationsAction(reportId: string): Promise<ApprovalReportConfirmation[]> {
  return await getConfirmationsByReportId(reportId)
}

export async function getApprovalReportByIdAction(reportId: string): Promise<ApprovalReport | null> {
  const reports = await getApprovalReports()
  return reports.find(r => r.id === reportId) || null
}

// 根据ID获取审批记录
export async function getApprovalByIdAction(approvalId: string): Promise<Approval | null> {
  const approvals = await getApprovals()
  return approvals.find(a => a.id === approvalId) || null
}

// 手动启动批复报告审批流程的Server Action
export async function startApprovalReportWorkflowAction(reportId: string): Promise<{ success: boolean; message: string }> {
  try {
    await startApprovalReportWorkflow(reportId)
    return { success: true, message: "批复报告已提交评审，相关人员将收到确认通知" }
  } catch (error) {
    console.error("Start approval workflow error:", error)
    return { success: false, message: "提交评审失败，请重试" }
  }
}

// 启动月度审核参与人确认流程的Server Action
export async function startMonthlyReviewParticipantConfirmationAction(meetingGroup: string, projectIds: string[]): Promise<{ success: boolean; message: string }> {
  try {
    await startMonthlyReviewParticipantConfirmation(meetingGroup, projectIds)
    return { success: true, message: "月度审核参与人确认流程已启动，相关人员将按时间顺序收到确认通知" }
  } catch (error) {
    console.error("Start monthly review participant confirmation error:", error)
    return { success: false, message: "启动参与人确认流程失败，请重试" }
  }
}

// 获取月度审核参与人确认状态的Server Action
export async function getMonthlyReviewParticipantConfirmationsAction(meetingGroup: string): Promise<MonthlyReviewParticipantConfirmation[]> {
  return await getConfirmationsByMeetingGroup(meetingGroup)
}

// 调试函数：检查批复报告和相关待办事项的状态
export async function debugApprovalReportWorkflowAction(reportId: string): Promise<{ 
  success: boolean; 
  data?: {
    report: ApprovalReport | null;
    confirmations: ApprovalReportConfirmation[];
    todoItems: TodoItem[];
    relatedUsers: User[];
  };
  message: string;
}> {
  try {
    const reports = await getApprovalReports()
    const report = reports.find(r => r.id === reportId) || null
    
    if (!report) {
      return { success: false, message: "批复报告不存在" }
    }
    
    const confirmations = await getConfirmationsByReportId(reportId)
    const allTodos = await getTodoItems()
    const todoItems = allTodos.filter(t => t.relatedId === reportId)
    const relatedUsers = await getProjectRelatedUsers(report.selectedProjects)
    
    return {
      success: true,
      data: {
        report,
        confirmations,
        todoItems,
        relatedUsers
      },
      message: `调试信息获取成功。报告状态: ${report.status}, 确认记录: ${confirmations.length}, 待办事项: ${todoItems.length}, 相关用户: ${relatedUsers.length}`
    }
  } catch (error) {
    console.error("Debug approval workflow error:", error)
    return { success: false, message: `调试失败: ${error}` }
  }
}

// 新增调试函数：检查系统数据状态
export async function debugSystemDataAction(): Promise<{ 
  success: boolean; 
  data: {
    projects: Project[];
    monthlyReviews: MonthlyReview[];
    approvalReports: ApprovalReport[];
    todoItems: TodoItem[];
    users: User[];
  };
  message: string;
}> {
  try {
    const projects = await getProjects()
    const monthlyReviews = await getMonthlyReviews()
    const approvalReports = await getApprovalReports()
    const todoItems = await getTodoItems()
    const { mockUsers } = await import("@/lib/data")
    
    console.log("系统数据状态调试:")
    console.log(`项目数量: ${projects.length}`)
    console.log(`月度评审记录数量: ${monthlyReviews.length}`)
    console.log(`批复报告数量: ${approvalReports.length}`)
    console.log(`待办事项数量: ${todoItems.length}`)
    console.log(`用户数量: ${mockUsers.length}`)
    
    console.log("项目详情:")
    projects.forEach(p => console.log(`  - ${p.name} (${p.status}) - 负责人: ${p.owner}`))
    
    console.log("月度评审记录详情:")
    monthlyReviews.forEach(r => console.log(`  - ${r.projectName} (${r.status}) - 评审人: ${r.reviewer}`))
    
    console.log("批复报告详情:")
    approvalReports.forEach(r => console.log(`  - ${r.templateName} (${r.status}) - 选择项目: ${r.selectedProjects.length}个`))
    
    console.log("待办事项详情:")
    todoItems.forEach(t => console.log(`  - ${t.title} (${t.status}) - 分配给: ${t.assignedTo}`))
    
    return {
      success: true,
      data: {
        projects,
        monthlyReviews,
        approvalReports,
        todoItems,
        users: mockUsers
      },
      message: `系统数据状态: 项目${projects.length}个, 月度评审${monthlyReviews.length}个, 批复报告${approvalReports.length}个, 待办${todoItems.length}个`
    }
  } catch (error) {
    console.error("Debug system data error:", error)
    return { success: false, data: { projects: [], monthlyReviews: [], approvalReports: [], todoItems: [], users: [] }, message: `调试失败: ${error}` }
  }
}

// ================== 综合计划相关 Server Actions ==================

// 获取综合计划列表
export async function getComprehensivePlansAction(): Promise<ComprehensivePlan[]> {
  return await getComprehensivePlans()
}

// 获取当前年份的综合计划
export async function getCurrentYearPlansAction(): Promise<ComprehensivePlan[]> {
  return await getCurrentYearPlans()
}

// 初始化年度综合计划
export async function initializeYearlyPlansAction(): Promise<{ success: boolean; message: string }> {
  try {
    await initializeYearlyPlans()
    return { success: true, message: '年度综合计划初始化成功' }
  } catch (error) {
    console.error('初始化年度综合计划失败:', error)
    return { success: false, message: '初始化年度综合计划失败' }
  }
}

// 获取可编制的储备项目（状态为"批复"的项目）
export async function getAvailableReserveProjectsAction(currentUser: User): Promise<Project[]> {
  const allProjects = await getProjects()
  
  // 根据用户权限过滤项目
  let filteredProjects: Project[] = []
  
  if (currentUser.role === "中心领导") {
    filteredProjects = allProjects.filter((p) => p.center === currentUser.center && p.department === "")
  } else if (currentUser.role === "中心专职") {
    filteredProjects = allProjects.filter((p) => p.owner === currentUser.name)
  } else if (currentUser.role === "部门专职") {
    if (currentUser.department === "发展策划部门") {
      filteredProjects = allProjects.filter((p) => p.center !== "" && p.department === "")
    } else {
      filteredProjects = allProjects.filter((p) => p.owner === currentUser.name)
    }
  } else if (currentUser.role === "部门领导") {
    if (currentUser.department === "发展策划部门") {
      filteredProjects = allProjects.filter((p) => p.center !== "" && p.department === "")
    } else {
      filteredProjects = allProjects.filter((p) => p.department === currentUser.department)
    }
  }
  
  // 只返回状态为"批复"的项目（可以编制到综合计划中）
  return filteredProjects.filter(p => p.status === "批复")
}

// 计划编制 - 将储备项目添加到综合计划
export async function addProjectsToComprehensivePlanAction(
  planId: string, 
  projectIds: string[]
): Promise<{ success: boolean; message: string; addedCount?: number }> {
  try {
    const success = await addProjectsToComprehensivePlan(planId, projectIds)
    
    if (success) {
      return { 
        success: true, 
        message: `成功将 ${projectIds.length} 个项目添加到综合计划中，项目状态已更新为"下达"`,
        addedCount: projectIds.length
      }
    } else {
      return { success: false, message: '添加项目到综合计划失败' }
    }
  } catch (error) {
    console.error('计划编制失败:', error)
    return { success: false, message: '计划编制操作失败' }
  }
}

// 获取已编制到综合计划中的项目
export async function getProjectsInComprehensivePlansAction(currentUser: User): Promise<Project[]> {
  try {
    return await getProjectsInComprehensivePlans(currentUser)
  } catch (error) {
    console.error("获取综合计划中的项目失败:", error)
    return []
  }
}

// 从综合计划中移除项目
export async function removeProjectFromComprehensivePlanAction(
  planId: string, 
  projectId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const success = await removeProjectFromComprehensivePlan(planId, projectId)
    
    if (success) {
      return { 
        success: true, 
        message: "项目已从综合计划中移除，状态已更新为\"批复\""
      }
    } else {
      return { success: false, message: '移除项目失败' }
    }
  } catch (error) {
    console.error('移除项目失败:', error)
    return { success: false, message: '移除项目操作失败' }
  }
}
