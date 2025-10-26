import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/douban/detail')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/douban/detail"!</div>
}
