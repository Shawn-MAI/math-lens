import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'

export function IntuitionText({ markdown }: { markdown: string }) {
  return (
    <div className="intuition">
      <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {markdown}
      </Markdown>
    </div>
  )
}
