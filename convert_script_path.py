#!/usr/bin/python

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
				print(node.get(node_path), replacement)
				res = re.sub(pattern, replacement, node_path)
				if res in found:
					node.decompose()
				else:
					node["src"] = res
					found.add(res)
				break


def main():
	try:
		file = sys.argv[1]
		with open(file, "r") as handle:
			dom = BeautifulSoup(handle, "lxml")
			replace_node_path(dom)
			html = ''.join([line.strip() for line in unicode(dom).split('\n')])
			with open(file, "w") as handle:
				handle.write(html.encode('UTF-8'))

		exit(0)
	except Exception as e:
		print(e)
		import traceback
		traceback.print_exc()
		exit(1)


if __name__ == "__main__":
    main()
