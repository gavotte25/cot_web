from flask import Flask
from flask_cors import CORS
from utils import OpenApiHandler, Setting

app = Flask(__name__)
CORS(app)

ip_config = {
    'host': 'localhost',
    'port': 8000
}

setting = Setting()

request_handler = OpenApiHandler(setting)