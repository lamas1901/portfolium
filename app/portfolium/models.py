from flask_login import UserMixin

from portfolium import db, login_manager 

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


class User(db.Model,UserMixin):
    __tablename__ = "users"

    id          = db.Column(db.Integer,primary_key=True)
    username    = db.Column(db.String(50),nullable=False)
    email        = db.Column(db.String(320),nullable=False,unique=True)
    password    = db.Column(db.String(60),nullable=False)
    portfolios  = db.relationship(
        'Portfolio',
        backref='owner',
        passive_deletes=True
    )

    def __repr__(self):
        return f'''<User: {
            self.username
        }|{
            self.email
        }|{
            len(self.portfolios)
        }>'''

class Portfolio(db.Model):
    __tablename__  = 'portfolios'

    id    = db.Column(db.Integer,primary_key=True)
    owner_id        = db.Column(
        db.Integer,
        db.ForeignKey('users.id',ondelete='CASCADE'),
        nullable=False
    )
    name            = db.Column(db.String(50),nullable=False)
    number          = db.Column(db.Integer,nullable=False)
    data_current    = db.Column(db.JSON,nullable=False)
    data_optimized  = db.Column(db.JSON,nullable=False)
    optimize_timestamp   = db.Column(db.Integer,nullable=False)

class ConfirmRequest(db.Model):
    __tablename__ = 'confirm_requests'

    id          = db.Column(db.Integer,primary_key=True)
    username    = db.Column(db.String(50),nullable=False)
    email        = db.Column(db.String(320),nullable=False,unique=True)
    password    = db.Column(db.String(60),nullable=False)
    hash        = db.Column(db.String(16),nullable=True)

    def __repr__(self):
        return f"<{self.username}|{self.email}>"

class ResetPasswordRequest(db.Model):
    __tablename__ = 'reset_password_requests'

    id          = db.Column(db.Integer,primary_key=True)
    owner_id    = db.Column(db.Integer)
    hash        = db.Column(db.String(16),nullable=True)