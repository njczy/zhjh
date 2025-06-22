import { NextRequest, NextResponse } from 'next/server'
import { initializeData } from '../../../lib/data'

export async function POST(request: NextRequest) {
  try {
    console.log('API: 初始化数据请求')
    
    // 调用数据初始化函数
    const result = initializeData()
    
    console.log('API: 数据初始化完成', {
      projectsCount: result.projects.length,
      approvalsCount: result.approvals.length,
      reviewsCount: result.monthlyReviews.length,
      minutesCount: result.meetingMinutes.length
    })
    
    return NextResponse.json({
      success: true,
      message: '数据初始化成功',
      projects: result.projects,
      approvals: result.approvals,
      monthlyReviews: result.monthlyReviews,
      meetingMinutes: result.meetingMinutes
    })
  } catch (error) {
    console.error('API: 数据初始化失败', error)
    
    return NextResponse.json(
      {
        success: false,
        message: '数据初始化失败',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: '请使用POST方法来初始化数据',
    endpoint: '/api/initialize-data',
    method: 'POST'
  })
} 