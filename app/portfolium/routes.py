from flask import render_template, request, url_for, flash, redirect
from flask_login import login_user, current_user, logout_user, login_required
from flask_mail import Message

from time import time
import bcrypt
import secrets
import json

from portfolium import app, db, mail
from portfolium.forms import RegisterForm, LoginForm, ForgotPasswordForm, ResetPasswordForm, ChangePassword, ChangeLogin
from portfolium.models import User, Portfolio, ConfirmRequest, ResetPasswordRequest


@app.route("/")
@app.route("/portfolios")
@login_required
def index():
	preset = request.args.get("update")
	to_delete = request.args.get("to_delete")
	if to_delete:
		to_delete = json.loads(to_delete)
		to_delete_p = filter(lambda p:p.id in to_delete,current_user.portfolios)
		for portfolio in to_delete_p:
			db.session.delete(portfolio)
		db.session.commit()
	if preset:
		preset = json.loads(preset)
		for statement in preset:
			replaced_p = list(filter(lambda p:p.id == int(statement["dbnumber"]),current_user.portfolios))
			if replaced_p:
				replaced_p[0].number = int(statement["number"])
				replaced_p[0].name = statement["name"]
		db.session.commit()

	return render_template("portfolios.html")

@app.route("/portfolio/<int:id>")
@login_required
def portfolio(id):
	preset = request.args.get("portfolio")
	portfolio = Portfolio.query.filter_by(id=id).first()
	if preset:
		preset = json.loads(preset)
		portfolio.data_current = preset["currentPortfolio"]
		portfolio.data_optimized = preset["optimize"]
		portfolio.last_optimize = time()
		db.session.commit()
		return str(0)
	if portfolio in current_user.portfolios:
		return render_template("portfolio.html",portfolio=portfolio)
	else:
		return redirect(url_for("portfolios"))

@app.route("/new_portfolio")
@login_required
def new_portfolio():
	if len(current_user.portfolios) >= 10:
		return redirect(url_for("index"))
	preset = request.args.get("portfolio")
	if preset and (len(current_user.portfolios)<10):
		preset = json.loads(preset)
		number = len(current_user.portfolios)+1
		db.session.add(Portfolio(
            owner = current_user,
            name = preset["name"],
            number = number,
            data_current = preset["currentPortfolio"],
            data_optimized = preset["optimize"],
            optimize_timestamp = time()
        ))
		db.session.commit()
		return str(Portfolio.query.filter_by(owner_id=current_user.id,number=number).first().id)
	return render_template("nportfolio.html")

@app.route("/account",methods=["GET","POST"])
@login_required
def account():
	login_form = ChangeLogin()
	password_form = ChangePassword()
	form = request.args.get("f")	
	if form=="login" and login_form.validate_on_submit():
		current_user.username = login_form.username.data
		db.session.commit()
		flash(f'Ваш псевдоним успешно изменён на "{login_form.username.data}"',"success")
	elif form=="password" and password_form.validate_on_submit():
		if bcrypt.checkpw(password_form.old_password.data.encode(),current_user.password.encode()):
			current_user.password = bcrypt.hashpw(
		        password_form.new_password.data.encode(),
		        bcrypt.gensalt()
		    )
			db.session.commit()
			flash(f"Ваш пароль успешно изменён","success")
		else:
			flash(f"Вы ввели неверный пароль","success")
	return render_template("account.html",login_form=login_form,password_form=password_form)

