import { useQuery } from "@tanstack/react-query";
import { ClientOnly, createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Suspense } from "react";
import { getDetailData } from "./api.douban-detail";

export const Route = createFileRoute("/douban/detail/$id")({
  component: RouteComponent,
  loader: async ({ params: { id } }) =>
    fetchDetail({
      data: id,
    }),
});

const fetchDetail = createServerFn({ method: 'POST' })
  .inputValidator((id: string) => id)
  .handler(async ({ data }) => {
    try {
      console.info(`Fetching post with id ${data}...`)
      const post = await getDetailData(data)
      return post as DetailResponse
    } catch (error) {
      console.error('Failed to fetch detail:', error)
      if (error instanceof Error) {
        // 如果是404或其他错误，抛出notFound或错误
        if (error.message.includes('not found') || error.message.includes('404')) {
          throw notFound()
        }
        throw error
      }
      throw new Error('Failed to fetch post')
    }
  })


interface ExternalArticle {
  id: number;
  doubanID: string;
  html: string;
  textContent: string;
}

type DetailResponse = (ExternalArticle & { commentsList?: string | null }) | Record<string, never>;

function RouteComponent() {
  const data = Route.useLoaderData() as DetailResponse;

  function isArticle(x: unknown): x is ExternalArticle {
    return !!x && typeof (x as { html?: unknown }).html === 'string';
  }

  const hasArticle = isArticle(data) && data.html !== "";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-3 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 text-center text-gray-900">
          External Article
        </h1>

        {hasArticle ? (
          <div
            className="mb-6 p-6 bg-white border border-gray-200"
            // biome-ignore lint: trusted upstream content
            dangerouslySetInnerHTML={{ __html: (data as ExternalArticle).html }}
          />
        ) : (
          <div className="mb-6 p-6 bg-white border border-gray-200 text-gray-600">
            暂无内容
          </div>
        )}

        {('commentsList' in (data as object)) && (data as { commentsList?: string | null }).commentsList && (
          <div className="mb-6 p-6 bg-white border border-gray-200">
            <h2 className="text-lg font-bold mb-4 text-gray-900">评论</h2>
            {/* biome-ignore lint: trusted upstream content */}
            <div dangerouslySetInnerHTML={{ __html: (data as { commentsList?: string | null }).commentsList ?? '' }} />
          </div>
        )}
        <ClientOnly fallback={<DoubanCommentsSkeleton />}>
          <Suspense fallback={<DoubanCommentsSkeleton />}>
            <LazyDoubanComments id={data.doubanID} />
          </Suspense>
        </ClientOnly>
      </div>
    </div>
  );
}
function DoubanCommentsSkeleton() {
  return (
    <section aria-busy="true">
      <p>加载中...</p>
    </section>
  )
}

function LazyDoubanComments({ id }: { id: string }) {
  // 仅在浏览器端渲染时执行到这里；用 Query 客户端取数
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['doubanComments', id],
    queryFn: () => getCommentsById(id),
    enabled: !!id,
  })
  console.log('comments data', data)

  if (isLoading) return <DoubanCommentsSkeleton />
  if (isError) {
    return (
      <section>
        <p>加载失败：{(error as Error).message}</p>
      </section>
    )
  }

  return (
    <section>
      <h2>评论</h2>
      {
        data?.commentsList?.map((comment) => (
          <div key={comment.id}>
            {/* biome-ignore lint: trusted upstream content */}
            <div dangerouslySetInnerHTML={{ __html: comment.innerHTML ?? '' }} />
          </div>
        ))
      }
    </section>
  )
}

async function getCommentsById(id: string): Promise<{ commentsList: any[] }> {
  const response = await fetch(`/douban/api/comments?id=${id}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch comments: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}