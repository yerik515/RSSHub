import { Route } from '@/types';
import { load } from 'cheerio';
import ofetch from '@/utils/ofetch';

export const route: Route = {
    path: '/projects',
    name: '首码项目列表',
    example: '/e318/projects',
    parameters: {},
    handler,
};

async function handler() {
    const url = 'https://www.e318.com/';

    try {
        const response = await ofetch(url);
        const $ = load(response);

        // 分析页面结构，找到项目列表
        const possibleSelectors = ['article', '.post', '.item', '.project', 'li', '.list-item', '[class*="project"]', '[class*="item"]'];

        const items: any[] = [];

        // 尝试不同的选择器
        for (const selector of possibleSelectors) {
            const elements = $(selector);
            if (elements.length > 0) {
                elements.each((index, element) => {
                    const $el = $(element);
                    const title = $el.find('a').first().text().trim() || $el.text().trim();
                    const link = $el.find('a').first().attr('href');

                    if (title && title.length > 10 && index < 15) {
                        items.push({
                            title,
                            link: link ? (link.startsWith('http') ? link : `https://www.e318.com${link}`) : url,
                            description: title,
                            pubDate: new Date().toUTCString(),
                            guid: `e318-${index}-${Date.now()}`,
                        });
                    }
                });

                if (items.length > 0) {break;}
            }
        }

        // 如果还没找到，尝试更通用的方法
        if (items.length === 0) {
            $('a').each((index, element) => {
                const $el = $(element);
                const title = $el.text().trim();
                const link = $el.attr('href');

                if (title && title.length > 20 && title.includes('项目') && index < 20) {
                    items.push({
                        title,
                        link: link ? (link.startsWith('http') ? link : `https://www.e318.com${link}`) : url,
                        description: title,
                        pubDate: new Date().toUTCString(),
                        guid: `e318-generic-${index}-${Date.now()}`,
                    });
                }
            });
        }

        return {
            title: '首码项目网 - 项目列表',
            link: url,
            description: '最新首码项目资讯',
            item: items.slice(0, 20), // 限制最多20个项目
        };
    } catch (error) {
        return {
            title: '首码项目网 - 项目列表',
            link: url,
            description: '抓取失败',
            item: [
                {
                    title: '抓取失败',
                    link: url,
                    description: `错误信息: ${error}`,
                    pubDate: new Date().toUTCString(),
                    guid: `error-${Date.now()}`,
                },
            ],
        };
    }
}