@app.route("/register",methods=["GET","POST"])
def register():
	if current_user.is_authenticated:
		return redirect(url_for("index"))
	form = RegisterForm()
	if form.validate_on_submit():
		confirm_request = ConfirmRequest.query.filter_by(email=form.email.data).first()
		if confirm_request:
			confirm_request.username = form.username.data
			confirm_request.password = bcrypt.hashpw(
		        form.password.data.encode(),
		        bcrypt.gensalt()
		    ) 
			confirm_request.hash = secrets.token_hex(8)
		else:
			db.session.add(ConfirmRequest(
			    username = form.username.data,
			    email = form.email.data,
			    password =  bcrypt.hashpw(
			        form.password.data.encode(),
			        bcrypt.gensalt()
			    ),
			    hash = secrets.token_hex(8) 
			))
			confirm_request = ConfirmRequest.query.filter_by(email=form.email.data).first()
		msg = Message(
			sender=app.config.get("MAIL_USERNAME"),
			recipients=[form.email.data],
			subject="Portfolium",
			html=render_template("mail/confirm.html",data=confirm_request,url=request.url_root))
		mail.send(msg)
		db.session.commit()
		flash("Вам на почту отправлено письмо с ссылкой на подтверждение аккаунта","success")
		return(redirect(url_for("login")))
	return render_template("register.html",form=form)

@app.route("/confirm/<id>/<hash>")
def confirm(id,hash):
	confirm_request = ConfirmRequest.query.filter_by(id=id).first()
	if (confirm_request):
		if (confirm_request.hash == hash):
			db.session.add(User(
		        username = confirm_request.username,
		        email = confirm_request.email,
		        password =  confirm_request.password
		    ))
			db.session.delete(confirm_request)
			db.session.commit()
			flash("Ваш аакаунт подтверждён! Можете ввести данные и войти в сервис.","success")
		else:
			flash("Ссылка на подтверждение аккаунта либо устарела либо её не существует!","warning")
	else:
		flash("Вы использовали неверную ссылку для подтверждения аккаунта!","warning")
	return(redirect(url_for("login")))

@app.route("/login",methods=["GET","POST"])
def login():
	if current_user.is_authenticated:
		return redirect(url_for("index"))
	form = LoginForm()
	if form.validate_on_submit():
		user = User.query.filter_by(email=form.email.data).first()
		if user and bcrypt.checkpw(form.password.data.encode(),user.password.encode()):
			login_user(user, remember=form.remember.data)
			return redirect(url_for("index"))
		else:
			flash("Вы ввели неверные данные.","warning")
	return render_template("login.html",form=form)

@app.route("/logout")
def logout():
	logout_user()
	return redirect(url_for("login"))


@app.route("/forgot_password",methods=["GET","POST"])
def forgot_password():
	form = ForgotPasswordForm()
	if form.validate_on_submit():
		user = User.query.filter_by(email=form.email.data).first()
		reset_password_request = ResetPasswordRequest.query.filter_by(owner_id=user.id).first()
		if reset_password_request:
			reset_password_request.owner_id = user.id 
			reset_password_request.hash = secrets.token_hex(8)
		else:
			db.session.add(ResetPasswordRequest(
			    owner_id = user.id,
			    hash = secrets.token_hex(8) 
			))
			reset_password_request = ResetPasswordRequest.query.filter_by(owner_id=user.id).first()
		db.session.commit()
		msg = Message(
			sender=app.config.get("MAIL_USERNAME"),
			recipients=[form.email.data],
			subject="Portfolium",
			html=render_template("mail/reset_password.html",data=reset_password_request,url=request.url_root))
		mail.send(msg)
		flash(f"На почту ({form.email.data}) отправлено письмо с нужной ссылкой","success")
	return render_template("forgot-password.html",form=form)

@app.route("/new_password/<id>/<hash>",methods=["GET","POST"])
def new_password(id,hash):
	if current_user.is_authenticated:
		return redirect(url_for("index"))
	reset_password_request = ResetPasswordRequest.query.filter_by(owner_id=id,hash=hash).first()
	if reset_password_request:
		form = ResetPasswordForm()
		if form.validate_on_submit():
			user = User.query.filter_by(id=id).first().password = bcrypt.hashpw(
				form.password.data.encode(),
				bcrypt.gensalt()
			)
			db.session.commit()
			flash("Пароль успешно изменён","success")
			return redirect(url_for("login"))
		return render_template("new-password.html",form=form)
	else:
		return redirect(url_for("login"))

@app.errorhandler(404)
def page_not_found(e):
	return render_template("404.html"),404
