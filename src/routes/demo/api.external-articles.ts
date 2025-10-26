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

  const { JSDOM } = await import("jsdom");
  const dom = new JSDOM(html);
  const articles = Array.from(
    dom.window.document.querySelectorAll("article"),
  ).map((article, index) => {
    const articleClone = article.cloneNode(true) as HTMLElement;
    articleClone.querySelectorAll("script,style").forEach((node) => {
      node.remove();
    });

    return {
      id: index,
      attributes: Object.fromEntries(
        Array.from(articleClone.attributes, (attr) => [attr.name, attr.value]),
      ),
      html: articleClone.innerHTML.trim(),
      textContent: articleClone.textContent?.trim() ?? "",
      childTags: Array.from(
        new Set(
          Array.from(articleClone.querySelectorAll("*"), (node) =>
            node.tagName.toLowerCase(),
          ),
        ),
      ),
    };
  });

  dom.window.close();

  return {
    sourceUrl,
    fetchedAt: new Date().toISOString(),
    articleCount: articles.length,
    articles,
  };
}

function resolveSourceUrl(request: Request) {
  const requestUrl = new URL(request.url);
  const candidateUrl = requestUrl.searchParams.get("url") ?? DEFAULT_SOURCE_URL;

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

export const Route = createFileRoute("/demo/api/external-articles")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const sourceUrl = resolveSourceUrl(request);
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
