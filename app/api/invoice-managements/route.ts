import { NextResponse } from 'next/server'
import { 
  getInvoiceManagements, 
  addInvoiceManagement,
  updateInvoiceManagement,
  getInvoiceManagementsByContract,
  validateInvoiceConditions,
  processPayment,
  redReverseInvoice,
  checkOverdueInvoices,
  generateWarningMessages
} from '@/lib/data'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const contractId = searchParams.get('contractId')
    const action = searchParams.get('action')
    
    if (action === 'warnings') {
      await checkOverdueInvoices()
      const warnings = await generateWarningMessages()
      return NextResponse.json({ warnings })
    }
    
    if (contractId) {
      const invoices = await getInvoiceManagementsByContract(contractId)
      return NextResponse.json(invoices)
    } else {
      const invoices = await getInvoiceManagements()
      return NextResponse.json(invoices)
    }
  } catch (error) {
    console.error('获取开票数据失败:', error)
    return NextResponse.json({ error: '获取数据失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { invoice, operatorId, operatorName } = body
    
    if (!invoice || !operatorId || !operatorName) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }
    
    // 验证开票条件
    const validation = await validateInvoiceConditions(invoice.contractId, invoice.invoiceAmount)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.message }, { status: 400 })
    }
    
    const newInvoice = await addInvoiceManagement(invoice, operatorId, operatorName)
    return NextResponse.json(newInvoice)
  } catch (error) {
    console.error('创建开票记录失败:', error)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, updates, operatorId, operatorName, comment } = body
    
    if (!id || !updates || !operatorId || !operatorName) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }
    
    const updatedInvoice = await updateInvoiceManagement(id, updates, operatorId, operatorName, comment)
    if (!updatedInvoice) {
      return NextResponse.json({ error: '开票记录不存在' }, { status: 404 })
    }
    
    return NextResponse.json(updatedInvoice)
  } catch (error) {
    console.error('更新开票记录失败:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
} 