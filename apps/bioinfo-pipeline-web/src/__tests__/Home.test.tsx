import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

describe('Home page', () => {
  it('renders pipeline previews and entry links', () => {
    render(<Home />)

    expect(screen.getByText('构建生物信息课程的互动演示与学习路径')).toBeInTheDocument()
    expect(screen.getByText('可视化流程目录')).toBeInTheDocument()

    expect(screen.getByRole('link', { name: '进入外显子流程演示' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '查看 RNA-Seq 模块' })).toBeInTheDocument()
  })
})
