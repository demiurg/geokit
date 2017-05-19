# Data Handler

GeoKit relies on an external data handler to perform all backend data functions.
This should be installed before installing GeoKit. Instructions for installation
of the data handler can be found here:
https://github.com/Applied-GeoSolutions/gips/blob/datahandler/INSTALL.md

# Set up the host system
On the host machine, edit the `/etc/hosts` file.
Replace <HOSTNAME> with your hostname, ex: testserver, and <TEST_SITE> with the name of the site you will create.

```
<CONTAINER_IP>	<HOSTNAME> geokit.<HOSTNAME> <TEST_SITE>.geokit.<HOSTNAME>
```

This step only needs to be taken if you do not use a registered domain name for your Geokit installation.
Now you can access your container and perform the rest of the install.

# Set up system

Run apt-get update

`sudo apt-get update`

Install python, python-pip, libpq-dev, python-dev, postgresql, 
postgresql-contrib, postig, postgis, redis, and nginx

```
sudo apt-get install -y python python-pip libpq-dev python-dev postgresql \
postgresql-contrib postgis postgresql-9.5-postgis-2.2 redis-server nginx virtualenv
```

Install uwsgi

`sudo pip install uwsgi`

Clone the GeoKit repositiory from GitHub

`git clone https://github.com/Applied-GeoSolutions/geokit.git`

# Create a virtual env in the project directory

`virtualenv venv`

# Install dependancies

`source venv/bin/actiavte`

`pip install -r requirements.txt`

# Postgresql

Create postgresql user geokit

`sudo runuser postgres -c 'createuser -s -P geokit'`
Make sure password matches in settings/base.py

Create postgresql databases geokits and geodata

`sudo runuser postgres -c 'createdb -O geokit geokits'`

`sudo runuser postgres -c 'createdb -O geokit geodata'`

Download and import template database data from 
http://oka.ags.io/geokit/database/geokit_database_latest.zip

Unzip them to the geokit directory

`unzip -d <path/to/geokit> geokit_database_latest.zip`

Import the files into your databases

`psql -U geokit geokits < geokits_deploy.pgsql -h localhost`

`psql -U geokit geodata < geodata.pgsql -h localhost`

# Django

Copy local settings file from example

`cp geokit/settings/local_example.py geokit/settings/local.py`

Configure hosts/session cookie domain in local.py,
make sure this matches your domain

```
GEOKIT_HOSTS.append('geokit.testserver') # django's hostname in testing mode
GEOKIT_HOSTS.append('.geokit.testserver')
ALLOWED_HOSTS.append('geokit.testserver')
ALLOWED_HOSTS.append('.geokit.testserver')

DATABASES['default']['TEST'] = {'NAME': 'test_geokit' }

## Make sure this address points to your data handler
RPC_URL = http://localhost:8001

## Ensure this is off in a production environment
DEBUG = True

## Make sure this matches your domain
SESSION_COOKIE_DOMAIN = '.geokit.testserver'
```

# Collect static files

```
source venv/bin/activate
./manage.py collectstatic -l
```

If it asks if you want to replace files, say yes. Make sure you run
this as the same user uWSGI will run as.

Change the admin password

`./manage.py changepassword admin`

# Web services

Start redis server

`sudo service redis start`

Ensure your nginx user has r/w access to project directory and static/media
`sudo chown <YOUR_USER>:www-data -R geokit`
`sudo chmod -R g+w geokit`

Create a configuration file for your site in /etc/nginx/sites-available/

```
server {
	listen 80;
	server_name geokit.testserver *.geokit.testserver;

	sendfile on;
	client_max_body_size 20M;
	keepalive_timeout 0;

	gzip on;
	gzip_proxied any;
	gzip_types
	        text/css
	        text/javascript
	        text/xml
	        text/plain
	        application/javascript
	        application/x-javascript
	        application/json;

        location = /favicon.ico { access_log off; log_not_found off; }
        location /static {
                alias /web/geokit/static;
                gzip_static on;
        }
        location /media {
                alias /web/geokit/media;
        }
        location / {
                include uwsgi_params;
                uwsgi_pass 127.0.0.1:9000;
                #uwsgi_pass unix:/run/uwsgi/app/tnt/socket;
       	}
}
```

Symlink the configuration file in
`etc/nginx/sites-available` to `/etc/nginx/sites-enabled`

Start nginx

`sudo service nginx start`

Create an ini file for your uwsgi app in `/etc/uwsgi/apps-available/`

```
[uwsgi]
uid = ubuntu

chdir = /web/geokit
virtualenv = /web/geokit/.venv
module = geokit.wsgi

master = true
pidfile = /run/uwsgi/geokit.pid
uwsgi-socket = 127.0.0.1:9000
logto = /var/log/uwsgi/geokit.log

cheaper-algo = spare
cheaper = 8
cheaper-initial = 8
workers = 32
cheaper-step = 1
```

Symlink the ini file in /etc/uwsgi/apps-available/ to /etc/uwsgi/apps-enabled/

Start uwsgi daemons

`uwsgi  --ini /etc/uwsgi/apps-enabled/geokit.ini --daemonize /var/log/uwsgi/app/geokit.log`

Restart nginx

`sudo service nginx restart`

Start RPC worker (from Geokit README):

Ensure that the VIRTUALENV variable in worker_daemon.py matches your virtualenv path

A template is provided for running works as systemd services. In order to use systemd, first
copy `geokit@.service.example` to `/etc/systemd/system/geokit@.service`. Then uncomment the lines
for `ExecStart` and `PIDFile` in the unit file, making sure to replace the paths with the absolute
path of your GeoKit installation. Create an empty `pidfiles/` directory in your GeoKit installation
directory. Finally, you can start and stop a worker using systemd:

```
systemctl start geokit@1.service
systemctl stop geokit@1.service
```

To start multiple workers at once, use a shell expansion:

```
systemctl start geokit@{1..5}.service
```

# Log in to website
The admin email address is "admin@geokit.localhost" and the password is
whatever was set with the `./manage.py changepassword` command

The email address can be changed by logging in and navigating to 'geokit.<yourdoman>/admin'
