import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";

const DEFAULT_SOURCE_URL = "https://new.xianbao.fun/douban-maizu/5312613.html";

const ALLOWED_HOSTS = new Set(["new.xianbao.fun"]);

const FORWARDED_HEADERS: Record<string, string> = {
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "accept-language":
    "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6,zh-TW;q=0.5",
  "cache-control": "no-cache",
  pragma: "no-cache",
  "sec-ch-ua":
    '"Microsoft Edge";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "same-origin",
  "sec-fetch-user": "?1",
  "upgrade-insecure-requests": "1",
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:141.0) Gecko/20100101 Firefox/141.0",
};

async function getArticlePayload(sourceUrl: string) {
  const response = await fetch(sourceUrl, {
    method: "GET",
    headers: FORWARDED_HEADERS,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch source. Status: ${response.status} ${response.statusText}`,
    );
  }

  const html = await response.text();

  const cheerio = await import("cheerio");
  const $ = cheerio.load(html);
  const articles = $("article")
    .toArray()
    .map((article, index) => {
      const $article = $(article);

      $article.find("script,style").remove();

      const attribs = $article.attr();
      const childTags = Array.from(
        new Set(
          $article
            .find("*")
            .toArray()
            .map((node) => $(node).prop("tagName").toLowerCase()),
        ),
      );

      return {
        id: index,
        attributes: attribs,
        html: $article.html()?.trim() || "",
        textContent: $article.text().trim(),
        childTags: childTags,
      };
    });

  let commentsList = null;

  const copyrightDiv = $("div.art-copyright");
  if (copyrightDiv.length > 0) {
    const commentLink = copyrightDiv.find("a").attr("href");
    if (commentLink) {
      try {
        const commentResponse = await fetch(commentLink, {
          method: "GET",
          headers: FORWARDED_HEADERS,
        });
        if (commentResponse.ok) {
          const commentHtml = await commentResponse.text();
          const commentCheerio = cheerio.load(commentHtml);
          const commentsElement = commentCheerio("ul#comments");
          if (commentsElement.length > 0) {
            commentsList = commentsElement.html()?.trim() || "";
          }
        }
      } catch (error) {
        console.error("Failed to fetch comments:", error);
      }
    }
  }

  return {
    sourceUrl,
    fetchedAt: new Date().toISOString(),
    articleCount: articles.length,
    articles,
    commentsList,
  };
}

function resolveSourceUrl(request: Request, id?: string) {
  const requestUrl = new URL(request.url);

  let candidateUrl: string;

  if (id) {
    candidateUrl = `https://new.xianbao.fun/douban-maizu/${id}.html`;
  } else {
    const urlParam = requestUrl.searchParams.get("url");
    candidateUrl = urlParam ?? DEFAULT_SOURCE_URL;
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(candidateUrl);
  } catch {
    throw new Error("Invalid url parameter. Expecting an absolute URL.");
  }

  if (!ALLOWED_HOSTS.has(parsedUrl.host)) {
    throw new Error("The requested host is not allowed.");
  }

  return parsedUrl.toString();
}

/**
 * 根据ID获取详情数据（可复用的服务端函数）
 * @param id - 文章ID
 * @returns 文章详情数据
 */
export async function getDetailData(id: string) {
  const sourceUrl = `https://new.xianbao.fun/douban-maizu/${id}.html`;
  
  // 验证URL格式和允许的主机
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(sourceUrl);
  } catch {
    throw new Error("Invalid url parameter. Expecting an absolute URL.");
  }

  if (!ALLOWED_HOSTS.has(parsedUrl.host)) {
    throw new Error("The requested host is not allowed.");
  }

  return await getArticlePayload(sourceUrl);
}

export const Route = createFileRoute("/douban/api/douban-detail")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const id = body?.data;
          const sourceUrl = resolveSourceUrl(request, id);
          const payload = await getArticlePayload(sourceUrl);
          return json(payload);
        } catch (error) {
          console.error(error);
          if (error instanceof Error) {
            const message = error.message;
            const isClientError =
              message.includes("not allowed") ||
              message.includes("Invalid url");
            return json(
              { error: message },
              { status: isClientError ? 400 : 500 },
            );
          }
          return json({ error: "Unexpected server error" }, { status: 500 });
        }
      },
    },
  },
});
