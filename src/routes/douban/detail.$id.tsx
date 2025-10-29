import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
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
      return post as ExternalArticlesResponse
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
  attributes: Record<string, string>;
  html: string;
  textContent: string;
  childTags: string[];
}

interface ExternalArticlesResponse {
  sourceUrl: string;
  fetchedAt: string;
  articleCount: number;
  articles: ExternalArticle[];
}

function RouteComponent() {
  const data = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-3 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 text-center text-gray-900">
          External Articles
        </h1>
        <div className="mb-4 p-3 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">
            <strong className="text-gray-900">Source:</strong> {data?.sourceUrl}
          </p>
          <p className="text-sm text-gray-600">
            <strong className="text-gray-900">Fetched:</strong> {data?.fetchedAt}
          </p>
          <p className="text-sm text-gray-600">
            <strong className="text-gray-900">Count:</strong> {data?.articleCount}
          </p>
        </div>

        {data?.articles.map((article) => (
          <div
            key={article.id}
            className="mb-6 p-6 bg-white border border-gray-200"
            dangerouslySetInnerHTML={{ __html: article.html }}
          />
        ))}
      </div>
    </div>
  );
}
