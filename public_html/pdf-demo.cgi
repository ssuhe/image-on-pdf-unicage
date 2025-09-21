#!/bin/bash
source ./SHELL/common

echo "Content-type:text/html"
echo
cat $appd/pdf-demo.html

rm -rf $tmp-*
exit 0
