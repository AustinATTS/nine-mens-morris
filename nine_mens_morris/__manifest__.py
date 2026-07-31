{
    'name': "Nine Men's Morris",
    'category': 'Austin ATTS',
    'sequence': 200,
    'website': 'https://www.austinatts.co.uk',
    'summary': "Nine Men's Morris OWL game for Odoo.",
    'version': '0.3.0',
    'depends': ['web', 'website'],
    'currency': 'EUR',
    'price': 0.00,
    "data": [
        "views/nine_mens_morris_game_page_templates.xml",
    ],
    'assets': {
        'web.assets_frontend': [
            'nine_mens_morris/static/src/scss/nine_mens_morris.scss',
            'nine_mens_morris/static/src/js/game_logic.js',
            'nine_mens_morris/static/src/js/nine_mens_morris_app.js',
            'nine_mens_morris/static/src/xml/app_template.xml',
        ],
    },
    'author': 'Austin Welsh-Graham',
    'license': 'LGPL-3',
    'installable': True,
    'application': True,
}