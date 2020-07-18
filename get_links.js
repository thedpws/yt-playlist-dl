
const app = Application.currentApplication();
app.includeStandardAdditions = true;

//const playlist_id = app.displayDialog('Playlist id', { defaultAnswer: ''});
playlist_id = 'PLMf7voIq6C7ri7OahDXYfYdyzIeWS-w54'
//const keywordsFilepath = app.displayDialog('Keywords list file', { defaultAnswer: ''});
keywordsFilepath = '/Users/azvasquez/keywords';


// Getting the ytdn api key
ObjC.import('stdlib')
const apiKey = $.getenv('YTDN_API_KEY')

function writeFile(filepath, text){
  const fh = app.openForAccess(Path(filepath), {writePermission: true});
  app.setEof(fh, { to: 0})
  app.write(text, { to: fh, startingAt: app.getEof(fh)});
  app.closeAccess(fh);
}


function sendQuery(page_token){
  let items = []
  const playlist_url = `https://www.youtube.com/playlist?list=${playlist_id}`;
  const part = 'id,snippet'

  let query = `https://www.googleapis.com/youtube/v3/playlistItems?part=${part}&playlistId=${playlist_id}&key=${apiKey}`
  //const query = `https://www.googleapis.com/youtube/v3/playlistItems?part=${part}&playlistId=${playlist_id}&key=$YTDN_API_KEY`

  if (page_token)
      query += `&pageToken=${page_token}`


  const data = app.doShellScript(`curl "${query}"`);

  const responseData = JSON.parse(data)

  items = responseData.items
  console.log(items)

  if (responseData.nextPageToken){
    items.push(...sendQuery(responseData.nextPageToken));
  }
  return items;
}



const items = sendQuery(null)





function yt_url(video_id){
  return `https://youtu.be/${video_id}`;
}


const title_url_desc_tuples = items.map(item => [item.snippet.title, yt_url(item.snippet.resourceId.videoId), item.snippet.description])




function sanitize(s){
  return s.replace(/[^\x20-\x7E]+/g, '');
}


const keywordsList = app.read(Path(keywordsFilepath)).split('\n');
let usedItems = 'Features:\n';
const urls = []


title_url_desc_tuples.forEach(tuple => {
  let title;
  let url;
  let description;
  [title, url, description] = tuple;


  title = sanitize(title);
  const descHead = sanitize(description.split(' ').slice(0,10).join(' '));
  console.log(descHead);

  const correspondentName = descHead.replace(/.*[cC]orrespondent,? ([\w-]+ [\w-]+),? .*/, '$1');
  const bureauName = descHead.replace(/.*EBC (.*?) (Bureau )?[cC]orrespondent.*/, '$1') + ' Bureau';

  const keywordMatches = keywordsList.filter(keyword => description.includes(keyword) || title.includes(keyword));
  if (keywordMatches) {
    usedItems += ` - ${title} (${correspondentName}, ${bureauName}) ${url}\n`;
    urls.push(url);
  }
});




writeFile('./used_items', usedItems);

writeFile('./used_links', urls.join('\n'));
