from portfolium.models import User

from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, BooleanField
from wtforms.validators import DataRequired, Length, Email, EqualTo, ValidationError

def validate_email(exist=True):

	def validate_email(form,email):
		user = User.query.filter_by(email=email.data).first()
		message = False
		if not exist:
			if user:
				message = "Пользователь с данной электронной почтой уже авторизован на сервисе."
		else:
			if not user:
				message = "Пользователя с данной электронной почтой не существует на сервисе."
		if message:
			raise ValidationError(message)

	return validate_email

def password_check(form,passwd):
      
    if len(passwd.data) < 6:
        raise ValidationError('Необходима длина пароля 6 символов или более')
          
    if len(passwd.data) > 20:
        raise ValidationError('Длина пароля не должна превышать 20 символов')
          
    if not any(char.isdigit() for char in passwd.data):
        raise ValidationError('Пароль должен состоять из минимум одного числа')
          
class RegisterForm(FlaskForm):
	username 	= StringField("Псевдоним",validators=[DataRequired(),Length(min=2,max=20)],render_kw={"placeholder":"Псевдоним"})
	email 		= StringField("Почта",validators=[DataRequired(),Email(message="Невалидный адрес электронной почты."),validate_email(exist=False)],render_kw={"placeholder":"Почта"})
	password 	= PasswordField("Пароль",validators=[DataRequired(),password_check],render_kw={"placeholder":"Пароль"})
	confirm_password = PasswordField("Пароль ещё раз",validators=[DataRequired(),EqualTo("password",message="Пароли должны совпадать")],render_kw={"placeholder":"Пароль ещё раз"})
	submit 		= SubmitField("Зарегистрироваться")


class LoginForm(FlaskForm):
	email 		= StringField("Почта",validators=[DataRequired(),Email(message="Невалидный адрес электронной почты.")],render_kw={"placeholder":"Почта"})
	password 	= PasswordField("Пароль",validators=[DataRequired()],render_kw={"placeholder":"Пароль"})
	remember 	= BooleanField("Запомнить меня")
	submit 		= SubmitField("Войти")

class ForgotPasswordForm(FlaskForm):
	email 		= StringField("Почта",validators=[DataRequired(),Email(message="Невалидный адрес электронной почты."),validate_email()],render_kw={"placeholder":"Почта"})
	submit 		= SubmitField("Отправить")

class ResetPasswordForm(FlaskForm):
	password 	= PasswordField("Новый пароль",validators=[DataRequired(),password_check],render_kw={"placeholder":"Новый пароль"})
	confirm_password = PasswordField("Ещё раз",validators=[DataRequired(),EqualTo("password",message="Пароли должны совпадать")],render_kw={"placeholder":"Ещё раз"})
	submit 		= SubmitField("Сменить пароль")

class ChangeLogin(FlaskForm):
	username 	= StringField("Псевдоним",validators=[DataRequired(),Length(min=2,max=20)])
	submit 		= SubmitField("Сохранить данные")

class ChangePassword(FlaskForm):
	old_password = PasswordField("Старый пароль",validators=[DataRequired()],render_kw={"placeholder":"старый*"})
	new_password = PasswordField("Навый пароль",validators=[DataRequired(),password_check],render_kw={"placeholder":"новый*"})
	confirm_new_password = PasswordField("Новый пароль ещё раз",validators=[DataRequired(),EqualTo("new_password",message="Пароли должны совпадать")],render_kw={"placeholder":"новый ещё раз*"})
	submit 		= SubmitField("Сменить пароль")	