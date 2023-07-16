from config import app, request_handler
from flask import Flask, request, jsonify

@app.route('/', methods = ['POST'])
def index():
   input = request.get_json()['prompt']
   output = jsonify(answer = request_handler.cot_request(input))
   return output