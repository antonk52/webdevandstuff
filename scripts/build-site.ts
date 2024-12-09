import * as fs from 'fs';
import * as cp from 'child_process';
import * as path from 'path';
import matter from 'gray-matter';
import {marked, MarkedOptions, Token} from 'marked';
import {gfmHeadingId} from 'marked-gfm-heading-id';
import {slug} from 'github-slugger';
import assert from 'assert';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)

const DIST_FOLDER = path.resolve(__dirname, '../dist');
const DIST_POSTS = path.resolve(__dirname, '../dist/post');
const DIST_WIKI = path.resolve(__dirname, '../dist/wiki');

const SRC_POSTS = path.resolve(__dirname, '../posts');
const SRC_WIKI = path.resolve(__dirname, '../wiki');
const SRC_IMAGES = path.resolve(__dirname, '../images');

type PostMeta = {
    title?: string;
    date?: string;
    excerpt?: string;
    kind?: 'home' | string;
}

type ItemEntry = {
    href: string;
    title: string;
    excerpt: string;
    date: string;
    html: string;
}

// filepaths of posts that use codebloks with languages
const prismJsSet = new Set<string>();

// replace the heading content with a link to the heading id
const getMarkedOpts = (filepath: string): MarkedOptions => ({
    hooks: {
        options: {},
        preprocess: x => x,
        postprocess: x => x,
        processAllTokens(tokens) {
            return tokens.map(t => {
                switch (t.type) {
                    case 'code':
                        if (t.lang === 'ts') {
                            t.lang = 'typescript';
                        }
                        if (t.lang && ['javascript', 'typescript'].includes(t.lang)) prismJsSet.add(filepath)
                        return t;
                    case 'heading':
                        if (t.tokens?.length == 1 && t.tokens[0].type === 'text') {
                            const textToken = t.tokens[0];
                            const id = slug(t.text);
                            const newTokens: Token[] = [{
                                type: 'link',
                                raw: `<a href="#${id}">${t.text}</a>`,
                                href: `#${id}`,
                                text: t.text,
                                tokens: [textToken],
                            }];

                            return {
                                ...t,
                                tokens: newTokens,
                            }
                        }
                        return t;
                    default:
                        return t
                }
            });
        }
    }
});
// add heading id to the heading itself
marked.use(gfmHeadingId({}));

