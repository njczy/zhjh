// lib/docx-utils.ts
// 用于处理Word文档的工具函数

/**
 * 从docx文件中提取文本内容，保持格式和结构
 */
export const extractTextFromDocx = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer
        
        // 尝试使用JSZip解析docx文件（docx实际上是zip格式）
        if (typeof window !== 'undefined' && (window as any).JSZip) {
          const JSZip = (window as any).JSZip
          const zip = new JSZip()
          const contents = await zip.loadAsync(arrayBuffer)
          
          // 读取document.xml文件
          const documentXml = contents.files['word/document.xml']
          if (documentXml) {
            const xmlContent = await documentXml.async('string')
            
            // 更智能的XML解析，保持段落结构
            let textContent = xmlContent
              // 将段落标签替换为换行符
              .replace(/<w:p[^>]*>/g, '\n')
              .replace(/<\/w:p>/g, '')
              // 将表格行替换为换行符
              .replace(/<w:tr[^>]*>/g, '\n')
              .replace(/<\/w:tr>/g, '')
              // 将表格单元格内容用制表符分隔
              .replace(/<w:tc[^>]*>/g, '\t')
              .replace(/<\/w:tc>/g, '')
              // 处理换行标签
              .replace(/<w:br[^>]*\/?>/g, '\n')
              // 移除所有其他XML标签
              .replace(/<[^>]*>/g, '')
              // 处理多个连续空格和换行
              .replace(/[ \t]+/g, ' ')
              .replace(/\n+/g, '\n')
              // 移除行首行尾空格
              .split('\n')
              .map((line: string) => line.trim())
              .filter((line: string) => line.length > 0)
              .join('\n')
              .trim()
            
            if (textContent && textContent.length > 10) {
              resolve(textContent)
            } else {
              resolve(generateFallbackContent(file))
            }
          } else {
            resolve(generateFallbackContent(file))
          }
        } else {
          resolve(generateFallbackContent(file))
        }
      } catch (error) {
        console.error('解析docx文件失败:', error)
        resolve(generateFallbackContent(file))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    
    reader.readAsArrayBuffer(file)
  })
}

/**
 * 生成备用内容模板
 */
const generateFallbackContent = (file: File): string => {
  const fileName = file.name
  const fileSize = (file.size / 1024).toFixed(1)
  const uploadTime = new Date().toLocaleString('zh-CN')
  
  return `会议纪要

文档信息：
文件名：${fileName}
文件大小：${fileSize} KB
上传时间：${uploadTime}

会议基本信息：
会议时间：
会议地点：
主持人：
参会人员：

会议议题：
1. 
2. 
3. 

会议内容：


会议决议：


备注：
请手动输入或复制粘贴原Word文档中的会议纪要内容。`
}

/**
 * 生成docx格式的Blob对象
 */
