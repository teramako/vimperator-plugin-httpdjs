
HTTPD_JS_URL = http://mxr.mozilla.org/mozilla-central/source/netwerk/test/httpserver/httpd.js?raw=1

all: httpd.js pagedown

pagedown:
	@make -C markdown pagedown
	
httpd.js:
	@wget "$(HTTPD_JS_URL)" -O httpd.js


