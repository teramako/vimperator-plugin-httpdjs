#httpd.js - Vimperator Plugin

Vimperator で Web サーバーを立てるよ！

#インストール

1. テキトウなところにgit cloneする。
2. make -C httpd all で httpd.js と pagedown を取得
3. Vimperator から `:source ~/リポジトリのディレクトリ/httpd.js` で読み込み
  - デフォルトでは自動でhttpdが開始される(httpd.js 内の `SERVER_CONFIG.autoStart` 参照)
  - ポートは8090(httpd.js 内の `SERVER_CONFIG.port` 参照)
  - デフォルトではループバックアドレスからのみの接続しか受け付けないので、リモートからも接続できるようにするには
    - `SERVER_CONFIG.loopbackOnly`を`false`に設定
    - `SERVER_CONFIG.hosts`に`localhost`や`127.0.0.1`以外のホスト名またはIPアドレスを設定
  - 停止は`:httpd stop`で。（逆に起動は`:httpd start`で）

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

また、[instant-markdown-vim] に vim 用のプラグインがあります。テキトウに`~/.vim/bundle`下にでも放り込んでください。

###example

    cat <<EOM | curl -X POST --data-urlencode file@-" http://localhost:8090/markdown
    #タイトル

      * abc
    EOM

    curl -X DELETE http://localhost:8090/markdown

##/html

`POST`メソッドで送られた`file`パラメータのデータを、`type`に沿ってHTMLにコンバートしてレンダリングする。
`path`パラメータにファイルのフルパスを添えると、`<base href="...">` が付加されて、相対パスが有効になる。

 * `type`: コンバートするタイプ
   * ex.) `plain`, `markdown`
 * `file`: 入力データ
 * `path`: ファイルのフルパス

###example

    cat <<EOM | curl -X POST --data-urlencode file=@- -d type=markdown --data-urlencode "path=$PWD" http://localhost:8090/html
    #タイトル

     * abc
    EOM

    curl -X DELETE --data-urlencode "path=$PWD" http://localhost:8090/html

Cygwin 時は`path`パラメータを `cygpath -wa` で変換する必要があるでしょう。

    echo "OK" | curl -X POST ... --data-urlencode "path=`cygpath -wa .`" http://localhost:8090/html

[mozhttpdjs]: http://mxr.mozilla.org/mozilla-central/source/netwerk/test/httpserver/httpd.js
[pagedown]: http://code.google.com/p/pagedown/
[instant-markdown-vim]: https://github.com/teramako/instant-markdown-vim

#参考URL

[HTTP サーバを立てる - Vimperator Advent Calendar 5日目 - Vimple Star Sprites - vimperatorグループ](http://vimperator.g.hatena.ne.jp/teramako/20121205/1354661511)
