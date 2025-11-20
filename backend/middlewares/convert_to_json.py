from flask import jsonify

def init_convert_json_response(app):
    @app.after_request
    def convert_to_json(response):
        if isinstance(response, dict):
            response = jsonify(response)
        elif isinstance(response, list):
            response = jsonify(response)
        return response