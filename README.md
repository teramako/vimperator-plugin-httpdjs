#httpd.js - Vimperator Plugin

Vimperator で Web サーバーを立てるよ！

動作には [Mozillaのhttpd.js][mozhttpdjs] が必要です。
`make -C httpd httpd.js` をして下さい。

##/vimperator

`POST`で`q`パラメータに JavaScript または Vimperator コマンドを入れると、実行して結果を返す

 * `type`: 実行タイプ; `cmd` or `js`
    - `js`: JavaScript の実行
      * `ot`: 出力タイプ; `text` or `html`
         - `text`: return `text/plain`
         - `html`: return `text/html`
         - default: `text`
    - `cmd`: Vimperator コマンドの実行
    - default: `js`
 * `q`: 実行する文字列

###example

    curl -X POST -d 'q=liberator.open("http://example.com")' -d ot=text http://localhost:8090/vimperator
    curl -x POST -d 'q=tabopen http://example.com' -d type=cmd http://localhost:8090/vimperator

##/markdown

`POST`メソッドで`file`パラメータにデータを添えるとタブに Markdown を HTML 化してレンダリングするよ。

`DELETE`メソッドで開いているタブを閉じるよ。

動作には [PageDown][pagedown] が必要です。
`make -C httpd pagedown` をして下さい。(Marcurialリポジトリから取得します)

###example

    cat <<EOM | curl -X POST -F "file=@-" http://localhost:8090/markdown
    #タイトル

      * abc
    EOM

    curl -X DELETE http://localhost:8090/markdown

[mozhttpdjs]: http://mxr.mozilla.org/mozilla-central/source/netwerk/test/httpserver/httpd.js
[pagedown]: http://code.google.com/p/pagedown/