(async function main() {
    console.log('> creating dist folder');
    if (fs.existsSync(DIST_FOLDER)) {
        await fs.promises.mkdir(DIST_FOLDER, { recursive: true });
    }

    console.log('> creating dist folder');
    await fs.promises.mkdir(DIST_POSTS, { recursive: true });
    await fs.promises.mkdir(DIST_WIKI, { recursive: true });

    // read the posts folder
    console.log('> reading posts');
    const posts = await fs.promises.readdir(SRC_POSTS).then(x => x.sort().reverse());

    console.log('> creating posts');
    const postEntries: ItemEntry[] = [];
    for (const post of posts) {
        const filepath = path.resolve(SRC_POSTS, post);
        const postContent = await fs.promises.readFile(filepath, 'utf-8');

        const parsed = matter(postContent);
        const html = await marked(parsed.content, getMarkedOpts(filepath));

        assert.ok(parsed.data.title, `Post "${post}" is missing "title" fornt matter`);
        assert.ok(parsed.data.excerpt, `Post "${post}" is missing "exerpt" fornt matter`);
        let date = undefined;
        if (/^\d\d\d\d-\d\d-\d\d-/.test(post)) {
            date = post.slice(0, 10);
        }
        assert.ok(date, `Post "${post}" does not start from YYYY-MM-DD or is missing "date" front matter`);

        await fs.promises.writeFile(
            path.resolve(DIST_POSTS, post.replace('.md', '.html')),
            surroundWithHtml(html, parsed.data, filepath),
        );
        postEntries.push({
            href: `/post/${post.replace('.md', '.html')}`,
            title: parsed.data.title,
            date: date ?? parsed.data.date,
            excerpt: parsed.data.excerpt,
            html,
        })
    };

    console.log('> reading wiki');
    const wikis = await fs.promises.readdir(SRC_WIKI).then(x => x.sort());
    console.log('> creating wiki');

    const wikiEntries: ItemEntry[] = [];
    for (const wiki of wikis) {
        const filepath = path.resolve(SRC_WIKI, wiki);
        const wikiContent = await fs.promises.readFile(filepath, 'utf-8');

        const parsed = matter(wikiContent);
        const html = await marked(parsed.content, getMarkedOpts(filepath));

        assert.ok(parsed.data.title, `Wiki "${wiki}" is missing "title" front matter`);
        // assert.ok(parsed.data.excerpt, `Wiki "${wiki}" is missing "exerpt" front matter`);

        await fs.promises.writeFile(
            path.resolve(DIST_WIKI, wiki.replace('.md', '.html')),
            surroundWithHtml(html, parsed.data, filepath),
        );

        const date = cp.execSync(
            `git log --diff-filter=A --format="%ad" --date=format:"%Y-%m-%d" -- ${SRC_WIKI}/${wiki}`
        ).toString().trim();

        wikiEntries.push({
            href: `/wiki/${wiki.replace('.md', '.html')}`,
            title: parsed.data.title,
            excerpt: parsed.data.excerpt,
            html,
            date,
        })
    }

    console.log('> creating home page index.html');
    {
        const content = [
            '<h2>Posts</h2>',
            '<ul>',
            ...printEntrys(postEntries),
            '</ul>',
            '<h2>Wiki</h2>',
            '<ul>',
            ...printEntrys(wikiEntries),
            '</ul>',
        ].join('');
        await fs.promises.writeFile(
            path.resolve(DIST_FOLDER, 'index.html'),
            surroundWithHtml(
                content,
                {
                    title: "Web dev and stuff",
                    excerpt: "A collection of posts and wiki entries about web development and other stuff.",
                    kind: 'home',
                },
                'index.html',
            ),
        );
    }

    console.log('> copying images');
    cp.execSync(`cp -a ${SRC_IMAGES} ${DIST_FOLDER}`);

    console.log('> done');
})()

function printEntrys(entries: ItemEntry[]) {
    return entries
        .sort((a, b) => a.date < b.date ? 1 : -1)
        .map(entry => `<li><a href=".${entry.href}">${entry.title}</a>${entry.date ? ` - ${entry.date}` : ''}</li>`);
}

const primsJsAssets = `
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js"></script>
`.trim();

function surroundWithHtml(content: string, data: PostMeta, filepath: string) {
    return (
`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${data.title ?? "no-title"}</title>
    ${data.excerpt ? `<meta name="description" content="${data.excerpt}">` : ""}
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.6.1/github-markdown.min.css">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
            box-sizing: border-box;
            margin: 0;
        }

        .markdown-body {
            min-width: 200px;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
        }

        @media (prefers-color-scheme: dark) {
            body {
                background-color: #0d1117;
            }
        }
        @media (prefers-color-scheme: dark) {
            :root {
                --fgColor-default: #e6edf3;
            }
        }
        @media (prefers-color-scheme: light) {
            :root {
                --fgColor-default: #1f2328;
            }
        }

        header {
            display: flex;
            gap: 24px;
            border-bottom: 1px solid #e1e4e8;
            padding: 16px 24px;
        }
        header a {
            color: var(--fgColor-default);
        }
        .markdown-body h1 > a,
        .markdown-body h2 > a,
        .markdown-body h3 > a,
        .markdown-body h4 > a,
        .markdown-body h5 > a,
        .markdown-body h6 > a {
            color: var(--fgColor-default);
            text-decoration: none;
        }
    </style>
    ${prismJsSet.has(filepath) ? primsJsAssets : ''}
</head>

<body>
    <header>
        <a href="/webdevandstuff">Web dev and stuff</a>
        <a href="https://github.com/antonk52" target="_blank">GitHub</a>
        <a href="https://twitter.com/antonk52" target="_blank">Twitter</a>
    </header>

    <${data.kind === 'home' ? 'main' : 'article'} class="markdown-body">
        <h1>${data.title ?? "no-title"}</h1>
        ${data.kind === 'home' ? `<p>${data.excerpt ?? 'no exerpt'}</p>` : ''}
        ${content}
    </${data.kind === 'home' ? 'main' : 'article'}>
</body>
</html>
`);
}
