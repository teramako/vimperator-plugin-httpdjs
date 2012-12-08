" vim:foldmethod=marker:fen:
scriptencoding utf-8

" Saving 'cpoptions' {{{
let s:save_cpo = &cpo
set cpo&vim
" }}}


function! instant_markdown#load()
    " dummy function to load this script.
endfunction


let s:host = get(g:, 'instant_markdown_host', 'localhost')
let s:port = get(g:, 'instant_markdown_port', 8090)
let s:URL = 'http://'.s:host.':'.s:port.'/markdown'

function! s:update_markdown()
  if (b:last_number_of_changes == "" || b:last_number_of_changes != b:changedtick)
    let b:last_number_of_changes = b:changedtick
    let current_buffer = join(getbufline("%", 1, "$"), "\n")
    silent! exec "silent! !echo " . escape(shellescape(current_buffer), '%!#') . " | curl -X POST --data-urlencode 'file@-' " . s:URL . " &>/dev/null &"
  endif
endfunction
function! instant_markdown#open()
  augroup instant-markdown
    autocmd!
    autocmd CursorMoved,CursorMovedI,CursorHold,CursorHoldI <buffer> silent call s:update_markdown()
    autocmd BufWinLeave <buffer> silent call instant_markdown#close()
    autocmd BufWinEnter <buffer> silent call instant_markdown#open()
  augroup END

  let b:last_number_of_changes = ""
  call s:update_markdown()
endfunction
function! instant_markdown#close()
  augroup instant-markdown
    autocmd!
  augroup END

  silent! exec "silent! !curl -s -X DELETE " . s:URL . " &>/dev/null &"
endfunction


" Restore 'cpoptions' {{{
let &cpo = s:save_cpo
" }}}
