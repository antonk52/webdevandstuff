import * as fs from 'fs';
import * as cp from 'child_process';
import * as path from 'path';
import matter from 'gray-matter';
import {marked} from 'marked';
import assert from 'assert';

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
    html: string;
}

(async function main() {
    const IS_DEV = process.argv.includes('--dev');

    console.log('> creating dist folder');
    if (fs.existsSync(DIST_FOLDER)) {
        await fs.promises.mkdir(DIST_FOLDER, { recursive: true });
    }

    console.log('> creating dist folder');
    await fs.promises.mkdir(DIST_POSTS, { recursive: true });
    await fs.promises.mkdir(DIST_WIKI, { recursive: true });

    // read the posts folder
    console.log('> reading posts');
    const posts = await fs.promises.readdir(SRC_POSTS).then(x => x.sort());

    console.log('> creating posts');
    const postEntries: ItemEntry[] = [];
    for (const post of posts) {
        const postContent = await fs.promises.readFile(path.resolve(SRC_POSTS, post), 'utf-8');

        const parsed = matter(postContent);
        const html = await marked(parsed.content);

        assert.ok(parsed.data.title, `Post "${post}" is missing "title" fornt matter`);
        assert.ok(parsed.data.excerpt, `Post "${post}" is missing "exerpt" fornt matter`);

        await fs.promises.writeFile(
            path.resolve(DIST_POSTS, post.replace('.md', '.html')),
            surroundWithHtml(html, parsed.data),
        );
        postEntries.push({
            href: `/post/${post.replace('.md', '.html')}`,
            title: parsed.data.title,
            excerpt: parsed.data.excerpt,
            html,
        })
    };

    console.log('> reading wiki');
    const wikis = await fs.promises.readdir(SRC_WIKI).then(x => x.sort());
    console.log('> creating wiki');

    const wikiEntries: ItemEntry[] = [];
    for (const wiki of wikis) {
        const wikiContent = await fs.promises.readFile(path.resolve(SRC_WIKI, wiki), 'utf-8');

        const parsed = matter(wikiContent);
        const html = await marked(parsed.content);

        assert.ok(parsed.data.title, `Wiki "${wiki}" is missing "title" fornt matter`);
        // assert.ok(parsed.data.excerpt, `Wiki "${wiki}" is missing "exerpt" fornt matter`);

        await fs.promises.writeFile(
            path.resolve(DIST_WIKI, wiki.replace('.md', '.html')),
            surroundWithHtml(html, parsed.data),
        );

        wikiEntries.push({
            href: `/wiki/${wiki.replace('.md', '.html')}`,
            title: parsed.data.title,
            excerpt: parsed.data.excerpt,
            html,
        })
    }

    console.log('> creating home page index.html');
    {
        const content = [
            '<h2>Posts</h2>',
            '<ul>',
            ...printEntrys(postEntries, IS_DEV),
            '</ul>',
            '<h2>Wiki</h2>',
            '<ul>',
            ...printEntrys(wikiEntries, IS_DEV),
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
            ),
        );
    }

    console.log('> copying images');
    cp.execSync(`cp -a ${SRC_IMAGES} ${DIST_FOLDER}`);

    console.log('> done');
})()

function printEntrys(entries: ItemEntry[], isDev: boolean) {
    return entries
        .map(entry => `<li><a href="${isDev ? '' : '/webdevandstuff'}${entry.href}">${entry.title}</a></li>`);
}

function surroundWithHtml(content: string, data: PostMeta) {
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
            box-sizing: border-box;
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
    </style>
</head>

<body>
    <article class="markdown-body">
        <h1>${data.title ?? "no-title"}</h1>
        ${data.kind === 'home' ? `<p>${data.excerpt ?? 'no exerpt'}</p>` : ''}
        ${content}
    </article>
</body>
</html>
`);
}
