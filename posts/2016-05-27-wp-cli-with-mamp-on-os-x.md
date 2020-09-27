---
layout: post
title:  "WP-CLI with MAMP on OS X"
categories: dev
img: mamp
excerpt: WP-CLI with MAMP <code>error establishing connection to the database fix</code>
---

## wp-cli
You heard of WP-CLI and decided that it can really help you to speed up your development process, but once you install it on your mac and start performing cli tricks you keep bumping into <code>Error establishing a database connection</code>

The reason this happens is wp-cli is not making good friends with MAMP out of the box. Fortunately this is easy to fix. To do so cd into your home directory and add the following to your <code>.bashrc</code> file. If the file does not exists feel free to create one.

## This goes in .bashrc file

<pre># FIX PHP MAMP for WP-CLI
export PATH=/Applications/MAMP/bin/php/php5.6.10/bin:$PATH
export PATH=$PATH:/Applications/MAMP/Library/bin/</pre>
Please take note that you might want to change the php version depending on which you are currently using. Because the path indicates on the version you are running locally. You can check it in the terminal using <code>php -v</code> or in mamp preferences, PHP tab

<img class="aligncenter size-medium wp-image-39" src="http://localhost/wp-content/uploads/2016/05/Screen-Shot-2016-05-29-at-09.39.31.png" alt="mamp preferences" height="250" />

Finally you can start using the command line tool to its fullest potential.
