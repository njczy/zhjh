import { NextResponse } from 'next/server'
import { redReverseInvoice } from '@/lib/data'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { originalInvoiceId, operatorId, operatorName, reason } = body
    
    if (!originalInvoiceId || !operatorId || !operatorName || !reason) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }
    
    const updatedInvoice = await redReverseInvoice(originalInvoiceId, operatorId, operatorName, reason)
    
    if (!updatedInvoice) {
      return NextResponse.json({ error: '开票记录不存在' }, { status: 404 })
    }
    
    return NextResponse.json(updatedInvoice)
  } catch (error) {
    console.error('红冲处理失败:', error)
    return NextResponse.json({ error: '红冲失败' }, { status: 500 })
  }
} 