import { NextResponse } from 'next/server'
import { approveProgressReimbursement } from '@/lib/data'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, approved, approverType, approverId, approverName, comment } = body
    
    if (!id || approved === undefined || !approverType || !approverId || !approverName) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }
    
    const updatedReimbursement = await approveProgressReimbursement(
      id, 
      approved, 
      approverType, 
      approverId, 
      approverName, 
      comment
    )
    
    if (!updatedReimbursement) {
      return NextResponse.json({ error: '进度报销不存在' }, { status: 404 })
    }
    
    return NextResponse.json(updatedReimbursement)
  } catch (error) {
    console.error('审批进度报销失败:', error)
    return NextResponse.json({ error: '审批失败' }, { status: 500 })
  }
} 