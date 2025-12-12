import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import type { Run } from '../store/runStore'

export async function exportReportPDF(run: Run | null) {
  const doc = new jsPDF({ unit: 'px', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 24
  const title = run?.name || 'GATK Run'
  doc.setFontSize(16)
  doc.text(title, 24, y)
  y += 18
  doc.setFontSize(11)
  const status = run?.status || '-'
  const created = run?.createdAt ? new Date(run.createdAt).toLocaleString() : '-'
  doc.text(`状态: ${status}  创建时间: ${created}`, 24, y)
  y += 20
  const dagEl = document.getElementById('dag-container') as HTMLElement | null
  if (dagEl) {
    const url = await toPng(dagEl, { pixelRatio: 2, cacheBust: true })
    const imgProps = (doc as any).getImageProperties(url)
    const imgWidth = pageWidth - 48
    const imgHeight = imgProps.height * (imgWidth / imgProps.width)
    if (y + imgHeight > doc.internal.pageSize.getHeight() - 24) {
      doc.addPage()
      y = 24
    }
    doc.text('DAG', 24, y)
    y += 10
    doc.addImage(url, 'PNG', 24, y, imgWidth, imgHeight)
    y += imgHeight + 16
  }
  const tlEl = document.getElementById('timeline-container') as HTMLElement | null
  if (tlEl) {
    const url = await toPng(tlEl, { pixelRatio: 2, cacheBust: true })
    const imgProps = (doc as any).getImageProperties(url)
    const imgWidth = pageWidth - 48
    const imgHeight = imgProps.height * (imgWidth / imgProps.width)
    if (y + imgHeight > doc.internal.pageSize.getHeight() - 24) {
      doc.addPage()
      y = 24
    }
    doc.text('时间轴', 24, y)
    y += 10
    doc.addImage(url, 'PNG', 24, y, imgWidth, imgHeight)
    y += imgHeight + 16
  }
  doc.save(`${title || 'run'}-report.pdf`)
}
