---
tags: [tmux]
title: Personal tmux cheat sheet
---

The default tmux `prefix` is <kbd>ctrl</kbd><kbd>b</kbd>. You can remap it to anything you prefer. For simplicity sake later on it will be referred as <kbd>prefix</kbd>

## Common

- <kbd>prefix</kbd> + <kbd>t</kbd> - display time in current pane
- <kbd>prefix</kbd> + <kbd>d</kbd> - detach from session
- <kbd>prefix</kbd> + <kbd>?</kbd> - list shortcuts
- <kbd>prefix</kbd> + <kbd>:</kbd> - enter command mode
- <kbd>prefix</kbd> + <kbd>[</kbd> - enter copy mode
- <kbd>prefix</kbd> + <kbd>]</kbd> - paste last copied
- <kbd>prefix</kbd> + <kbd>=</kbd> - choose a paste buffers from already copied

## Panes (splits)

- <kbd>prefix</kbd> + <kbd>q</kbd> - display name numbers
- <kbd>prefix</kbd> + <kbd>x</kbd> - kill pane
- <kbd>prefix</kbd> + <kbd>space</kbd> - toggle between pane layouts
- <kbd>prefix</kbd> + <kbd>alt</kbd><kbd>1-5</kbd> - use layout preset 1-5
- <kbd>prefix</kbd> + <kbd>z</kbd> - toggle pane to/from full screen mode
- <kbd>prefix</kbd> + <kbd>!</kbd> - break pane into its own window

## Windows (tabs)

- <kbd>prefix</kbd> + <kbd>,</kbd> - rename window
- <kbd>prefix</kbd> + <kbd>c</kbd> - create window
- <kbd>prefix</kbd> + <kbd>&</kbd> - kill window

## Awkward defaults

- <kbd>prefix</kbd> + <kbd>%</kbd> - vertical split
- <kbd>prefix</kbd> + <kbd>"</kbd> - horizontal split
