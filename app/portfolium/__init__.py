from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_mail import Mail

from configparser import ConfigParser

from portfolium.mail import mail_settings

CONFIG = ConfigParser()
CONFIG.read('config.ini')

HOST = f"http://{CONFIG['FLASK']['external_ip']}/"

app = Flask(__name__)
app.config["SECRET_KEY"] = CONFIG["FLASK"]["secret_key"]


app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://{0}:{1}@{2}/{3}'.format(
	CONFIG["DATABASE"]['user'],
	CONFIG["DATABASE"]['password'],
	CONFIG["DATABASE"]['host'],
	CONFIG["DATABASE"]['database']
)

app.config.update({
    "MAIL_SERVER"	: CONFIG["MAIL"]["server"],
    "MAIL_PORT"		: CONFIG["MAIL"]["port"],
    "MAIL_USE_TLS"	: False,
    "MAIL_USE_SSL"	: True,
    "MAIL_USERNAME"	: CONFIG["MAIL"]["username"],
    "MAIL_PASSWORD"	: CONFIG["MAIL"]["password"]
})

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = "login"
login_manager.login_message = "Что бы пользоваться сервисом, сначала нужно авторизоваться."
login_manager.login_message_category = "info"
mail = Mail(app)

from portfolium import routes
from portfolium import template_filters
