import requests


url = 'https://api.trackdechets.beta.gouv.fr'
token = 'YOUR_TOKEN'
query = 'query { me { name } }'
r = requests.post(url, json={'query': query}, headers={'Authorization': 'Bearer %s' % token})

print(r.text)
