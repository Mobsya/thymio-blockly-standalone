Thymio Blockly Standalone
=========================


Usage
=====

To launch the Thymio/Blockly Web app, simply open index.html in your browser.

This applications requires the `Web Bridge` (aka `asebahttp`) to be launched separately.

Deployment
==========

1. Install the python package `BeautifulSoup` version 4 ( `pip install beautifulsoup4` )
2. Run the `build.sh` script on a linux machine. It will create a redistribuable zip file in
the current directory. You can provide a different path to the script aka `build.sh foo/bar.zip`.
Be aware that the script will make requests to closure-compiler.appspot.com:443 ( https ).

