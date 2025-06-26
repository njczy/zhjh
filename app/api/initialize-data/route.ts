import { NextRequest, NextResponse } from 'next/server'
import { 
  initializeData, 
  getContracts, 
  getProjects,
  getBankTransactions,
  getMatchResults,
  getAdjustmentRecords,
  getProgressReimbursements,
  getInvoiceManagements,
  getProjectSettlements,
  getMonthlyReviews,
  getApprovalReports,
  getTodoItems,
  getApprovals,
  getBiddingDocuments,
  getProcurementDocuments
} from '@/lib/data'

export async function POST(request: NextRequest) {
  try {
    // 初始化基础数据
    await initializeData()
    
    // 获取已生成的数据统计
    const projects = await getProjects()
    const contracts = await getContracts()
    const progressReimbursements = await getProgressReimbursements()
    const invoiceManagements = await getInvoiceManagements()
    const projectSettlements = await getProjectSettlements()
    const monthlyReviews = await getMonthlyReviews()
    const approvalReports = await getApprovalReports()
    const todoItems = await getTodoItems()
    const approvals = await getApprovals()
    const biddingDocuments = await getBiddingDocuments()
    const procurementDocuments = await getProcurementDocuments()
    
    // 初始化银行对账数据
    const bankTransactions = await getBankTransactions() // 这会触发银行流水的初始化
    const matchResults = await getMatchResults() // 这会触发匹配结果的初始化
    const adjustmentRecords = await getAdjustmentRecords() // 这会触发调整记录的初始化

    const result = {
      message: 'Data initialized successfully',
      timestamp: new Date().toISOString(),
      data: {
        projectsCount: projects.length,
        contractsCount: contracts.length,
        progressReimbursementsCount: progressReimbursements.length,
        invoiceManagementCount: invoiceManagements.length,
        projectSettlementsCount: projectSettlements.length,
        monthlyReviewsCount: monthlyReviews.length,
        approvalReportsCount: approvalReports.length,
        todoItemsCount: todoItems.length,
        approvalsCount: approvals.length,
        biddingDocumentsCount: biddingDocuments.length,
        procurementDocumentsCount: procurementDocuments.length,
        bankTransactionsCount: bankTransactions.length,
        matchResultsCount: matchResults.length,
        adjustmentRecordsCount: adjustmentRecords.length
      },
      // 返回完整的数据供客户端同步
      fullData: {
        projects,
        contracts
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Initialize data error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to initialize data',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// 新增GET请求处理，用于获取合同数据
export async function GET(request: NextRequest) {
  try {
    const contracts = await getContracts()
    
    return NextResponse.json({
      success: true,
      data: contracts
    })
  } catch (error) {
    console.error('API: 获取合同数据失败', error)
    return NextResponse.json(
      { success: false, message: '获取合同数据失败', error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
} 