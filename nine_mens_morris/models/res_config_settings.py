from odoo import models, fields


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    nine_mens_morris_ai_provider = fields.Selection(
        selection=[
            ('remote', 'Remote Bridge'),
            ('local', 'Local Bridge'),
        ],
        string='AI Provider',
        default='remote',
        config_parameter='nine_mens_morris.ai_provider',
    )

    nine_mens_morris_ai_remote_url = fields.Char(
        string='Remote Bridge URL',
        config_parameter='nine_mens_morris.ai_remote_url',
    )

    nine_mens_morris_ai_local_command = fields.Char(
        string='Local Bridge Command',
        config_parameter='nine_mens_morris.ai_local_command',
    )
