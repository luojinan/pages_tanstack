import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";

const FORWARDED_HEADERS: Record<string, string> = {
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "accept-language":
    "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6,zh-TW;q=0.5",
  "cache-control": "max-age=0",
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
  "cookie": "__utmv=30149280.13939; _ga_PRH9EWN86K=GS1.2.1728643625.1.1.1728644240.0.0.0; _pk_id.100001.8cb4=db426eaa91bd7475.1730879580.; viewed=\"1803504_36707112_10605850_35371802_35088135_20513012_30177173_26286208_36085236_20255588\"; _ga_393BJ2KFRB=GS2.2.s1749374891$o5$g0$t1749374891$j60$l0$h0; _ga=GA1.2.50130870.1706506087; _ga_Y4GN1R87RG=GS2.1.s1749374883$o20$g1$t1749374896$j47$l0$h0; __utmz=30149280.1750670781.263.20.utmcsr=search.douban.com|utmccn=(referral)|utmcmd=referral|utmcct=/movie/subject_search; _vwo_uuid_v2=D1D659FECBD87B9E0ECAF728C2682200B|4faa9cf66cf7da608161b3345b826f6d; __utma=30149280.50130870.1706506087.1750677357.1750749996.265; bid=OivhCX9I8hc; dbsawcv1=MTc2MTgyNjk1MEA5YzkwZWJmM2IyZjNhMzZmYmI0ODNkMGNjOWQyMmUyMWZkY2IyMWIyZjhkOGNjNmYzNjg0MjM0ODYyMGM1ZjE2QDE3M2E2YTZhYTAxNzhkODNAODEyMzNlZDgzZDU2; _pk_ref.100001.8cb4=%5B%22%22%2C%22%22%2C1761826652%2C%22https%3A%2F%2Fsec.douban.com%2F%22%5D; _pk_ses.100001.8cb4=1; ap_v=0,6.0; dbcl2=\"139395353:KJ2sY7pMKrQ\"; ck=3wQR; push_noty_num=0; push_doumail_num=0"
};

/**
 * 根据完整HTML页面获取评论数据
 * @param html - 完整的HTML内容
 * @param sourceUrl - 源URL（可选）
 * @returns 评论列表数据
 */
export async function getCommentsData(id: string) {
  // 从cookie中提取bid
  const bidMatch = FORWARDED_HEADERS.cookie.match(/bid=([^;]+)/)
  const bid = bidMatch ? bidMatch[1] : 'OivhCX9I8hc'

  // 生成 _i 参数：时间戳 + bid的前7位
  const timestamp = Date.now().toString().slice(-7) // 取时间戳后7位
  const bidPrefix = bid.substring(0, 7) // 取bid前7位
  const _i = `${timestamp}${bidPrefix}`

  // 用cookie仍失败
  // const sourceUrl = `https://www.douban.com/group/topic/${id}/?_i=${_i}`
  // 403 异常ip
  const sourceUrl = `https://www.douban.com/doubanapp/dispatch?uri=/group/topic/${id}`


  console.log('sourceUrl', sourceUrl)
  const commentResponse = await fetch(sourceUrl, {
    method: "GET",
    headers: FORWARDED_HEADERS,
  });

  if (!commentResponse.ok) {
    console.log('commentResponse', commentResponse)
    throw new Error(
      `Failed to fetch source. Status: ${commentResponse.status} ${commentResponse.statusText}`,
    );  
  }
  const cheerio = await import("cheerio");
  const commentHtml = await commentResponse.text();
  const commentCheerio = cheerio.load(commentHtml);
  const commentsElement = commentCheerio("ul#comments");

  let commentsList: any[] = [];

  if (commentsElement.length > 0) {
    const liElements = commentsElement.find("li").toArray();
    commentsList = liElements.map((li, index) => {
      const $li = commentCheerio(li);

      $li.find("script,style").remove();

      const links = $li.find("a").toArray().map((a) => {
        const $a = commentCheerio(a);
        return {
          href: $a.attr("href") || "",
          text: $a.text().trim(),
        };
      });

      const images = $li.find("img").toArray().map((img) => {
        const $img = commentCheerio(img);
        return {
          src: $img.attr("src") || "",
          alt: $img.attr("alt") || "",
        };
      });

      const cloneLi = $li.clone();
      cloneLi.find("a").remove();
      const textContent = cloneLi.text().trim();

      return {
        id: index,
        textContent,
        links,
        images,
        innerHTML: $li.html()?.trim() || "",
      };
    });
  }

  return {
    sourceUrl,
    fetchedAt: new Date().toISOString(),
    commentsList,
    hasComments: commentsList.length > 0,
  };
}


export const Route = createFileRoute("/douban/api/comments")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const id = url.searchParams.get("id");
          console.log('id', id)

          if (!id) {
            return json({ error: "id is required" }, { status: 400 });
          }

          const payload = await getCommentsData(id);
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
      }
    },
  },
});
