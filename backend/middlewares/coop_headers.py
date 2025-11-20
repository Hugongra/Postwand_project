
def init_coop_headers(app):
    @app.after_request
    def add_coop_headers(response):
        response.headers['Cross-Origin-Opener-Policy'] = 'same-origin-allow-popups'
        response.headers['Cross-Origin-Embedder-Policy'] = 'unsafe-none'
        return response

   