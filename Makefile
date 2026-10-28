# AdShield for Safari - Makefile

.PHONY: all build install clean open test-youtube

all: install

build:
	@./build_and_install.sh

install: build

open:
	@open -a "$$HOME/Applications/AdShield.app"

test-youtube:
	@open -a Safari "https://www.youtube.com"

clean:
	@rm -rf build
	@echo "Cleaned build directory."
