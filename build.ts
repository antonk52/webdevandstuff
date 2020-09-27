import * as fs from 'fs';
import * as path from 'path';
import fm from 'front-matter';

const PATHS = {
    wiki: path.resolve(__dirname, 'wiki'),
    readme: path.resolve(__dirname, 'README.md'),
};

const prefix = `\n## Tags:\n\n`;

type WikiFrontMatter = Partial<{
    tags: string[];
}>;

type Note = {
    tags: string[];
    title: string;
    filepath: string;
};

async function main() {
    const posts = await fs.promises.readdir(PATHS.wiki);

    const promises = posts.map(
        async (filepath: string): Promise<Note> => {
            const content = await fs.promises.readFile(
                path.join(PATHS.wiki, filepath),
            );
            const {attributes, body} = fm<WikiFrontMatter>(content.toString());
            const title =
                body.match(/#\s.*/m)?.[0].replace(/^#\s/, '') || filepath;

            return {
                filepath,
                tags: attributes.tags || [],
                title,
            };
        },
    );

    const notes = await Promise.all(promises);
    const tagMap = notes.reduce((acc, note) => {
        note.tags.forEach(tag => {
            if (tag in acc) {
                acc[tag].push(note);
            } else {
                acc[tag] = [note];
            }
        });
        return acc;
    }, {} as Record<string, Note[]>);

    const details = Object.keys(tagMap)
        .sort()
        .map(tagName => {
            const notes = tagMap[tagName];
            const list = notes
                .map(
                    note =>
                        `<li><a href="${path.join(
                            PATHS.wiki,
                            note.filepath,
                        )}">${note.title}</a></li>`,
                )
                .join('\n');

            return [
                `<details><summary>${tagName} (${notes.length})</summary>`,
                `<ul>`,
                list,
                `</ul>`,
                '</details>',
            ].join('\n');
        })
        .join('\n\n');

    const split = (
        await fs.promises.readFile(PATHS.readme).catch(() => '# Readme\n')
    )
        .toString()
        .split(prefix);

    const content = split[0] + prefix + details;

    fs.writeFileSync(PATHS.readme, content);
}

main();
