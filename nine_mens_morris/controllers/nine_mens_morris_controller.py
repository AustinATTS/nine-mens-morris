import json
import shlex
import subprocess
import urllib.error
import urllib.request

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

    @http.route('/nine-mens-morris/ai/move', type='json', auth='public', website=True, csrf=False)
    def ai_move(self, board, currentPlayer=1, phase='placement', totalNumStonesMissing=0, searchDepth=4):
        is_setting_phase = phase == 'placement'

        payload = {
            'board': board,
            'currentPlayer': currentPlayer,
            'settingPhase': is_setting_phase,
            'totalNumStonesMissing': totalNumStonesMissing if is_setting_phase else 0,
            'searchDepth': searchDepth,
        }

        params_model = request.env['ir.config_parameter'].sudo()
        provider = (self._get_config_param(params_model, 'nine_mens_morris.ai_provider') or 'remote').strip().lower()

        if provider == 'local':
            return self._call_local_bridge(params_model, payload)
        return self._call_remote_bridge(params_model, payload)

    def _get_config_param(self, params_model, key):
        get_param = getattr(params_model, 'get_param', None)
        if callable(get_param):
            return get_param(key)

        param_record = params_model.search([('key', '=', key)], limit=1)
        return param_record.value if param_record else None

    def _call_local_bridge(self, params_model, payload):
        command_text = (self._get_config_param(params_model, 'nine_mens_morris.ai_local_command') or '').strip()
        if not command_text:
            return {
                'success': False,
                'error': "Missing config parameter 'nine_mens_morris.ai_local_command'.",
            }

        try:
            command = shlex.split(command_text)
            completed = subprocess.run(
                command,
                input=json.dumps(payload),
                text=True,
                capture_output=True,
                timeout=10,
                check=False,
            )
        except Exception as ex:
            return {'success': False, 'error': f'Local bridge execution failed: {ex}'}

        stdout = (completed.stdout or '').strip()
        if not stdout:
            return {
                'success': False,
                'error': completed.stderr or 'Local bridge returned no output.',
            }

        try:
            return json.loads(stdout)
        except json.JSONDecodeError:
            return {
                'success': False,
                'error': completed.stderr or 'Local bridge returned invalid JSON.',
            }

    def _call_remote_bridge(self, params_model, payload):
        remote_url = (self._get_config_param(params_model, 'nine_mens_morris.ai_remote_url') or '').strip()
        if not remote_url:
            return {
                'success': False,
                'error': "Missing config parameter 'nine_mens_morris.ai_remote_url'.",
            }

        try:
            request_payload = json.dumps(payload).encode('utf-8')
            remote_request = urllib.request.Request(
                remote_url,
                data=request_payload,
                headers={'Content-Type': 'application/json'},
                method='POST',
            )
            with urllib.request.urlopen(remote_request, timeout=10) as response:
                response_payload = response.read().decode('utf-8')
            return json.loads(response_payload)
        except urllib.error.HTTPError as ex:
            return {'success': False, 'error': f'Remote bridge HTTP error {ex.code}: {ex.reason}'}
        except urllib.error.URLError as ex:
            return {'success': False, 'error': f'Remote bridge URL error: {ex.reason}'}
        except json.JSONDecodeError:
            return {'success': False, 'error': 'Remote bridge returned invalid JSON.'}
        except Exception as ex:
            return {'success': False, 'error': f'Remote bridge failed: {ex}'}