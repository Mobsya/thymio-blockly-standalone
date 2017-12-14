#!/bin/bash
set -e
set -x

SRC_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BUILD_DIR="$PWD"

TEMP_DIR=$(mktemp -d)

function atexit {
  rm -rf "$TEMP_DIR"
}

trap atexit EXIT

cp -r "$SRC_DIR"/{blockly,closure-library,thymio_blockly,index.html,media} "$TEMP_DIR"

ARCHIVE="$BUILD_DIR/blockly.zip"

if [ ! -z "$1" ]
then
ARCHIVE=$(realpath "$1")
fi

if [ -f $ARCHIVE ]
then
	rm $ARCHIVE
fi

pushd "$TEMP_DIR"
	pushd "blockly"
		echo "Compiling blockly"
		python2 "./build.py"
	popd

	pushd "thymio_blockly"
		for file in thymio_blockly.*.html
		do
			echo "Fixing javascript paths in $file"
			python "$SRC_DIR/convert_script_path.py" "$file"
		done
		echo "Copying Javascript files"
		cp ../blockly/{blockly,blocks,overrides,aesl}_compressed.js "js"
		mkdir -p js/i18n
		mv ../blockly/msg/js/{de,it,es,en,fr}.js js/i18n
		echo "Copying Blockly translations"
	popd
	mv thymio_blockly data
	mkdir thymio-blockly-standalone
	mv blockly/media thymio-blockly-standalone
	mv media/* thymio-blockly-standalone/media

	mv index.html data thymio-blockly-standalone
	zip -r $ARCHIVE thymio-blockly-standalone
popd
