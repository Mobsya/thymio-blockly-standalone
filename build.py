#!/usr/bin/python
import os, sys
from distutils.dir_util import copy_tree
import contextlib
import shutil
from shutil import copyfile
import tempfile
import glob
from subprocess import call
import zipfile
import argparse

DIR = os.path.dirname(sys.argv[0])
CWD = os.getcwd()

LANGS = ["de", "it", "es", "en", "fr"]

@contextlib.contextmanager
def pushd(new_dir):
    previous_dir = os.getcwd()
    os.chdir(new_dir)
    yield
    os.chdir(previous_dir)

from bs4 import BeautifulSoup
import sys
import re
from sets import Set

FILE_MAPPING = {
	r"^\.\./blockly/blocks/.+\.js"     : "js/blocks_compressed.js",
	r"^\.\./blockly/generators/([a-z]+)(?:/.+)?\.js" : r"js/\1_compressed.js",
	r"^\.\./blockly/overrides/.+\.js"  : "js/overrides_compressed.js",
	r"^\.\./blockly/blockly_uncompressed\.js" : "js/blockly_compressed.js",
	r"^\.\./blockly/msg/js/([a-z]{2}).js" : r"js/i18n/\1.js",
	r"^\.\./blockly/msg/messages.js" : r"js/i18n/en.js"
}

def replace_node_path(dom):
	found = Set()
	lst = dom.find_all("script", src=re.compile(r"^\.\./blockly"))
	for node in lst:
		for pattern, replacement in FILE_MAPPING.iteritems():
			pattern = re.compile(pattern)
			node_path = node.get("src")
			found.add(node_path)
			if re.match(pattern, node_path):
				#print(node.get(node_path), replacement)
				res = re.sub(pattern, replacement, node_path)
				if res in found:
					node.decompose()
				else:
					node["src"] = res
					found.add(res)
				break


def fix_paths_in_file(file):
	with open(file, "r") as handle:
		dom = BeautifulSoup(handle, "lxml")
		replace_node_path(dom)
		html = ''.join([line.strip() for line in unicode(dom).split('\n')])
		with open(file, "w") as handle:
			handle.write(html.encode('UTF-8'))

def mkdir_p(path):
    try:
        os.makedirs(path)
    except OSError as exc:  # Python >2.5
        pass

def remove_temp_dir(dir):
	shutil.rmtree(dir)

if __name__ == '__main__':
	parser = argparse.ArgumentParser(description = "Package Blockly")
	parser.add_argument("--dir", help = "Target directory", default = CWD)
	parser.add_argument("--zip", help = "Target zip", required = False)

	options = parser.parse_args()

	dest = options.dir
	mkdir_p(dest)
	dirpath = tempfile.mkdtemp()
	import atexit
	atexit.register(remove_temp_dir, dirpath)

	for name in ["blockly", "closure-library", "thymio_blockly", "index.html", "media"]:
		node = os.path.join(DIR, name)
		if os.path.isfile(node):
			shutil.copy(node, dirpath)
		else:
			copy_tree(node, os.path.join(dirpath, name))
	with pushd(dirpath):
		with pushd("blockly"):
			print("Compiling blockly...")
			call([sys.executable, "build.py"])

		with pushd("thymio_blockly"):

			for file in glob.glob('thymio_blockly.*.html'):
				print("Fixing javascript paths in {}".format(file))
				fix_paths_in_file(file)

			for prefix in ["blockly", "blocks", "overrides", "aesl"]:
				print("Installing blockly library: {}".format(prefix))
				shutil.copy(os.path.join("..", "blockly", prefix+"_compressed.js"), "js/")

			mkdir_p(os.path.join("js", "i18n"))
			for lang in LANGS:
				print("Installing translation: {}".format(lang))
				shutil.copy(os.path.join("..", "blockly", "msg", "js", lang +".js"), os.path.join("js", "i18n"))

		os.rename("thymio_blockly", "data")
		mkdir_p("thymio-blockly-standalone")
		shutil.move(os.path.join("blockly", "media"), "thymio-blockly-standalone")

		for file in glob.glob('media/*'):
			shutil.copy(file, os.path.join("thymio-blockly-standalone", "media"))

		shutil.move("index.html", "thymio-blockly-standalone")
		shutil.move("data", "thymio-blockly-standalone")

	if options.zip:
		base_name, ext = os.path.splitext(options.zip)
		shutil.make_archive(base_name, ext[1:], dirpath, "thymio-blockly-standalone")
	else:
		target = os.path.join(dest, "thymio-blockly-standalone")
		if os.path.isdir(target):
			shutil.rmtree(target)
		shutil.move(os.path.join(dirpath, "thymio-blockly-standalone"), target)
