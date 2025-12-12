import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LearningPathPlanner from '@/components/learning/LearningPathPlanner'

describe('LearningPathPlanner', () => {
  it('shows beginner path by default', () => {
    render(<LearningPathPlanner />)

    expect(screen.getByText('入门自学者')).toBeInTheDocument()
    expect(screen.getByText('阅读 NGS 流程讲义')).toBeInTheDocument()
  })

  it('can switch paths and toggle completion', async () => {
    const user = userEvent.setup()
    render(<LearningPathPlanner />)

    await user.click(screen.getByRole('button', { name: '研究生/科研人员' }))
    expect(screen.getByText('Bulk RNA-Seq 流程')).toBeInTheDocument()

    const toggleButton = screen.getByRole('button', { name: '标记为已完成' })
    await user.click(toggleButton)

    expect(screen.getByText(/1\s*\/\s*3\s*任务完成/)).toBeInTheDocument()
  })
})
