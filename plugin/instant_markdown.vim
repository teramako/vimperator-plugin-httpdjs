" vim:foldmethod=marker:fen:
"
" inspired from https://github.com/suan/vim-instant-markdown

scriptencoding utf-8
" Load Once {{{
if (exists('g:loaded_instant_markdown') && g:loaded_instant_markdown) || &cp
    finish
endif
let g:loaded_instant_markdown = 1
" }}}
" Saving 'cpoptions' {{{
let s:save_cpo = &cpo
set cpo&vim
" }}}

if !executable('curl')
    echohl ErrorMsg
    echomsg "instant-markdown-vim: please install 'curl' command in your PATH!"
    echohl None
    finish
endif


" Only README.md is recognized by vim as type markdown. Do this to make ALL .md files markdown
" autocmd BufWinEnter *.{md,mkd,mkdn,mdown,mark*} silent setf markdown

command! -bar InstantMarkdownStart call instant_markdown#open()
command! -bar InstantMarkdownStop  call instant_markdown#close()


" Restore 'cpoptions' {{{
let &cpo = s:save_cpo
" }}}
