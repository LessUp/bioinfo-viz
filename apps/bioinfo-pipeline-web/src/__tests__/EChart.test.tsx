import { render } from '@testing-library/react'
import EChart from '@/components/echarts/EChart'

// Basic smoke test to ensure EChart mounts without crashing in jsdom

describe('EChart', () => {
  it('renders container div', () => {
    const { container } = render(<EChart option={{}} />)
    const div = container.querySelector('div')
    expect(div).not.toBeNull()
  })
})