export const generateDocxBlob = (content: string, title: string = '会议纪要'): Blob => {
  // 创建一个简单的XML结构用于Word文档
  const xmlContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:rPr>
          <w:b/>
          <w:sz w:val="32"/>
        </w:rPr>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="32"/>
        </w:rPr>
        <w:t>${title}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t></w:t>
      </w:r>
    </w:p>`

  // 将内容按行分割并转换为Word段落
  const lines = content.split('\n')
  const paragraphs = lines.map(line => `
    <w:p>
      <w:r>
        <w:t>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</w:t>
      </w:r>
    </w:p>`).join('')

  const fullXml = xmlContent + paragraphs + `
  </w:body>
</w:document>`

  // 为了生成真正的docx文件，我们需要创建完整的zip结构
  // 这里使用简化版本，生成一个包含内容的Word兼容文件
  const docxContent = `MIME-Version: 1.0
Content-Type: multipart/related; boundary="----=_NextPart_000_0000_01234567.89ABCDEF"

------=_NextPart_000_0000_01234567.89ABCDEF
Content-Location: document.xml
Content-Transfer-Encoding: 8bit
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml

${fullXml}

------=_NextPart_000_0000_01234567.89ABCDEF--`

  return new Blob([docxContent], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  })
}

/**
 * 下载文件
 */
export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * 验证文件类型
 */
export const validateDocxFile = (file: File): { valid: boolean; message: string } => {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ]
  
  const validExtensions = ['.docx', '.doc']
  
  const hasValidType = validTypes.includes(file.type)
  const hasValidExtension = validExtensions.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  )
  
  if (!hasValidType && !hasValidExtension) {
    return {
      valid: false,
      message: '请上传Word文档文件（.docx 或 .doc 格式）'
    }
  }
  
  // 检查文件大小（限制为10MB）
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      message: '文件大小不能超过10MB'
    }
  }
  
  return {
    valid: true,
    message: '文件格式正确'
  }
}

/**
 * 生成批复报告Word文档
 */
export const generateApprovalReportDocx = (
  templateType: "adjustment2024" | "newProject2024" | "preArrange2025" | "adjustmentApproval2024" | "newProjectApproval2024" | "preArrangeApproval2025",
  tableData: any[],
  selectedProjects: any[],
  currentUser?: any
): Blob => {
  const currentYear = new Date().getFullYear()
  
  // 根据模板类型确定标题和附表编号
  const getTemplateInfo = (type: string) => {
    const nextYear = currentYear + 1
    
    switch (type) {
      case "adjustment2024":
        return {
          title: `电试院${currentYear}年已下达项目调整评审意见汇总表`,
          attachmentNo: "附表 2-1",
          note: "已下达综合计划项目调整填写该表"
        }
      case "newProject2024":
        return {
          title: `电试院${currentYear}年新增项目评审意见汇总表`,
          attachmentNo: "附表 2-2",
          note: `${currentYear}年新增项目（实施年份起始时间为${currentYear}年）填写该表`
        }
      case "preArrange2025":
        return {
          title: `电试院${nextYear}年预安排项目评审意见汇总表`,
          attachmentNo: "附表 2-3",
          note: `${nextYear}年预安排项目（实施年份为${nextYear}年）填写该表`
        }
      case "adjustmentApproval2024":
        return {
          title: `电试院${currentYear}年已下达项目调整批复表`,
          attachmentNo: "附表 3-1",
          note: "表中金额均为含税值；2.资金属性填写资本性或成本性"
        }
      case "newProjectApproval2024":
        return {
          title: `电试院${currentYear}年新增项目批复表`,
          attachmentNo: "附表 3-2",
          note: "表中金额均为含税值；2.资金属性填写资本性或成本性"
        }
      case "preArrangeApproval2025":
        return {
          title: `电试院${nextYear}年预安排项目批复表`,
          attachmentNo: "附表 3-3",
          note: "表中金额均为含税值；2.资金属性填写资本性或成本性"
        }
      default:
        return {
          title: `电试院${currentYear}年项目评审表`,
          attachmentNo: "附表",
          note: "请填写相关信息"
        }
    }
  }
  
  const templateInfo = getTemplateInfo(templateType)
  const department = currentUser?.department || currentUser?.center || "XXXXX部"
  
  // 根据模板类型生成表格头部
  const getTableHeaders = (type: string) => {
    switch (type) {
      case "adjustment2024":
        return [
          "序号", "项目类型", "项目责任部门", "项目负责人", "项目名称",
          "计划总收入(万元)", "调整后总收入(万元)", "实施年份", "当年计划收入(万元)", "调整后当年收入(万元)", 
          "调整详情", "调整原因", "评审意见", "评审结论"
        ]
      case "newProject2024":
        return [
          "序号", "项目类型", "项目责任部门", "项目负责人", "项目名称",
          "收入计划(万元)", "支出计划(万元)", "实施年份", "必要性", "可行性",
          "立项依据", "项目实施方案", "评审意见", "评审结论"
        ]
      case "preArrange2025":
        return [
          "序号", "项目类型", "项目责任部门", "项目负责人", "项目名称",
          "收入计划(万元)", "支出计划(万元)", "实施年份", "必要性", "可行性",
          "立项依据", "项目实施方案", "评审意见", "评审结论"
        ]
      case "adjustmentApproval2024":
        return [
          "序号", "项目类型", "项目责任部门", "项目负责人", "项目名称",
          "收入(万元)", "支出(万元)", "计划总收入(万元)", "调整后总收入(万元)", "当年计划收入(万元)", "调整后当年收入(万元)",
          "资金属性", "实施年份", "调整详情", "调整原因"
        ]
      case "newProjectApproval2024":
        return [
          "序号", "项目类型", "项目责任部门", "项目负责人", "项目名称",
          "收入计划(万元)", "支出计划(万元)", "实施年份", "必要性", "可行性",
          "立项依据", "项目实施方案"
        ]
      case "preArrangeApproval2025":
        return [
          "序号", "项目类型", "项目责任部门", "项目负责人", "项目名称",
          "收入计划(万元)", "支出计划(万元)", "实施年份", "必要性", "可行性",
          "立项依据", "项目实施方案"
        ]
      default:
        return ["序号", "项目名称", "项目负责人", "评审结论"]
    }
  }
  
  const tableHeaders = getTableHeaders(templateType)
  
  // 生成表格行数据
  const tableRows = selectedProjects.map((project, index) => {
    const data = tableData.find(d => d.projectId === project.id) || {}
    
    switch (templateType) {
      case "adjustment2024":
        return [
          (index + 1).toString(),
          data.projectType || "",
          data.responsibleDept || "",
          data.projectManager || "",
          project.projectName || "",
          data.plannedTotalIncome || "",
          data.adjustedTotalIncome || "",
          data.implementationYear || "",
          data.currentYearPlannedIncome || "",
          data.adjustedCurrentYearIncome || "",
          data.projectDetails || "",
          data.projectDetails || "",
          project.comments || "",
          "通过"
        ]
      case "newProject2024":
      case "preArrange2025":
        return [
          (index + 1).toString(),
          data.projectType || "",
          data.responsibleDept || "",
          data.projectManager || "",
          project.projectName || "",
          data.incomePlan || "",
          data.expensePlan || "",
          data.implementationYear || "",
          data.necessity || "",
          data.feasibility || "",
          data.projectBasis || "",
          data.implementationPlan || "",
          project.comments || "",
          "通过"
        ]
      case "adjustmentApproval2024":
        return [
          (index + 1).toString(),
          data.projectType || "",
          data.responsibleDept || "",
          data.projectManager || "",
          project.projectName || "",
          data.income || "",
          data.expense || "",
          data.plannedTotalIncome || "",
          data.adjustedTotalIncome || "",
          data.currentYearPlannedIncome || "",
          data.adjustedCurrentYearIncome || "",
          data.fundingType || "",
          data.implementationYear || "",
          data.projectDetails || "",
          data.projectDetails || ""
        ]
      case "newProjectApproval2024":
      case "preArrangeApproval2025":
        return [
          (index + 1).toString(),
          data.projectType || "",
          data.responsibleDept || "",
          data.projectManager || "",
          project.projectName || "",
          data.incomePlan || "",
          data.expensePlan || "",
          data.implementationYear || "",
          data.necessity || "",
          data.feasibility || "",
          data.projectBasis || "",
          data.implementationPlan || ""
        ]
      default:
        return [
          (index + 1).toString(),
          project.projectName || "",
          data.projectManager || "",
          "通过"
        ]
    }
  })
  
  // 创建Word兼容的HTML文档
  const wordHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${templateInfo.title}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>90</w:Zoom>
          <w:DoNotPromptForConvert/>
          <w:DoNotShowInsertionsAndDeletions/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page {
          margin: 1in;
        }
        body {
          font-family: "宋体", SimSun, serif;
          font-size: 12pt;
          line-height: 1.2;
        }
        .header {
          text-align: left;
          font-size: 14pt;
          margin-bottom: 12pt;
        }
        .title {
          text-align: center;
          font-size: 16pt;
          font-weight: bold;
          margin: 24pt 0;
        }
        .department {
          text-align: left;
          font-size: 12pt;
          margin-bottom: 18pt;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          font-size: 9pt;
        }
        th, td {
          border: 1px solid black;
          padding: 4pt;
          vertical-align: middle;
        }
        th {
          background-color: #f0f0f0;
          text-align: center;
          font-weight: bold;
        }
        .center { text-align: center; }
        .left { text-align: left; }
        .notes {
          font-size: 10pt;
          margin-top: 18pt;
          line-height: 1.5;
        }
        .signature {
          margin-top: 30pt;
          font-size: 12pt;
        }
      </style>
    </head>
    <body>
      <div class="header">${templateInfo.attachmentNo}</div>
      
      <div class="title">${templateInfo.title}</div>
      
      <div class="department">归口管理部门: ${department}</div>
      
      <table>
        <thead>
          <tr>
            ${tableHeaders.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${tableRows.map(row => `
            <tr>
              ${row.map((cell, cellIndex) => `
                <td class="${cellIndex === 0 ? 'center' : 'left'}">${cell || ''}</td>
              `).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="notes">
        <p>注：1.${templateInfo.note}；</p>
        ${templateType.includes('Approval') ? '' : '<p>2.表中金额均为含税值；3.资金属性填写资本性或成本性；</p><p>4.评审意见应具体明确；5.评审结论分为通过、不通过、根据评审意见修订后通过三类。</p>'}
      </div>
      
      ${templateType.includes('Approval') ? `
        <div class="signature">
          <p>经办人：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;项目责任部门负责人：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;归口管理部门负责人：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;分管院领导：</p>
          <br/>
          <p style="color: #FFD700; font-weight: bold;">建议A3横向编制打印（本段标黄色字体打印时请删除）</p>
        </div>
      ` : ''}
    </body>
    </html>
  `
  
  // 创建Word文档Blob
  return new Blob([wordHtml], {
    type: 'application/msword'
  })
}