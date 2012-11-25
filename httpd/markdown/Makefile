
PAGEDOWN_REPO = https://code.google.com/p/pagedown/

all: update-pagedown

pagedown:
	@hg clone https://code.google.com/p/pagedown/ pagedown

update-pagedown: pagedown
	@cd pagedown && hg pull -u 

