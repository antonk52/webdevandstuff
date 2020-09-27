---
tags: [vim, performance, dx]
---

# Vim startup performance

Vim already has two built in tools to help figure out what is going on.

- `--startuptime` - a flag to pass to vim to write to a file which files were sourced and how long the execution took.
- `:scriptnames` a built in command to display sourced files during the session.

Both has great docs in vim.

## Startuptime flag

Usage

```sh
vim --startuptime vim.log ./file-to-open
```

After the bootup in `vim.log` you can see contents similar to

```
times in msec
 clock   self+sourced   self:  sourced script
 clock   elapsed:              other lines

000.017  000.017: --- VIM STARTING ---
000.184  000.167: Allocated generic buffers
001.067  000.883: locale set
001.075  000.008: clipboard setup
001.091  000.016: window checked
002.019  000.928: inits 1
002.423  000.404: parsing arguments
002.428  000.005: expanding arguments
009.137  006.709: shell init
009.545  000.408: Termcap init
009.565  000.020: inits 2
009.707  000.142: init highlight
011.114  000.740  000.740: sourcing /usr/local/share/vim/vim82/ftoff.vim
013.613  002.079  002.079: sourcing /Users/antonk52/.vim/autoload/plug.vim
031.452  000.016  000.016: sourcing /Users/antonk52/.vim/plugged/vim-fugitive/ftdetect/fugitive.vim
031.759  000.049  000.049: sourcing /Users/antonk52/.vim/plugged/ultisnips/ftdetect/snippets.vim
031.929  000.013  000.013: sourcing /Users/antonk52/.vim/plugged/vim-javascript/ftdetect/flow.vim
032.071  000.045  000.045: sourcing /Users/antonk52/.vim/plugged/vim-javascript/ftdetect/javascript.vim
032.223  000.028  000.028: sourcing /Users/antonk52/.vim/plugged/typescript-vim/ftdetect/typescript.vim
032.373  000.021  000.021: sourcing /Users/antonk52/.vim/plugged/yats.vim/ftdetect/typescript.vim
032.542  000.019  000.019: sourcing /Users/antonk52/.vim/plugged/yats.vim/ftdetect/typescriptreact.vim
032.858  000.113  000.113: sourcing /Users/antonk52/.vim/plugged/vim-jsx/ftdetect/javascript.vim
...
107.667  001.603  001.364: sourcing /Users/antonk52/.vim/plugged/vim-lightline-ocean/autoload/lightline/colorscheme/ocean.vim
112.084  015.106: BufEnter autocommands
112.088  000.004: editing files in windows
113.268  001.180: VimEnter autocommands
113.272  000.004: before starting main loop
114.115  000.843: first screen update
114.116  000.001: --- VIM STARTED ---
```

The first column is a timestamp from the very start.

The second is the time spent executing the specified file. Normally this number is under 50ms.

### Things to note

Most well written plugins load the core upon needing it aka lazyloading or autoloading in vim terms. Often this happens when dettecting an appropriate filetype, therefore depending on which file/directory you open when passing `--startuptime` flag the overall time may vary.

## Script names command

This commands lists all files that were sourced during the session. Due to some plugins autoloading their contents checking the list in the beggining of the session and some time after opening buffers with different filetypes, the list contents will differ.

## Practical usage

- if there are 50+ms files it makes sense to investigate or autoload/lazyload these plugins/settings.
- if it is an expensive plugin there might be lighter alternatives.

## My experience

I've been able to shave off just under 200ms of my bootup time by performing the steps below:

1. **Expensive plugins** - [Nerdtree plugin](https://github.com/preservim/nerdtree) was using over 50ms to load. Since I only used the shortcuts to add/copy/remove notes for nerdtree buffers. I was able to migrate to [dirvish](https://github.com/justinmk/vim-dirvish) for directory viewing and wrote a tiny [dirvish-fs plugin](https://github.com/antonk52/dirvish-fs.vim) to add nerdtree like shortcutes for fs manipulation. Sidenote: besides nerdtree being somewhat expensive on bootup it also is slow for large directories so ditching it was a win-win.
2. **Expensive vim settings** - I am terrible at grammar, `spelllang` drastically helps me with that. It sources dictionaries to specified langues and marks workd that were misspelled. However, sourcing two dictionaries during the bootup is suboptiomal. After moving this setting to a `CursorHold` autocommand the bootup dropped by another 60ms.
3. **Expensive plugin settings** - ie [CoC](https://github.com/neoclide/coc.nvim), I use for lsp stuff. Dynamically enabling coc plugins can also be exccessive for the start up time. Moved some of those to CursorHold autocommand is dropped another 70ms.

Overall the idea was to either avoid unnecessary work or delay it until the file content is shown on the screen.
