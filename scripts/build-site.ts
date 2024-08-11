import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import {marked} from 'marked';
import assert from 'assert';

const DIST_FOLDER = path.resolve(__dirname, '../dist');
const DIST_POSTS = path.resolve(__dirname, '../dist/post');
const DIST_WIKI = path.resolve(__dirname, '../dist/wiki');

const SRC_POSTS = path.resolve(__dirname, '../posts');
const SRC_WIKI = path.resolve(__dirname, '../wiki');

(async function main() {
    // clear the dist folder
    console.log('> clearing dist folder');
    await fs.promises.rmdir(DIST_FOLDER, { recursive: true });

    console.log('> creating dist folder');
    await fs.promises.mkdir(DIST_POSTS, { recursive: true });
    await fs.promises.mkdir(DIST_WIKI, { recursive: true });

    // read the posts folder
    console.log('> reading posts');
    const posts = await fs.promises.readdir(SRC_POSTS).then(x => x.sort());

    console.log('> creating posts');
    const postEntries = [];
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

    const wikiEntries = [];
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
        await fs.promises.writeFile(
            path.resolve(DIST_FOLDER, 'index.html'),
            surroundWithHtml(`
<h2>Posts</h2>
<ul>
    ${postEntries.map(post => `<li><a href="${post.href}">${post.title}</a></li>`).join('\n')}
</ul>
<h2>Wiki</h2>
<ul>
    ${wikiEntries.map(wiki => `<li><a href="${wiki.href}">${wiki.title}</a></li>`).join('\n')}
</ul>
`, {
                title: "Web dev and stuff",
                excerpt: "A collection of posts and wiki entries about web development and other stuff.",
            }),
        );
    }

    console.log('> done');
})()

type PostMeta = {
    title?: string;
    date?: string;
    excerpt?: string;
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
        ${content}
    </article>
</body>
</html>
`);
}
