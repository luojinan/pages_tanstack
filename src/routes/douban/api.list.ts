import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";

const DEFAULT_SOURCE_URL = "https://new.xianbao.fun/category-douban-maizu/";

const ALLOWED_HOSTS = new Set(["new.xianbao.fun"]);

const FORWARDED_HEADERS: Record<string, string> = {
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "accept-language":
    "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6,zh-TW;q=0.5",
  "cache-control": "max-age=0",
  "sec-ch-ua":
    '"Microsoft Edge";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "none",
  "sec-fetch-user": "?1",
  "upgrade-insecure-requests": "1",
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:141.0) Gecko/20100101 Firefox/141.0",
};

async function getPostPayload(sourceUrl: string) {
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

  // Find all ul elements with class "new-post"
  let newPostElements = $("ul.new-post").toArray();

  // If no ul.new-post elements found, also try looking for potential parent containers
  // that might contain new post lists
  if (newPostElements.length === 0) {
    // Alternative selectors that might contain new posts in Douban context
    const alternativeSelectors = [
      ".new-posts ul",
      '[class*="new-post"] ul',
      'ul[class*="new"]',
    ];

    for (const selector of alternativeSelectors) {
      const elements = $(selector).toArray();
      if (elements.length > 0) {
        const processedElements = elements.filter(
          (ul) => $(ul).prop("tagName") === "UL",
        );
        if (processedElements.length > 0) {
          newPostElements = processedElements;
          break;
        }
      }
    }
  }

  const posts = newPostElements.map((ul, index) => {
    const $ul = $(ul);

    // Remove script and style tags if any
    $ul.find("script,style").remove();

    // Parse li elements from the ul
    const liElements = $ul.find("li").toArray();
    const items = liElements.map((li, liIndex) => {
      const $li = $(li);

      // Remove script and style tags from li if any
      $li.find("script,style").remove();

      // Extract all links from the li element
      const links = $li.find("a").toArray().map((a) => {
        const $a = $(a);
        return {
          href:
            $a.attr("href")?.replace("/douban-maizu", "/douban/detail") ||
            "",
          text: $a.text().trim(),
        };
      });

      // Extract all images from the li element
      const images = $li.find("img").toArray().map((img) => {
        const $img = $(img);
        return {
          src: $img.attr("src") || "",
          alt: $img.attr("alt") || "",
        };
      });

      // Extract text content without links
      const cloneLi = $li.clone();
      cloneLi.find("a").remove();
      const textContent = cloneLi.text().trim();

      const attribs = $li.attr();

      return {
        id: liIndex,
        attributes: attribs,
        textContent: textContent,
        links: links,
        images: images,
        innerHTML: $li.html()?.trim() || "",
      };
    });

    const attribs = $ul.attr();
    const childTags = Array.from(
      new Set(
        $ul
          .find("*")
          .toArray()
          .map((node) => $(node).prop("tagName").toLowerCase()),
      ),
    );

    return {
      id: index,
      attributes: attribs,
      items: items,
      textContent: $ul.text().trim(),
      childTags: childTags,
      tagName: $ul.prop("tagName").toLowerCase(),
    };
  });

  return {
    sourceUrl,
    fetchedAt: new Date().toISOString(),
    postCount: posts.length,
    posts,
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

/**
 * 获取列表数据（可复用的服务端函数）
 * @param sourceUrl - 可选的源URL，默认使用 DEFAULT_SOURCE_URL
 * @returns 文章列表数据
 */
export async function getListData(sourceUrl?: string) {
  const candidateUrl = sourceUrl ?? DEFAULT_SOURCE_URL;

  // 验证URL格式和允许的主机
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(candidateUrl);
  } catch {
    throw new Error("Invalid url parameter. Expecting an absolute URL.");
  }

  if (!ALLOWED_HOSTS.has(parsedUrl.host)) {
    throw new Error("The requested host is not allowed.");
  }

  return await getPostPayload(parsedUrl.toString());
}

export const Route = createFileRoute("/douban/api/list")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const sourceUrl = resolveSourceUrl(request);
          const payload = await getPostPayload(sourceUrl);
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
