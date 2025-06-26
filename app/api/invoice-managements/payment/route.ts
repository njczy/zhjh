import { NextResponse } from 'next/server'
import { processPayment } from '@/lib/data'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, paidAmount, operatorId, operatorName, isPartial } = body
    
    if (!id || !paidAmount || !operatorId || !operatorName) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }
    
    const updatedInvoice = await processPayment(id, paidAmount, operatorId, operatorName, isPartial)
    
    if (!updatedInvoice) {
      return NextResponse.json({ error: '开票记录不存在' }, { status: 404 })
    }
    
    return NextResponse.json(updatedInvoice)
  } catch (error) {
    console.error('处理回款失败:', error)
    return NextResponse.json({ error: '处理失败' }, { status: 500 })
  }
} 