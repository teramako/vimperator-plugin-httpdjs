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


let s:host = get(g:, 'instant_markdown_host', 'localhost')
let s:port = get(g:, 'instant_markdown_port', 8090)
let s:URL = 'http://'.s:host.':'.s:port.'/markdown'

function! UpdateMarkdown()
  if (b:last_number_of_changes == "" || b:last_number_of_changes != b:changedtick)
    let b:last_number_of_changes = b:changedtick
    let current_buffer = join(getbufline("%", 1, "$"), "\n")
    silent! exec "silent! !echo " . escape(shellescape(current_buffer), '%!#') . " | curl -X POST --data-urlencode 'file@-' " . s:URL . " &>/dev/null &"
  endif
endfunction
function! OpenMarkdown()
  augroup instant-markdown
    autocmd!
    autocmd CursorMoved,CursorMovedI,CursorHold,CursorHoldI * silent call UpdateMarkdown()
    autocmd BufWinLeave * silent call CloseMarkdown()
    autocmd BufWinEnter * silent call OpenMarkdown()
  augroup END

  let b:last_number_of_changes = ""
  call UpdateMarkdown()
endfunction
function! CloseMarkdown()
  silent! exec "silent! !curl -s -X DELETE " . s:URL . " &>/dev/null &"
endfunction

" Only README.md is recognized by vim as type markdown. Do this to make ALL .md files markdown
" autocmd BufWinEnter *.{md,mkd,mkdn,mdown,mark*} silent setf markdown

command! -bar InstantMarkdownStart call OpenMarkdown()
command! -bar InstantMarkdownStop  call CloseMarkdown()


" Restore 'cpoptions' {{{
let &cpo = s:save_cpo
" }}}
