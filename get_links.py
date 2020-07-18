import requests
import json
import re
import os


import sys


playlist_id = sys.argv[2]
yt_api_key = os.environ.get('YTDN_API_KEY')

def build_query(page_token=None):

    global playlist_id, yt_api_key


    playlist_url = f'https://www.youtube.com/playlist?list={playlist_id}'
    part = 'id,snippet'
    query = f'https://www.googleapis.com/youtube/v3/playlistItems?part={part}&playlistId={playlist_id}&key={yt_api_key}'
    if page_token:
        query += f'&pageToken={page_token}'

    print(query)
    return query

query = build_query()
items = []


# Build items list
while True:
    response_data = requests.get(query).content
    response = json.loads(response_data)
    items.extend(response['items'])
    if not 'nextPageToken' in response:
        break
    query = build_query(response['nextPageToken'])



def yt_url(video_id):
    return f'https://youtu.be/{video_id}'

title_url_desc_tuples = [(title,yt_url(_id), desc)  for (title,_id, desc) in map(lambda i: (i['snippet']['title'], i['snippet']['resourceId']['videoId'], i['snippet']['description']), items)]


def sanitize(s):
    return s.encode('ascii', 'ignore').decode()

with open(sys.argv[1], 'r') as f:
    keywords = f.read().split('\n')
    print(keywords)




used_items = 'Featuring:\n'
urls = []

for title, url, desc in title_url_desc_tuples:

    title = sanitize(title)
    desc_head = sanitize(' '.join(desc.split()[:30]))

    correspondent_name = re.sub('.*[cC]orrespondent,? ([\\w-]+ [\\w-]+),? .*', '\\1',  desc_head)
    bureau_name = re.sub('.*EBC (.*?) (Bureau ?)[cC]orrespondent.*', '\\1',  desc_head)

    for keyword in keywords:
        if (keyword.lower() in title.lower() or keyword.lower() in desc_head.lower()):
            break
    else:
        continue

    used_items += f' - {title} ({correspondent_name}, {bureau_name}) {url}\n'
    urls.append(url)


#used_items = '\n'.join(used_items_lines)
with open('used_items', 'w') as f:
    f.write(used_items)

with open('used_links', 'w') as f:
    f.write('\n'.join(urls))

