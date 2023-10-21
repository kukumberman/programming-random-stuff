import json
import os
import requests

URL_THUMB_FORMAT = "https://em-content.zobj.net/thumbs/60/google/350/{0}.png"
URL_IMAGE_FORMAT = "https://em-content.zobj.net/source/google/350/{0}.png"

with open("./result.json") as json_file:
    json_data = json.load(json_file)

base_directory_path = os.path.abspath("./emojis")
if not os.path.exists(base_directory_path):
    os.mkdir(base_directory_path)

for category in json_data:
    category_directory_path = os.path.join(base_directory_path, category["title"])
    if not os.path.exists(category_directory_path):
        os.mkdir(category_directory_path)

    for emoji_id in category["emojis"]:
        emoji_filename = emoji_id + ".png"
        emoji_path = os.path.join(category_directory_path, emoji_filename)
        emoji_url = URL_IMAGE_FORMAT.format(emoji_id)
        response = requests.get(emoji_url)
        with open(emoji_path, "wb") as new_file:
            new_file.write(response.content)
        print(category["title"], emoji_id)
