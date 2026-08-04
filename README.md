# Nine Men's Morris for Odoo

Play the classic strategy board game **Nine Men's Morris** directly within your
Odoo instance against an AI powered by a dedicated external backend service!

---

## Features

- **Interactive UI**: Clean, responsive game board inside Odoo.
- **AI Opponent Integration**: Play against an AI backend via API.

---

## Prerequisites

1. **Odoo Server**: Compatible with Odoo 19 (Community or Enterprise).
2. **AI API Backend**: A running instance of the Nine Men's Morris AI Backend
   (hosted separately). Refer to the
   **[AI Backend Repository](https://github.com/AustinATTS/nine-mens-morris-api)**
   for setup instructions.

---

## Installation

1. **Clone the Repository**:
   Clone or download this repository into your custom Odoo `custom_addons`
   folder:
   ```bash
   git clone https://github.com/AustinATTS/nine-mens-morris.git
   mv nine-mens-morris/nine_mens_morris path/to/odoo/custom_addons
   ```

2. **Update the Apps List:**
    - Log in to your Odoo instance as an **Administrator**.
    - Activate **Developer Mode** (Settings -> Activate the developer mode)
    - Navigate tto the **Apps** meny and click **Update Apps List**.

3. **Install Module:**
    - Search for `Nine Men's Morris`.
    - Click Install

---

## Setup & System Parameters Configuration

To connect this Odoo module to the API backend, you must configure some system
parameters (`ir.config_parameter`).

1. Go to **Settings -> Technical -> Parameters -> System Parameters**.
2. Create the following parameters:

| Key                            | Description                                         | Example Value                     |
|--------------------------------|-----------------------------------------------------|-----------------------------------|
| nine_mens_morris.ai_provider   | Used to let the app know that it should use the API | remote                            |
| nine_mens_morris.ai_remote_url | URL for where you have the API backend hosted.      | http://192.168.1.21:8787/evaluate |

---

## How to Play

1. Open **Nine Men's Morris** on your website (your-odoo-database.co.uk/nime-mens-morris/game_page)
2. The game follows three phases:
   - **Placing/Setting Phase**: Place your 9 men (or stones) on empty board spaces. Forming a row of 3 will create a **mill** which allows you to remove an opponent's piece.
   - **Moving Phase**: Slide pieces along the lines to adjacent point to try and form new mills, or block your opponent.
   - **Flying/Jumping Phase**: When reduced to 3 pieces, your pieces can *fly* to any empty space on the board.
3. When using the AI features, Odoo will send the current board state to the external API which will return a set of possible moves as well as the best move at that state,

---

## License

- **License:** LGPL-3
- **Developed By:** Me ([Austin ATTS](https://www.austinatts.co.uk))
