Thymio Blockly Standalone
=========================


Usage
=====

To launch the Thymio/Blockly web app, open one on the html file in the `thymio_blockly`
directory.


This applications requires the `Web Bridge` (aka `asebahttp`) to be launched separately.

Deployment
==========

1. Install the python package `BeautifulSoup` version 4 ( `pip install beautifulsoup4` )
2. Run the `build.py` script.

`build.py --dir  <directory>` create a packageed version in the given directory
`build.py --zip  <archive>` create an archive containing the packaged version

Without argument, the script will create a package folder in the current directory.

Be aware that the script will make requests to closure-compiler.appspot.com:443 ( https ).
The packaged version can be launcher through the index.html file at the root of the extracted package.

