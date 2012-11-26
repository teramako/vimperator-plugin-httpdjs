" inspired from https://github.com/suan/vim-instant-markdown

let s:URL = 'http://localhost:8090/markdown'

function! UpdateMarkdown()
  if (b:last_number_of_changes == "" || b:last_number_of_changes != b:changedtick)
    let b:last_number_of_changes = b:changedtick
    let current_buffer = join(getbufline("%", 1, "$"), "\n")
    silent! exec "silent! !echo " . escape(shellescape(current_buffer), '%!#') . " | curl -X POST -F 'file=@-' " . s:URL . " &>/dev/null &"
  endif
endfunction
function! OpenMarkdown()
  let b:last_number_of_changes = ""
endfunction
function! CloseMarkdown()
  silent! exec "silent! !curl -s -X DELETE " . s:URL . " &>/dev/null &"
endfunction

" Only README.md is recognized by vim as type markdown. Do this to make ALL .md files markdown
autocmd BufWinEnter *.{md,mkd,mkdn,mdown,mark*} silent setf markdown

autocmd CursorMoved,CursorMovedI,CursorHold,CursorHoldI *.{md,mkd,mkdn,mdown,mark*} silent call UpdateMarkdown()
autocmd BufWinLeave *.{md,mkd,mkdn,mdown,mark*} silent call CloseMarkdown()
autocmd BufWinEnter *.{md,mkd,mkdn,mdown,mark*} silent call OpenMarkdown()

