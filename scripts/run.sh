#!/bin/bash
pkill node
node --harmony --use_strict ../bin/app.js &
