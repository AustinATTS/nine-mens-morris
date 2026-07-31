from odoo import http
from odoo.http import request

class NineMensMorrisController(http.Controller):
    @http.route('/nine-mens-morris/game_page', type='http', auth='public', website=True)
    def game_page(self):
        return request.render(
            'nine_mens_morris.game_page',
            {
                'session_info': request.env['ir.http'].get_frontend_session_info(),
            }
        )