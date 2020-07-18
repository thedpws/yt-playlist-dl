#!/bin/sh

# Get keywords list file

echo "Keywords file filename: "
read keywords_file

echo "Playlist id: "
read playlist_id

# Create used_links and used_items
python3 get_links.py $keywords_file $playlist_id

# List of video urls
cat used_links

# For the video description
cat used_items

# Download all urls in used_links
while read line; do youtube-dl -f bestvideo+bestaudio "$line"; done < used_links

# Convert all mkv videos into mp4
for file in *.mkv; do ffmpeg -i "$file" -pix_fmt yuv420p "$file.mp4"; done

# Signal done
nyancat
