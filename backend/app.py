from flask import Flask, request
from flask_cors import CORS
from utils import OpenApiHandler, Setting
import os

app = Flask(__name__)
CORS(app)

request_handler = OpenApiHandler(os.environ['API_KEY'], Setting())

@app.route('/hashtags', methods = ['POST'])
def hashtags():
   input = request.get_json()['prompt']
   return request_handler.get_hashtags(input)

@app.route('/write', methods = ['POST'])
def write():
   requestJson = request.get_json()
   input = requestJson['prompt']
   context = requestJson['context']
   language = requestJson['language']
   model = requestJson['model']
   temperature = float(requestJson['temperature'])
   top_p = float(requestJson['top_p'])
   frequency_penalty = float(requestJson['frequency_penalty'])
   presence_penalty = float(requestJson['presence_penalty'])
   setting = Setting(model, temperature, frequency_penalty, presence_penalty, top_p)
   return request_handler.get_writing(input, context, language, setting)

if __name__ == "__main__":
    from waitress import serve
    serve(app, host="0.0.0.0", port=5000)