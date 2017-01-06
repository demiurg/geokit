#!/usr/bin/env python

import os, subprocess, sys

_cwd = os.path.realpath(os.path.dirname(os.path.abspath(__file__)))
activate_this = os.path.realpath(os.path.join(_cwd, './venv/bin/activate_this.py'))
execfile(activate_this, dict(__file__=activate_this))

manage = os.path.realpath(os.path.join(_cwd, './manage.py'))
p = subprocess.Popen([manage, 'rqworker'])

with open(os.path.join(_cwd, './pidfiles/' + sys.argv[1] + '.pid'), 'w') as pidfile:
    pidfile.write(str(p.pid))
